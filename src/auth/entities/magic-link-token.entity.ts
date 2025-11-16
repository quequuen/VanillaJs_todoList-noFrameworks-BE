import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('magic_link_tokens')
@Index(['expiresAt'])
export class MagicLinkToken {
  @PrimaryColumn()
  token: string;

  @Column()
  email: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
