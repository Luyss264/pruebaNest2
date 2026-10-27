import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '../../common/types/enums';
import { MechanicEntity } from './mechanic.entity';
import { AuditLogEntity } from './audit-log.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 180, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TECHNICIAN })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // Inverse side: a mechanic profile may be associated with one login account.
  @OneToOne(() => MechanicEntity, (mechanic) => mechanic.user)
  mechanic?: MechanicEntity | null;

  @OneToMany(() => AuditLogEntity, (auditLog) => auditLog.actor)
  auditLogs!: AuditLogEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
