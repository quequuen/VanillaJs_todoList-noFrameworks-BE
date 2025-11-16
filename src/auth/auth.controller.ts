// 매직링크 api
import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SendMagicLinkDto } from './dto/send-magic-link.dto';
import { devLogger } from '../utils/logger';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  //매직링크 발송 (Rate Limiting: 1시간에 10회, 1분에 5회)
  @Post('send-magic-link')
  @Throttle({
    short: { limit: 5, ttl: 60000 },
    medium: { limit: 10, ttl: 3600000 },
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async sendMagicLink(@Body() sendMagicLinkDto: SendMagicLinkDto) {
    return this.authService.sendMagicLink(sendMagicLinkDto.email);
  }

  //매직링크 토큰 검증 (GET 요청, 쿼리 파라미터)
  @Get('verify')
  async verifyToken(@Query('token') token: string, @Req() req: Request) {
    if (!token) {
      throw new BadRequestException('토큰이 필요합니다.');
    }

    const result = await this.authService.verifyMagicToken(token);

    // 세션에 사용자 정보 저장 (Cookie 기반 인증)
    if (req.session) {
      req.session.userId = result.user.id;
      req.session.email = result.user.email;
      req.session.createdAt = new Date();
    }

    return result;
  }

  // 로그아웃
  @Post('logout')
  async logout(@Req() req: Request) {
    // 세션 삭제
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          devLogger.error('세션 삭제 중 오류:', err);
        }
      });
    }
    return this.authService.logout();
  }
}
