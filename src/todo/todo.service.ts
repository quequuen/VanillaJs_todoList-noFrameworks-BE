import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './todo.entity';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  // 전체 조회
  findAll() {
    return this.todoRepository.find();
  }

  // 단일 조회
  findOne(id: number) {
    return this.todoRepository.findOne({
      where: { id },
    });
  }

  // 생성
  create(data: CreateTodoDto) {
    const todo = this.todoRepository.create(data);
    return this.todoRepository.save(todo);
  }

  // 수정
  async update(id: number, data: UpdateTodoDto) {
    await this.ensureExists(id);
    await this.todoRepository.update(id, data);
    return this.findOne(id);
  }

  // 삭제
  async remove(id: number) {
    await this.ensureExists(id);
    return this.todoRepository.delete(id);
  }

  // 완료 토글
  async toggle(id: number) {
    const todo = await this.ensureExists(id);
    const updated = await this.todoRepository.save({
      ...todo,
      is_done: !todo.isDone,
    });
    return updated;
  }

  // 공통: 존재 여부 확인
  async ensureExists(id: number) {
    const todo = await this.findOne(id);
    if (!todo) throw new NotFoundException('Todo not found');
    return todo;
  }
}
