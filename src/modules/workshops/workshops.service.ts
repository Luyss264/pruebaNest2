import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkshopStatus } from '../../common/types/enums';
import { WorkshopsDao } from './dao/workshops.dao';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { AuditsService } from '../audits/audits.service';

@Injectable()
export class WorkshopsService {
  constructor(private readonly workshopsDao: WorkshopsDao, private readonly auditsService: AuditsService) {}

  listActive() { return this.workshopsDao.listActive(); }
  list() { return this.workshopsDao.list(); }

  async findById(id: number) {
    const workshop = await this.workshopsDao.findById(id);
    if (!workshop) throw new NotFoundException(`Workshop ${id} was not found.`);
    return workshop;
  }

  async create(dto: CreateWorkshopDto, actorId: number) {
    const workshop = await this.workshopsDao.create({ ...dto, name: dto.name.trim(), address: dto.address.trim(), status: dto.status ?? WorkshopStatus.ACTIVE });
    await this.auditsService.record('WORKSHOP_CREATED', 'WORKSHOP', workshop.id, actorId, { name: workshop.name });
    return workshop;
  }

  async update(id: number, dto: UpdateWorkshopDto, actorId: number) {
    await this.findById(id);
    const updated = await this.workshopsDao.update(id, {
      ...dto, name: dto.name?.trim(), address: dto.address?.trim(),
    });
    await this.auditsService.record('WORKSHOP_UPDATED', 'WORKSHOP', id, actorId, { changedFields: Object.keys(dto) });
    return updated;
  }

  async setStatus(id: number, status: WorkshopStatus, actorId: number) {
    const workshop = await this.findById(id);
    const updated = await this.workshopsDao.update(id, { status });
    await this.auditsService.record(status === WorkshopStatus.ACTIVE ? 'WORKSHOP_ACTIVATED' : 'WORKSHOP_INACTIVATED', 'WORKSHOP', id, actorId, { previousStatus: workshop.status, status });
    return updated;
  }
}
