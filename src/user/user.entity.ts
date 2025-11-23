import { Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
