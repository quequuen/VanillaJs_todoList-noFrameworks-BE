// model Todo {
//   id        Int      @id @default(autoincrement())
//   title     String
//   content   String?
//   completed Boolean  @default(false)
//   createdAt DateTime @default(now())
// }

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('todo')
export class Todo {
  @PrimaryColumn()
  id: Int16Array;
}
