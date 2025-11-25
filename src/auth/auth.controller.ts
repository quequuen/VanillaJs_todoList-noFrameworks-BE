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
  InternalServerErrorException,
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

  /**
   * 에러 HTML 페이지 생성 헬퍼
   */
  private generateErrorPage(errorMessage: string, redirectUrl: string): string {
    const safeRedirectUrl = encodeURI(redirectUrl);
    const safeErrorMessage = errorMessage.replace(/"/g, '&quot;');

    return `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="refresh" content="3;url=${safeRedirectUrl}">
        <title>인증 오류 - D-3</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #333;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              text-align: center;
              max-width: 500px;
              width: 90%;
            }
            .error-icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 {
              color: #e74c3c;
              margin-bottom: 16px;
              font-size: 24px;
            }
            .message {
              color: #666;
              margin-bottom: 30px;
              line-height: 1.6;
              font-size: 16px;
            }
            .redirect-info {
              color: #999;
              font-size: 14px;
              margin-bottom: 24px;
            }
            .link-button {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              transition: background 0.3s;
            }
            .link-button:hover {
              background: #5568d3;
            }
        </style>
        </head>
        <body>
            <div class="container">
                <div class="error-icon">⚠️</div>
                <h1>인증 오류</h1>
                <p class="message">${safeErrorMessage}</p>
                <p class="redirect-info">3초 후 자동으로 이동합니다...</p>
                <a href="${safeRedirectUrl}" class="link-button">메인으로 돌아가기</a>
            </div>
            <script>
                // JavaScript 리다이렉트 (meta refresh 대비)
                setTimeout(function() {
                window.location.href = '${safeRedirectUrl}';
                }, 3000);
            </script>
        </body>
        </html>
    `.trim();
  }

  //매직링크 토큰 검증
  // 자동 인증 후 프론트엔드로 리다이렉트
  @Get('verify')
  async verifyToken(
    @Query('token') token: string,
    @Query('redirect') redirectUrl: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const defaultUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
    const safeUrl = this.validateRedirectUrl(redirectUrl || defaultUrl);

    if (!token) {
      // 토큰이 없으면 HTML 에러 페이지 렌더링
      const errorPage = this.generateErrorPage(
        '토큰이 필요합니다. 유효한 인증 링크를 확인해주세요.',
        safeUrl,
      );
      return res.status(400).send(errorPage);
    }

    try {
      const result = await this.authService.verifyMagicToken(token);

      // 세션에 사용자 정보 저장 (Cookie 기반 인증)
      if (!req.session) {
        devLogger.error('verify: 세션이 없습니다!');
        // 세션이 없으면 직접 리다이렉트
        res.redirect(`${safeUrl}?error=세션을 생성할 수 없습니다.`);
        return;
      }

      devLogger.log('verify: 세션 초기 상태:', {
        hasSession: !!req.session,
        sessionId: req.session.id,
        sessionKeys: Object.keys(req.session),
      });

      // 세션을 재생성하여 새 세션 ID 생성 및 쿠키 설정 보장
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) {
            devLogger.error('❌ verify: 세션 재생성 실패:', err);
            reject(err);
            return;
          }

          // 재생성된 세션에 사용자 정보 저장
          req.session.userId = result.user.id;
          req.session.email = result.user.email;
          req.session.createdAt = new Date();

          devLogger.log('verify: 세션 재생성 및 데이터 설정 완료:', {
            sessionId: req.session.id,
            userId: req.session.userId,
            email: req.session.email,
            sessionKeys: Object.keys(req.session),
          });

          // 세션 저장 (쿠키 설정을 위해 필수)
          req.session.save((saveErr) => {
            if (saveErr) {
              devLogger.error('❌ verify: 세션 저장 실패:', saveErr);
              reject(saveErr);
              return;
            }

            devLogger.log('✅ verify: 세션 저장 성공:', {
              sessionId: req.session?.id,
              userId: req.session?.userId,
              email: req.session?.email,
            });

            // 세션 터치하여 쿠키 갱신 보장
            if (req.session.touch) {
              req.session.touch();
            }

            resolve();
          });
        });
      });

      // 리다이렉트 URL 검증 (오픈 리다이렉트 공격 방지)
      devLogger.log(`인증 완료 후 리다이렉트: ${safeUrl}`);
      res.redirect(`${safeUrl}?success=인증이 완료되었습니다.`);
    } catch (error) {
      devLogger.error('토큰 검증 실패:', error);

      // 에러 타입별로 적절한 상태 코드 설정
      let statusCode = 401; // 기본값 (인증 오류)
      let errorMessage = '인증에 실패했습니다.';

      if (error instanceof BadRequestException) {
        statusCode = 400; // 토큰 만료 등
        errorMessage = error.message;
      } else if (error instanceof UnauthorizedException) {
        statusCode = 401; // 토큰 없음, 사용자 없음, 이미 사용된 토큰 등
        errorMessage = error.message;
      } else if (error instanceof InternalServerErrorException) {
        statusCode = 500; // 서버 오류
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // 에러 발생 시 HTML 에러 페이지 렌더링
      const errorPage = this.generateErrorPage(errorMessage, safeUrl);
      return res.status(statusCode).send(errorPage);
    }
  }

  // API 호출용 검증 엔드포인트
  @Get('verify-api')
  async verifyTokenApi(
    @Query('token') token: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!token) {
      throw new BadRequestException('토큰이 필요합니다.');
    }

    const result = await this.authService.verifyMagicToken(token);

    // 세션에 사용자 정보 저장 (Cookie 기반 인증)
    if (!req.session) {
      devLogger.error('verify-api: 세션이 없습니다!');
      throw new InternalServerErrorException('세션을 생성할 수 없습니다.');
    }

    devLogger.log('🍪 verify-api: 세션 초기 상태:', {
      hasSession: !!req.session,
      sessionId: req.session.id,
      sessionKeys: Object.keys(req.session),
      origin: req.headers.origin,
      existingCookie: req.cookies?.sessionId || req.headers.cookie,
    });

    // ⚠️ 중요: CORS 헤더를 먼저 설정해야 브라우저가 쿠키를 저장함
    // express-session이 Set-Cookie를 설정할 때 이미 CORS 헤더가 있어야 함
    const origin = req.headers.origin;
    if (origin) {
      // Origin 헤더가 있으면 해당 origin으로 설정
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      devLogger.log('🍪 verify-api: CORS 헤더 설정 (세션 저장 전):', {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
      });
    } else {
      // Origin 헤더가 없으면 프론트엔드 URL 사용
      const frontendUrl = process.env.FRONTEND_URL;
      if (frontendUrl) {
        res.setHeader('Access-Control-Allow-Origin', frontendUrl);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        devLogger.log(
          '🍪 verify-api: CORS 헤더 설정 (Origin 없음, 세션 저장 전):',
          {
            'Access-Control-Allow-Origin': frontendUrl,
            'Access-Control-Allow-Credentials': 'true',
          },
        );
      }
    }

    // 세션을 재생성하여 새 세션 ID 생성 및 쿠키 설정 보장
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) {
          devLogger.error('❌ verify-api: 세션 재생성 실패:', err);
          reject(err);
          return;
        }

        // 재생성된 세션에 사용자 정보 저장
        req.session.userId = result.user.id;
        req.session.email = result.user.email;
        req.session.createdAt = new Date();

        devLogger.log('🍪 verify-api: 세션 재생성 및 데이터 설정 완료:', {
          sessionId: req.session.id,
          userId: req.session.userId,
          email: req.session.email,
          sessionKeys: Object.keys(req.session),
        });

        // 세션 저장 (쿠키 설정을 위해 필수)
        req.session.save((saveErr) => {
          if (saveErr) {
            devLogger.error('❌ verify-api: 세션 저장 실패:', saveErr);
            reject(saveErr);
            return;
          }

          devLogger.log('✅ verify-api: 세션 저장 성공:', {
            sessionId: req.session?.id,
            userId: req.session?.userId,
            email: req.session?.email,
            sessionKeys: Object.keys(req.session || {}),
            sessionData: {
              userId: req.session?.userId,
              email: req.session?.email,
              createdAt: req.session?.createdAt,
            },
          });

          // 세션 터치하여 쿠키 갱신 보장
          if (req.session.touch) {
            req.session.touch();
          }

          resolve();
        });
      });
    });

    // 세션 저장 후 즉시 Set-Cookie 헤더 확인 (디버깅용)
    // express-session은 세션이 변경되면 자동으로 쿠키를 설정함
    const immediateHeaders = res.getHeader('Set-Cookie');
    devLogger.log('🍪 verify-api: 세션 저장 직후 Set-Cookie 헤더:', {
      sessionId: req.session?.id,
      hasSetCookie: !!immediateHeaders,
      setCookieHeader: immediateHeaders,
    });

    // express-session은 응답 종료 시점에 쿠키를 설정하므로,
    // 응답 완료 이벤트를 감지하여 Set-Cookie 헤더 확인
    res.once('finish', () => {
      const setCookieHeaders = res.getHeader('Set-Cookie');
      devLogger.log('🍪 verify-api: 응답 완료 후 Set-Cookie 헤더:', {
        sessionId: req.session?.id,
        setCookieHeader: setCookieHeaders,
        hasSetCookie: !!setCookieHeaders,
        cookieValue:
          typeof setCookieHeaders === 'string'
            ? setCookieHeaders
            : Array.isArray(setCookieHeaders)
              ? setCookieHeaders.join('; ')
              : '없음',
        responseHeaders: {
          'Set-Cookie': setCookieHeaders,
          'Access-Control-Allow-Origin': res.getHeader(
            'Access-Control-Allow-Origin',
          ),
          'Access-Control-Allow-Credentials': res.getHeader(
            'Access-Control-Allow-Credentials',
          ),
        },
      });
    });

    // 세션 저장 후 응답 반환
    return result;
  }

  // 현재 로그인한 사용자 정보 조회 (세션 기반)
  @Get('me')
  getCurrentUser(@Req() req: Request) {
    // 세션 디버깅 로그 (상세)
    const sessionCookieValue =
      req.cookies?.sessionId ||
      req.headers.cookie?.match(/sessionId=([^;]+)/)?.[1] ||
      '없음';

    devLogger.log('🔍 GET /api/auth/me 요청 시작:', {
      hasSession: !!req.session,
      sessionId: req.session?.id,
      userId: req.session?.userId,
      email: req.session?.email,
      sessionKeys: req.session ? Object.keys(req.session) : [],
      cookies: req.cookies,
      cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
      sessionCookieName: 'sessionId',
      sessionCookieValue: sessionCookieValue,
      sessionCookieValueLength: sessionCookieValue.length,
      rawCookieHeader: req.headers.cookie || '없음',
      cookieHeaderLength: req.headers.cookie?.length || 0,
      // 세션 쿠키 값이 서명되었는지 확인 (express-session은 s: 접두사를 사용)
      isSignedCookie: sessionCookieValue.startsWith('s:'),
      headers: {
        cookie: req.headers.cookie,
        origin: req.headers.origin,
        referer: req.headers.referer,
        host: req.headers.host,
      },
    });

    if (!req.session) {
      devLogger.error('❌ /api/auth/me: 세션이 존재하지 않습니다.', {
        cookies: req.cookies,
        cookieHeader: req.headers.cookie,
      });
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    if (!req.session.userId) {
      devLogger.error('❌ /api/auth/me: 세션에 userId가 없습니다.', {
        sessionId: req.session.id,
        sessionKeys: Object.keys(req.session),
        sessionData: {
          ...req.session,
          cookie: undefined, // cookie 속성은 너무 길어서 제외
        },
        cookies: req.cookies,
        cookieHeader: req.headers.cookie,
      });
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    devLogger.log('✅ /api/auth/me: 사용자 정보 반환 성공:', {
      id: req.session.userId,
      email: req.session.email,
      sessionId: req.session.id,
    });

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
