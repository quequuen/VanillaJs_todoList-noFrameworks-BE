import {
  Controller,
  Post,
  Body,
  Req,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { SendMagicLinkDto } from '../auth/dto/send-magic-link.dto';

@Controller('magic-link')
export class MagicLinkController {
  constructor(private readonly authService: AuthService) {}

  // 매직링크 발송
  @Post('send')
  @Throttle({
    short: { limit: 5, ttl: 60000 },
    medium: { limit: 10, ttl: 3600000 },
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async sendMagicLink(@Body('email') email: string) {
    try {
      const dto = { email } as SendMagicLinkDto;
      return await this.authService.sendMagicLink(dto.email);
    } catch (error) {
      throw error;
    }
  }

  // 매직링크 검증
  @Post('verify')
  async verify(@Body('token') token: string, @Req() req: Request) {
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

    return {
      ...result,
      accessToken: 'session-based',
    };
  }
}
