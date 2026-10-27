import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { MaintenanceEntity } from '../../../database/entities/maintenance.entity';
import { VehicleEntity } from '../../../database/entities/vehicle.entity';
import { ACTIVE_MAINTENANCE_STATUSES, MaintenanceStatus, MaintenanceType, VehicleStatus } from '../../../common/types/enums';

export interface MaintenanceFilters {
  status?: MaintenanceStatus;
  vehicleId?: number;
  mechanicId?: number;
  activeOnly?: boolean;
}

export interface MaintenanceCreateInput {
  referenceCode?: string | null;
  type: MaintenanceType;
  description: string;
  mileage: number;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  status?: MaintenanceStatus;
  workPerformed?: string | null;
  finalCost?: number | null;
  finishedAt?: Date | null;
  finalMileage?: number | null;
  vehicleId: number;
  mechanicId: number;
  workshopId: number;
}

export interface MaintenanceUpdateInput {
  status?: MaintenanceStatus;
  workPerformed?: string | null;
  finalCost?: number | null;
  finishedAt?: Date | null;
  finalMileage?: number | null;
}

export interface VehicleStateUpdate {
  status?: VehicleStatus;
  mileage?: number;
}

@Injectable()
export class MaintenancesDao {
  constructor(@InjectRepository(MaintenanceEntity) private readonly repository: Repository<MaintenanceEntity>) {}

  findById(id: number): Promise<MaintenanceEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: { vehicle: true, mechanic: { user: true }, workshop: true },
    });
  }

  findByReferenceCode(referenceCode: string): Promise<MaintenanceEntity | null> {
    return this.repository.findOne({ where: { referenceCode }, relations: { vehicle: true, mechanic: true, workshop: true } });
  }

  async create(input: MaintenanceCreateInput): Promise<MaintenanceEntity> {
    const entity = this.repository.create(input);
    const saved = await this.repository.save(entity);
    const result = await this.findById(saved.id);
    if (!result) throw new Error('Maintenance disappeared after creation.');
    return result;
  }

  async update(id: number, input: MaintenanceUpdateInput): Promise<MaintenanceEntity> {
    await this.repository.update(id, input);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Maintenance disappeared after update.');
    return updated;
  }

  async list(filters: MaintenanceFilters = {}): Promise<MaintenanceEntity[]> {
    const query = this.repository.createQueryBuilder('maintenance')
      .leftJoinAndSelect('maintenance.vehicle', 'vehicle')
      .leftJoinAndSelect('maintenance.mechanic', 'mechanic')
      .leftJoinAndSelect('maintenance.workshop', 'workshop')
      .leftJoinAndSelect('mechanic.user', 'user');
    if (filters.status) query.andWhere('maintenance.status = :status', { status: filters.status });
    if (filters.vehicleId) query.andWhere('maintenance.vehicleId = :vehicleId', { vehicleId: filters.vehicleId });
    if (filters.mechanicId) query.andWhere('maintenance.mechanicId = :mechanicId', { mechanicId: filters.mechanicId });
    if (filters.activeOnly) query.andWhere('maintenance.status IN (:...activeStatuses)', { activeStatuses: [...ACTIVE_MAINTENANCE_STATUSES] });
    return query.orderBy('maintenance.scheduledStartAt', 'DESC').getMany();
  }

  async findActiveForVehicle(vehicleId: number, exceptId?: number): Promise<MaintenanceEntity | null> {
    const query = this.repository.createQueryBuilder('maintenance')
      .where('maintenance.vehicleId = :vehicleId', { vehicleId })
      .andWhere('maintenance.status IN (:...statuses)', { statuses: [...ACTIVE_MAINTENANCE_STATUSES] });
    if (exceptId !== undefined) query.andWhere('maintenance.id != :exceptId', { exceptId });
    return query.getOne();
  }

  async findMechanicScheduleConflict(
    mechanicId: number,
    start: Date,
    end: Date,
    exceptId?: number,
  ): Promise<MaintenanceEntity | null> {
    const query = this.repository.createQueryBuilder('maintenance')
      .where('maintenance.mechanicId = :mechanicId', { mechanicId })
      .andWhere('maintenance.status IN (:...statuses)', { statuses: [...ACTIVE_MAINTENANCE_STATUSES] })
      // Strict inequality intentionally permits one job to begin exactly when the previous one ends.
      .andWhere('maintenance.scheduledStartAt < :endAt', { endAt: end })
      .andWhere('maintenance.scheduledEndAt > :startAt', { startAt: start });
    if (exceptId !== undefined) query.andWhere('maintenance.id != :exceptId', { exceptId });
    return query.getOne();
  }

  async transitionWithVehicleUpdate(
    id: number,
    maintenanceChanges: MaintenanceUpdateInput,
    vehicleId: number,
    vehicleChanges: VehicleStateUpdate,
  ): Promise<MaintenanceEntity> {
    // Keep the maintenance state and vehicle availability change atomic in one database transaction.
    await this.repository.manager.transaction(async (manager: EntityManager) => {
      const maintenanceRepository = manager.getRepository(MaintenanceEntity);
      const vehicleRepository = manager.getRepository(VehicleEntity);
      await maintenanceRepository.update(id, maintenanceChanges);
      await vehicleRepository.update(vehicleId, vehicleChanges);
    });
    const updated = await this.findById(id);
    if (!updated) throw new Error('Maintenance disappeared after transition.');
    return updated;
  }
}
