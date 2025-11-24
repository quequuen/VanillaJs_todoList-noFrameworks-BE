import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  content: string;

  @IsDateString()
  deadLine: string;
}
