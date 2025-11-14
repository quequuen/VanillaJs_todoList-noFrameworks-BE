// 매직링크 api
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  //매직링크 발송
  @Post('magic-link')
  sendMagicLink(@Body('email') email: string) {
    return this.authService.sendMagicLink(email);
  }

  //매직링크 토큰 검증
  @Post('verify-token')
  verifyToken(@Body('token') token: string) {
    return this.authService.verifyMagicToken(token);
  }
}
