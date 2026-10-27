import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { VehicleEntity } from './entities/vehicle.entity';
import { MechanicEntity } from './entities/mechanic.entity';
import { WorkshopEntity } from './entities/workshop.entity';
import { MaintenanceEntity } from './entities/maintenance.entity';
import { UsersDao } from '../modules/users/dao/users.dao';
import { VehiclesDao } from '../modules/vehicles/dao/vehicles.dao';
import { MechanicsDao } from '../modules/mechanics/dao/mechanics.dao';
import { WorkshopsDao } from '../modules/workshops/dao/workshops.dao';
import { MaintenancesDao } from '../modules/maintenances/dao/maintenances.dao';
import { SeederService } from './seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, VehicleEntity, MechanicEntity, WorkshopEntity, MaintenanceEntity])],
  providers: [UsersDao, VehiclesDao, MechanicsDao, WorkshopsDao, MaintenancesDao, SeederService],
  exports: [SeederService],
})
export class SeederModule {}
