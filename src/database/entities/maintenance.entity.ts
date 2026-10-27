import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MaintenanceStatus, MaintenanceType } from '../../common/types/enums';
import { VehicleEntity } from './vehicle.entity';
import { MechanicEntity } from './mechanic.entity';
import { WorkshopEntity } from './workshop.entity';

const numericToNumber = {
  to: (value: number | null | undefined) => value,
  from: (value: string | number | null) => (value === null ? null : Number(value)),
};

@Entity({ name: 'maintenances' })
@Index('IDX_maintenances_vehicle_status', ['vehicleId', 'status'])
@Index('IDX_maintenances_mechanic_schedule', ['mechanicId', 'scheduledStartAt', 'scheduledEndAt'])
export class MaintenanceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'reference_code', type: 'varchar', length: 80, nullable: true, unique: true })
  referenceCode?: string | null;

  @Column({ type: 'enum', enum: MaintenanceType })
  type!: MaintenanceType;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'integer' })
  mileage!: number;

  @Column({ name: 'scheduled_start_at', type: 'timestamptz' })
  scheduledStartAt!: Date;

  @Column({ name: 'scheduled_end_at', type: 'timestamptz' })
  scheduledEndAt!: Date;

  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.SCHEDULED })
  status!: MaintenanceStatus;

  @Column({ name: 'work_performed', type: 'text', nullable: true })
  workPerformed?: string | null;

  @Column({ name: 'final_cost', type: 'numeric', precision: 12, scale: 2, nullable: true, transformer: numericToNumber })
  finalCost?: number | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt?: Date | null;

  @Column({ name: 'final_mileage', type: 'integer', nullable: true })
  finalMileage?: number | null;

  @Column({ name: 'vehicle_id', type: 'integer' })
  vehicleId!: number;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.maintenances, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: VehicleEntity;

  @Column({ name: 'mechanic_id', type: 'integer' })
  mechanicId!: number;

  @ManyToOne(() => MechanicEntity, (mechanic) => mechanic.maintenances, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'mechanic_id' })
  mechanic!: MechanicEntity;

  @Column({ name: 'workshop_id', type: 'integer' })
  workshopId!: number;

  @ManyToOne(() => WorkshopEntity, (workshop) => workshop.maintenances, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workshop_id' })
  workshop!: WorkshopEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
