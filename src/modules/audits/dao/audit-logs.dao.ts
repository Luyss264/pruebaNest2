import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../../../database/entities/audit-log.entity';

@Injectable()
export class AuditLogsDao {
  constructor(@InjectRepository(AuditLogEntity) private readonly repository: Repository<AuditLogEntity>) {}

  async create(input: Partial<AuditLogEntity>): Promise<AuditLogEntity> {
    return this.repository.save(this.repository.create(input));
  }

  list(limit = 100): Promise<AuditLogEntity[]> {
    return this.repository.find({ relations: { actor: true }, order: { createdAt: 'DESC' }, take: Math.min(Math.max(limit, 1), 500) });
  }
}
