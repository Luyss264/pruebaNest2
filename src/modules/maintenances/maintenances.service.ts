import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MaintenanceStatus, VehicleStatus, MechanicStatus, WorkshopStatus, UserRole } from '../../common/types/enums';
import { JwtUser } from '../../common/types/jwt-user';
import { VehiclesDao } from '../vehicles/dao/vehicles.dao';
import { MechanicsDao } from '../mechanics/dao/mechanics.dao';
import { WorkshopsDao } from '../workshops/dao/workshops.dao';
import { MaintenancesDao, MaintenanceFilters } from './dao/maintenances.dao';
import type { MaintenanceUpdateInput, VehicleStateUpdate } from './dao/maintenances.dao';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { AuditsService } from '../audits/audits.service';

type MaintenanceRecord = NonNullable<Awaited<ReturnType<MaintenancesDao['findById']>>>;

@Injectable()
export class MaintenancesService {
  constructor(
    private readonly maintenancesDao: MaintenancesDao,
    private readonly vehiclesDao: VehiclesDao,
    private readonly mechanicsDao: MechanicsDao,
    private readonly workshopsDao: WorkshopsDao,
    private readonly auditsService: AuditsService,
  ) {}

  list(filters?: MaintenanceFilters) { return this.maintenancesDao.list(filters); }
  listActive() { return this.maintenancesDao.list({ activeOnly: true }); }

  async create(dto: CreateMaintenanceDto, actorId: number) {
    const start = new Date(dto.scheduledStartAt);
    const end = new Date(dto.scheduledEndAt);
    if (end.getTime() <= start.getTime()) throw new BadRequestException('scheduledEndAt must be later than scheduledStartAt.');

    const vehicle = await this.vehiclesDao.findById(dto.vehicleId);
    if (!vehicle) throw new NotFoundException(`Vehicle ${dto.vehicleId} was not found.`);
    if (vehicle.status === VehicleStatus.INACTIVE) throw new ConflictException('An INACTIVE vehicle cannot be assigned to a new maintenance.');
    if (vehicle.status !== VehicleStatus.AVAILABLE) throw new ConflictException(`Vehicle ${vehicle.plate} is not AVAILABLE.`);
    const existingVehicleMaintenance = await this.maintenancesDao.findActiveForVehicle(vehicle.id);
    if (existingVehicleMaintenance) throw new ConflictException(`Vehicle ${vehicle.plate} already has an active maintenance.`);
    if (dto.mileage < vehicle.mileage) throw new BadRequestException(`Maintenance mileage cannot be lower than the vehicle mileage (${vehicle.mileage}).`);

    const mechanic = await this.mechanicsDao.findById(dto.mechanicId);
    if (!mechanic) throw new NotFoundException(`Mechanic ${dto.mechanicId} was not found.`);
    if (mechanic.status !== MechanicStatus.ACTIVE) throw new ConflictException('An inactive mechanic cannot be assigned to a new maintenance.');
    const workshop = await this.workshopsDao.findById(dto.workshopId);
    if (!workshop) throw new NotFoundException(`Workshop ${dto.workshopId} was not found.`);
    if (workshop.status !== WorkshopStatus.ACTIVE) throw new ConflictException('An inactive workshop cannot be assigned to a new maintenance.');

    const conflict = await this.maintenancesDao.findMechanicScheduleConflict(mechanic.id, start, end);
    if (conflict) throw new ConflictException(`Mechanic ${mechanic.name} already has an active maintenance overlapping this time slot.`);

    const maintenance = await this.maintenancesDao.create({
      referenceCode: dto.referenceCode?.trim() || null,
      type: dto.type,
      description: dto.description.trim(),
      mileage: dto.mileage,
      scheduledStartAt: start,
      scheduledEndAt: end,
      status: MaintenanceStatus.SCHEDULED,
      vehicleId: vehicle.id,
      mechanicId: mechanic.id,
      workshopId: workshop.id,
    });
    await this.auditsService.record('MAINTENANCE_CREATED', 'MAINTENANCE', maintenance.id, actorId, { vehicleId: vehicle.id, mechanicId: mechanic.id, workshopId: workshop.id, type: dto.type });
    return maintenance;
  }

  async getByIdForUser(id: number, user: JwtUser) {
    const maintenance = await this.maintenancesDao.findById(id);
    if (!maintenance) throw new NotFoundException(`Maintenance ${id} was not found.`);
    this.assertCanAccess(maintenance, user);
    return maintenance;
  }

  async listForTechnician(user: JwtUser) {
    // Resolve the current mechanic relationship from the database rather than trusting a possibly stale JWT claim.
    const mechanic = await this.mechanicsDao.findByUserId(user.sub);
    if (!mechanic) throw new ForbiddenException('This account is not linked to a mechanic profile.');
    return this.maintenancesDao.list({ mechanicId: mechanic.id });
  }

  async historyForVehicle(vehicleId: number) {
    const vehicle = await this.vehiclesDao.findById(vehicleId);
    if (!vehicle) throw new NotFoundException(`Vehicle ${vehicleId} was not found.`);
    return this.maintenancesDao.list({ vehicleId });
  }

  async historyByVehicleIdOrPlate(identifier: string) {
    const vehicle = /^\d+$/.test(identifier)
      ? await this.vehiclesDao.findById(Number(identifier))
      : await this.vehiclesDao.findByPlate(identifier);
    if (!vehicle) throw new NotFoundException(`Vehicle ${identifier} was not found.`);
    const maintenances = await this.maintenancesDao.list({ vehicleId: vehicle.id });
    return {
      vehicle: {
        id: vehicle.id, plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model,
        available: vehicle.status === VehicleStatus.AVAILABLE,
      },
      maintenances: maintenances.map((item) => ({
        id: item.id, type: item.type, status: item.status, description: item.description,
        mileage: item.mileage, cost: item.finalCost ?? null, finishedAt: item.finishedAt ?? null,
        mechanic: { id: item.mechanic.id, name: item.mechanic.name },
        workshop: { id: item.workshop.id, name: item.workshop.name },
      })),
    };
  }

  async updateStatus(id: number, dto: UpdateMaintenanceStatusDto, user: JwtUser) {
    const maintenance = await this.maintenancesDao.findById(id);
    if (!maintenance) throw new NotFoundException(`Maintenance ${id} was not found.`);
    this.assertCanAccess(maintenance, user);

    const allowedTransitions: Record<MaintenanceStatus, MaintenanceStatus[]> = {
      [MaintenanceStatus.SCHEDULED]: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED],
      [MaintenanceStatus.IN_PROGRESS]: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
      [MaintenanceStatus.COMPLETED]: [],
      [MaintenanceStatus.CANCELLED]: [],
    };
    if (!allowedTransitions[maintenance.status].includes(dto.status)) {
      throw new ConflictException(`Invalid maintenance transition: ${maintenance.status} cannot change to ${dto.status}.`);
    }

    const vehicle = maintenance.vehicle;
    const changes: MaintenanceUpdateInput = { status: dto.status };
    let vehicleChanges: VehicleStateUpdate = {};

    if (dto.status === MaintenanceStatus.IN_PROGRESS) {
      if (vehicle.status !== VehicleStatus.AVAILABLE) throw new ConflictException('Only an AVAILABLE vehicle can enter maintenance.');
      const otherActive = await this.maintenancesDao.findActiveForVehicle(vehicle.id, maintenance.id);
      if (otherActive) throw new ConflictException(`Vehicle ${vehicle.plate} already has another active maintenance.`);
      vehicleChanges = { status: VehicleStatus.IN_MAINTENANCE };
    } else if (dto.status === MaintenanceStatus.COMPLETED) {
      if (!dto.workPerformed?.trim() || dto.finalCost === undefined || !dto.finishedAt || dto.finalMileage === undefined) {
        throw new BadRequestException('Completing a maintenance requires workPerformed, finalCost, finishedAt, and finalMileage.');
      }
      if (dto.finalMileage < maintenance.mileage || dto.finalMileage < vehicle.mileage) {
        throw new BadRequestException('finalMileage cannot be lower than the maintenance mileage or the current vehicle mileage.');
      }
      const finishedAt = new Date(dto.finishedAt);
      if (Number.isNaN(finishedAt.getTime())) throw new BadRequestException('finishedAt must be a valid ISO date.');
      changes.workPerformed = dto.workPerformed.trim();
      changes.finalCost = dto.finalCost;
      changes.finishedAt = finishedAt;
      changes.finalMileage = dto.finalMileage;
      vehicleChanges = { status: VehicleStatus.AVAILABLE, mileage: dto.finalMileage };
    } else if (dto.status === MaintenanceStatus.CANCELLED && maintenance.status === MaintenanceStatus.IN_PROGRESS) {
      vehicleChanges = { status: VehicleStatus.AVAILABLE };
    }

    let updated: MaintenanceRecord;
    if (Object.keys(vehicleChanges).length > 0) {
      updated = await this.maintenancesDao.transitionWithVehicleUpdate(id, changes, vehicle.id, vehicleChanges);
    } else {
      updated = await this.maintenancesDao.update(id, changes);
    }
    await this.auditsService.record('MAINTENANCE_STATUS_CHANGED', 'MAINTENANCE', id, user.sub, {
      previousStatus: maintenance.status, status: dto.status,
      ...(dto.status === MaintenanceStatus.COMPLETED ? { finalCost: dto.finalCost, finalMileage: dto.finalMileage } : {}),
    });
    return updated;
  }

  private assertCanAccess(maintenance: MaintenanceRecord, user: JwtUser): void {
    if (user.role === UserRole.ADMIN) return;
    if (user.role !== UserRole.TECHNICIAN || !maintenance.mechanic.user || maintenance.mechanic.user.id !== user.sub) {
      throw new ForbiddenException('Technicians can only access and update their own assigned maintenances.');
    }
  }
}
