import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMagicLinkDto {
  @IsEmail({}, { message: '유효하지 않은 이메일입니다.' })
  @IsNotEmpty({ message: '이메일은 필수입니다.' })
  @IsString()
  @MaxLength(255)
  email: string;
}
