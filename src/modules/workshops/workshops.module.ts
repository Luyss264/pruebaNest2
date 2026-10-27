import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopEntity } from '../../database/entities/workshop.entity';
import { WorkshopsDao } from './dao/workshops.dao';
import { WorkshopsService } from './workshops.service';
import { WorkshopsController } from './workshops.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WorkshopEntity])],
  controllers: [WorkshopsController],
  providers: [WorkshopsDao, WorkshopsService],
  exports: [WorkshopsDao, WorkshopsService],
})
export class WorkshopsModule {}
