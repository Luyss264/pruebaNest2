import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { WorkshopStatus } from '../../common/types/enums';
import { MaintenanceEntity } from './maintenance.entity';

@Entity({ name: 'workshops' })
export class WorkshopEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 140 })
  name!: string;

  @Column({ type: 'varchar', length: 240 })
  address!: string;

  @Column({ type: 'enum', enum: WorkshopStatus, default: WorkshopStatus.ACTIVE })
  status!: WorkshopStatus;

  // Inverse side of MaintenanceEntity.workshop.
  @OneToMany(() => MaintenanceEntity, (maintenance) => maintenance.workshop)
  maintenances!: MaintenanceEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
