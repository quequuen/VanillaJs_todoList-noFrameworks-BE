import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMagicLinkDto {
  @IsEmail({}, { message: '유효하지 않은 이메일입니다.' })
  @IsNotEmpty({ message: '이메일은 필수입니다.' })
  @IsString({ message: '이메일은 문자열이어야 합니다.' })
  @MaxLength(255, { message: '이메일은 255자 이하여야 합니다.' })
  email: string;
}
