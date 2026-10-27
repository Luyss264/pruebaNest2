import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { AuditLogsDao } from './dao/audit-logs.dao';
import { AuditsService } from './audits.service';
import { AuditsController } from './audits.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AuditsController],
  providers: [AuditLogsDao, AuditsService],
  exports: [AuditsService],
})
export class AuditsModule {}
