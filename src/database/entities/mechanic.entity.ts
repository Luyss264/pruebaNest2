import { Column, CreateDateColumn, Entity, Index, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from 'typeorm';
import { MechanicStatus } from '../../common/types/enums';
import { UserEntity } from './user.entity';
import { MaintenanceEntity } from './maintenance.entity';

@Entity({ name: 'mechanics' })
@Index('UQ_mechanics_email', ['email'], { unique: true })
export class MechanicEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 180 })
  email!: string;

  @Column({ type: 'varchar', length: 120 })
  specialty!: string;

  @Column({ type: 'enum', enum: MechanicStatus, default: MechanicStatus.ACTIVE })
  status!: MechanicStatus;

  @OneToOne(() => UserEntity, (user) => user.mechanic, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity | null;

  @RelationId((mechanic: MechanicEntity) => mechanic.user)
  userId?: number | null;

  // Inverse side: mechanics may work at different workshops on different assignments.
  @OneToMany(() => MaintenanceEntity, (maintenance) => maintenance.mechanic)
  maintenances!: MaintenanceEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
