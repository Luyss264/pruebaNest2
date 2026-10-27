import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleEntity } from '../../database/entities/vehicle.entity';
import { MaintenanceEntity } from '../../database/entities/maintenance.entity';
import { VehiclesDao } from './dao/vehicles.dao';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { MaintenancesDao } from '../maintenances/dao/maintenances.dao';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleEntity, MaintenanceEntity])],
  controllers: [VehiclesController],
  providers: [VehiclesDao, MaintenancesDao, VehiclesService],
  exports: [VehiclesDao, VehiclesService],
})
export class VehiclesModule {}
