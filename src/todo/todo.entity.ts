// model Todo {
//   id        Int      @id @default(autoincrement())
//   title     String
//   content   String?
//   completed Boolean  @default(false)
//   createdAt DateTime @default(now())
// }

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
// Index 데코레이션은 자주 select 할 것 같은 컬럼을 위주로 하는 것.

@Entity('todo')
export class Todo {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'creation', type: 'timestamp' })
  creation: Date;

  @Column({ name: 'deadline', type: 'date' })
  deadLine: Date;

  @Column({ name: 'is_done', type: 'char', length: 1, default: 'N' })
  isDone: 'Y' | 'N';

  @Column({ type: 'text' })
  content: string;
}
