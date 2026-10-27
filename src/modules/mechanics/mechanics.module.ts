import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MechanicEntity } from '../../database/entities/mechanic.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { MechanicsDao } from './dao/mechanics.dao';
import { MechanicsService } from './mechanics.service';
import { MechanicsController } from './mechanics.controller';
import { UsersDao } from '../users/dao/users.dao';

@Module({
  imports: [TypeOrmModule.forFeature([MechanicEntity, UserEntity])],
  controllers: [MechanicsController],
  providers: [MechanicsDao, UsersDao, MechanicsService],
  exports: [MechanicsDao, MechanicsService],
})
export class MechanicsModule {}
