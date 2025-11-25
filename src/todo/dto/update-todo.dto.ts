import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsIn,
} from 'class-validator';

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsDateString()
  deadLine?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsIn(['Y', 'N'])
  isDone?: 'Y' | 'N';
}
