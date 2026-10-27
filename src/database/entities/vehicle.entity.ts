import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { VehicleStatus } from '../../common/types/enums';
import { MaintenanceEntity } from './maintenance.entity';

@Entity({ name: 'vehicles' })
@Index('UQ_vehicles_plate', ['plate'], { unique: true })
export class VehicleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 20 })
  plate!: string;

  @Column({ type: 'varchar', length: 80 })
  brand!: string;

  @Column({ type: 'varchar', length: 100 })
  model!: string;

  @Column({ type: 'smallint' })
  year!: number;

  @Column({ type: 'integer', default: 0 })
  mileage!: number;

  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
  status!: VehicleStatus;

  // Inverse side of MaintenanceEntity.vehicle.
  @OneToMany(() => MaintenanceEntity, (maintenance) => maintenance.vehicle)
  maintenances!: MaintenanceEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
