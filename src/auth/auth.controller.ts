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
  UnauthorizedException,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SendMagicLinkDto } from './dto/send-magic-link.dto';
import { devLogger } from '../utils/logger';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * 리다이렉트 URL 검증 (오픈 리다이렉트 공격 방지)
   */
  private validateRedirectUrl(url: string): string {
    const allowedUrls = [
      process.env.FRONTEND_URL,
      'http://localhost:5500',
      'http://localhost:3000',
    ].filter(Boolean); // undefined 제거

    // URL이 허용된 목록에 있는지 확인
    try {
      const urlObj = new URL(url);
      const isAllowed = allowedUrls.some((allowed) => {
        if (!allowed) return false;
        const allowedObj = new URL(allowed);
        return (
          urlObj.origin === allowedObj.origin &&
          urlObj.protocol === allowedObj.protocol
        );
      });

      if (isAllowed) {
        return url;
      }
    } catch (error) {
      // URL 파싱 실패
      devLogger.error('리다이렉트 URL 검증 실패:', error);
    }

    // 허용되지 않은 URL이면 기본 프론트엔드 URL 반환
    return process.env.FRONTEND_URL || 'http://localhost:5500';
  }

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
  // 브라우저 직접 접근: 자동 인증 후 프론트엔드로 리다이렉트
  @Get('verify')
  async verifyToken(
    @Query('token') token: string,
    @Query('redirect') redirectUrl: string | undefined, // 리다이렉트 URL (선택사항, 화이트리스트 검증)
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!token) {
      // 토큰이 없으면 프론트엔드 에러 페이지로 리다이렉트
      const safeUrl = this.validateRedirectUrl(
        redirectUrl || process.env.FRONTEND_URL || 'http://localhost:5500',
      );
      return res.redirect(`${safeUrl}?error=토큰이 필요합니다.`);
    }

    try {
      const result = await this.authService.verifyMagicToken(token);

      // 세션에 사용자 정보 저장 (Cookie 기반 인증)
      if (req.session) {
        req.session.userId = result.user.id;
        req.session.email = result.user.email;
        req.session.createdAt = new Date();

        // 세션 저장 후 리다이렉트
        req.session.save((err) => {
          if (err) {
            devLogger.error('세션 저장 중 오류:', err);
          }

          // 리다이렉트 URL 검증 (오픈 리다이렉트 공격 방지)
          const defaultUrl =
            process.env.FRONTEND_URL || 'http://localhost:5500';
          const safeUrl = this.validateRedirectUrl(redirectUrl || defaultUrl);

          devLogger.log(`인증 완료 후 리다이렉트: ${safeUrl}`);
          res.redirect(`${safeUrl}?success=인증이 완료되었습니다.`);
        });
      } else {
        // 세션이 없으면 직접 리다이렉트
        const defaultUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
        const safeUrl = this.validateRedirectUrl(redirectUrl || defaultUrl);
        res.redirect(`${safeUrl}?success=인증이 완료되었습니다.`);
      }
    } catch (error) {
      devLogger.error('토큰 검증 실패:', error);

      // 에러 발생 시 프론트엔드 에러 페이지로 리다이렉트
      const defaultUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
      const safeUrl = this.validateRedirectUrl(redirectUrl || defaultUrl);
      const errorMessage =
        error instanceof Error ? error.message : '인증에 실패했습니다.';
      return res.redirect(
        `${safeUrl}?error=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  // API 호출용 검증 엔드포인트 (프론트엔드에서 프로그래밍 방식으로 호출)
  @Get('verify-api')
  async verifyTokenApi(@Query('token') token: string, @Req() req: Request) {
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

  // 현재 로그인한 사용자 정보 조회 (세션 기반)
  @Get('me')
  getCurrentUser(@Req() req: Request) {
    if (!req.session?.userId) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    return {
      id: req.session.userId,
      email: req.session.email,
      createdAt: req.session.createdAt,
    };
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
