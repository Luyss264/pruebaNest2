import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 80 })
  action!: string;

  @Column({ type: 'varchar', length: 80 })
  resource!: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 80, nullable: true })
  resourceId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, unknown> | null;

  @Column({ name: 'actor_id', type: 'integer', nullable: true })
  actorId?: number | null;

  @ManyToOne(() => UserEntity, (user) => user.auditLogs, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_id' })
  actor?: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
