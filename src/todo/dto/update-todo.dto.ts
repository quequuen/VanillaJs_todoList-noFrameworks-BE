import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsDateString()
  deadLine?: string;
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
