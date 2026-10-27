import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceEntity } from '../../database/entities/maintenance.entity';
import { VehicleEntity } from '../../database/entities/vehicle.entity';
import { MechanicEntity } from '../../database/entities/mechanic.entity';
import { WorkshopEntity } from '../../database/entities/workshop.entity';
import { MaintenancesDao } from './dao/maintenances.dao';
import { VehiclesDao } from '../vehicles/dao/vehicles.dao';
import { MechanicsDao } from '../mechanics/dao/mechanics.dao';
import { WorkshopsDao } from '../workshops/dao/workshops.dao';
import { MaintenancesService } from './maintenances.service';
import { MaintenancesController } from './maintenances.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceEntity, VehicleEntity, MechanicEntity, WorkshopEntity])],
  controllers: [MaintenancesController],
  providers: [MaintenancesDao, VehiclesDao, MechanicsDao, WorkshopsDao, MaintenancesService],
  exports: [MaintenancesDao, MaintenancesService],
})
export class MaintenancesModule {}
