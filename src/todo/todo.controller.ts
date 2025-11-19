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

@Controller('api/todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  // GET /api/todo
  @Get()
  getAll() {
    return this.todoService.findAll();
  }

  // GET /api/todo/:id
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.todoService.findOne(Number(id));
  }

  // POST /api/todo
  @Post()
  create(@Body() body) {
    return this.todoService.create(body);
  }

  // PUT /api/todo/:id
  @Put(':id')
  update(@Param('id') id: string, @Body() body) {
    return this.todoService.update(Number(id), body);
  }

  // DELETE /api/todo/:id
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.todoService.remove(Number(id));
  }

  // PATCH /api/todo/:id/toggle
  @Patch(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.todoService.toggle(Number(id));
  }
}
