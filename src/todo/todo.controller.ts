import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { devLogger } from '../utils/logger';

@Controller('api/todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  // todos 조회
  // GET /api/todo
  @Get()
  async getAll() {
    try {
      devLogger.log('GET /api/todo 요청');
      const todos = await this.todoService.findAll();
      devLogger.log(`Todo 조회 성공: ${todos.length}개`);
      return todos;
    } catch (error) {
      devLogger.error('GET /api/todo 실패:', error);
      throw error;
    }
  }

  // 특정 todo 조회
  // GET /api/todo/:id
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.todoService.findOne(Number(id));
  }

  // todo 생성
  // POST /api/todo
  @Post()
  create(@Body() createTodoDto: CreateTodoDto) {
    return this.todoService.create(createTodoDto);
  }

  // todo 수정
  // PUT /api/todo/:id
  @Put(':id')
  update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto) {
    return this.todoService.update(Number(id), updateTodoDto);
  }

  // todo 삭제
  // DELETE /api/todo/:id
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.todoService.remove(Number(id));
  }

  // todo 완료 여부 toggling
  // PATCH /api/todo/:id/toggle
  @Patch(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.todoService.toggle(Number(id));
  }
}
