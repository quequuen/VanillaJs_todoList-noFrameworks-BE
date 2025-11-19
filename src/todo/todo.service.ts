import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class TodoService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return ;
  }

  findOne(id: number) {
    // return this.prisma.todo.findUnique({
    //   where: { id },
    });
  }

  create(data) {
    // return this.prisma.todo.create({
    //   data,
    // });
  }

//   async update(id: number, data) {
//     // await this.ensureExists(id);
//     // return this.prisma.todo.update({
//     //   where: { id },
//     //   data,
//     // });
//   }

//   async remove(id: number) {
//     await this.ensureExists(id);
//     return this.prisma.todo.delete({
//       where: { id },
//     });
//   }

//   async toggle(id: number) {
//     const todo = await this.ensureExists(id);
//     return this.prisma.todo.update({
//       where: { id },
//       data: { completed: !todo.completed },
//     });
//   }

//   // 공통 존재 여부 검사
//   async ensureExists(id: number) {
//     const todo = await this.findOne(id);
//     if (!todo) throw new NotFoundException('Todo not found');
//     return todo;
//   }
}
