import { Controller, Post, Body, Query } from '@nestjs/common';
import { MagicLinkService } from './magic-link.service';

@Controller('magic-link')
export class MagicLinkController {
  constructor(private readonly magicLinkService: MagicLinkService) {}

  // 1) 프론트가 "매직링크 이메일 보내주세요" 요청
  @Post('send')
  async sendMagicLink(@Body('email') email: string) {
    return this.magicLinkService.sendMagicLink(email);
  }

  // 2) 프론트가 매직링크 클릭 → token 으로 로그인 요청
  @Post('verify')
  async verify(@Body('token') token: string) {
    return this.magicLinkService.verifyMagicToken(token);
  }
}
