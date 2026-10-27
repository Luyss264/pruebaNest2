import { Injectable } from '@nestjs/common';
import { AuditLogsDao } from './dao/audit-logs.dao';

@Injectable()
export class AuditsService {
  constructor(private readonly auditLogsDao: AuditLogsDao) {}

  record(action: string, resource: string, resourceId: number | string | null, actorId: number | null, details?: Record<string, unknown>) {
    return this.auditLogsDao.create({ action, resource, resourceId: resourceId === null ? null : String(resourceId), actorId, details: details ?? null });
  }

  list(limit?: number) {
    return this.auditLogsDao.list(limit);
  }
}
