import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('magic_link_tokens')
@Index(['expiresAt'])
@Index(['used'])
export class MagicLinkToken {
  @PrimaryColumn()
  token: string; // 짧은 UUID 토큰 (JWT 대신)

  @Column()
  email: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'used', default: false })
  used: boolean; // 1회용 토큰 플래그

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
