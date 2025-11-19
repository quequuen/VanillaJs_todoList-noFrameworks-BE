import { IsString, IsOptional } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;
}
