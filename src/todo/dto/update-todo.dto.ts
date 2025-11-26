import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Expose } from 'class-transformer';

export class UpdateTodoDto {
  @Expose()
  @IsOptional()
  @IsString()
  content?: string;

  @Expose()
  @IsOptional()
  @IsDateString()
  deadLine?: string;

  @Expose()
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @Expose()
  @IsOptional()
  @IsIn(['Y', 'N'])
  isDone?: 'Y' | 'N';
}
