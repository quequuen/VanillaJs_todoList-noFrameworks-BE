import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsDateString()
  deadLine?: string; // 프론트에서 date string 형식으로 전송
}
