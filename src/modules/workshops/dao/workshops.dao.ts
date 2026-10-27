import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkshopEntity } from '../../../database/entities/workshop.entity';
import { WorkshopStatus } from '../../../common/types/enums';

@Injectable()
export class WorkshopsDao {
  constructor(
    @InjectRepository(WorkshopEntity)
    private readonly repository: Repository<WorkshopEntity>,
  ) {}

  findById(id: number): Promise<WorkshopEntity | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  findByName(name: string): Promise<WorkshopEntity | null> {
    return this.repository
      .createQueryBuilder('workshop')
      .where('LOWER(workshop.name) = LOWER(:name)', { name })
      .getOne();
  }

  async create(
    input: Partial<WorkshopEntity>,
  ): Promise<WorkshopEntity> {
    const entity = this.repository.create(input);
    return this.repository.save(entity);
  }

  async update(
    id: number,
    input: Partial<WorkshopEntity>,
  ): Promise<WorkshopEntity> {
    const existing = await this.repository.findOne({
      where: { id },
    });

    if (!existing) {
      throw new Error('Workshop disappeared before update.');
    }

    // Preserve existing values when input properties are undefined.
    const changes = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    );

    Object.assign(existing, changes);

    await this.repository.save(existing);

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error('Workshop disappeared after update.');
    }

    return updated;
  }

  listActive(): Promise<WorkshopEntity[]> {
    return this.repository.find({
      where: { status: WorkshopStatus.ACTIVE },
      order: { id: 'ASC' },
    });
  }

  list(): Promise<WorkshopEntity[]> {
    return this.repository.find({
      order: { id: 'ASC' },
    });
  }
}
