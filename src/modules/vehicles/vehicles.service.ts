import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { VehicleStatus } from '../../common/types/enums';
import { VehiclesDao } from './dao/vehicles.dao';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { MaintenancesDao } from '../maintenances/dao/maintenances.dao';
import { AuditsService } from '../audits/audits.service';

@Injectable()
export class VehiclesService {
  constructor(private readonly vehiclesDao: VehiclesDao, private readonly maintenancesDao: MaintenancesDao, private readonly auditsService: AuditsService) {}

  list() { return this.vehiclesDao.list(); }

  async findById(id: number) {
    const vehicle = await this.vehiclesDao.findById(id);
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} was not found.`);
    return vehicle;
  }

  async findByPlate(plate: string) {
    const vehicle = await this.vehiclesDao.findByPlate(plate);
    if (!vehicle) throw new NotFoundException(`Vehicle with plate ${plate} was not found.`);
    return vehicle;
  }

  async create(dto: CreateVehicleDto, actorId: number) {
    const normalizedPlate = dto.plate.trim().toUpperCase();
    if (await this.vehiclesDao.findByPlate(normalizedPlate)) throw new ConflictException(`Vehicle plate ${normalizedPlate} is already registered.`);
    const vehicle = await this.vehiclesDao.create({ ...dto, plate: normalizedPlate, status: VehicleStatus.AVAILABLE });
    await this.auditsService.record('VEHICLE_CREATED', 'VEHICLE', vehicle.id, actorId, { plate: vehicle.plate });
    return vehicle;
  }

  async update(id: number, dto: UpdateVehicleDto, actorId: number) {
    const existing = await this.findById(id);
    if (dto.plate) {
      const other = await this.vehiclesDao.findByPlate(dto.plate.trim().toUpperCase());
      if (other && other.id !== id) throw new ConflictException(`Vehicle plate ${dto.plate} is already registered.`);
    }
    if (dto.mileage !== undefined && dto.mileage < existing.mileage) {
      throw new BadRequestException('Vehicle mileage cannot be reduced.');
    }
    if (existing.status === VehicleStatus.IN_MAINTENANCE && dto.status === VehicleStatus.AVAILABLE) {
      throw new ConflictException('A vehicle in maintenance can only become available through a maintenance transition.');
    }
    if (dto.status === VehicleStatus.INACTIVE || dto.status === VehicleStatus.AVAILABLE) {
      const active = await this.maintenancesDao.findActiveForVehicle(id);
      if (active) throw new ConflictException(`Vehicle ${existing.plate} has an active maintenance and its status cannot be changed manually.`);
    }
    const updated = await this.vehiclesDao.update(id, { ...dto, plate: dto.plate?.trim().toUpperCase() });
    await this.auditsService.record('VEHICLE_UPDATED', 'VEHICLE', id, actorId, { changedFields: Object.keys(dto) });
    return updated;
  }

  async deactivate(id: number, actorId: number) {
    const vehicle = await this.findById(id);
    if (vehicle.status === VehicleStatus.IN_MAINTENANCE || await this.maintenancesDao.findActiveForVehicle(id)) {
      throw new ConflictException('A vehicle with an active maintenance cannot be inactivated.');
    }
    const updated = await this.vehiclesDao.update(id, { status: VehicleStatus.INACTIVE });
    await this.auditsService.record('VEHICLE_INACTIVATED', 'VEHICLE', id, actorId);
    return updated;
  }
}
