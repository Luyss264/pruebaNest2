import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleEntity } from '../../../database/entities/vehicle.entity';

@Injectable()
export class VehiclesDao {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly repository: Repository<VehicleEntity>,
  ) {}

  findById(id: number): Promise<VehicleEntity | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  findByPlate(plate: string): Promise<VehicleEntity | null> {
    return this.repository
      .createQueryBuilder('vehicle')
      .where('UPPER(vehicle.plate) = UPPER(:plate)', { plate })
      .getOne();
  }

  create(input: Partial<VehicleEntity>): Promise<VehicleEntity> {
    const entity = this.repository.create(input);
    return this.repository.save(entity);
  }

  async update(
    id: number,
    input: Partial<VehicleEntity>,
  ): Promise<VehicleEntity> {
    const existing = await this.repository.findOne({
      where: { id },
    });

    if (!existing) {
      throw new Error('Vehicle disappeared before update.');
    }

    // Ignore undefined values so omitted properties remain unchanged.
    const changes = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    );

    Object.assign(existing, changes);

    await this.repository.save(existing);

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error('Vehicle disappeared after update.');
    }

    return updated;
  }

  list(): Promise<VehicleEntity[]> {
    return this.repository.find({
      order: { id: 'ASC' },
    });
  }
}
