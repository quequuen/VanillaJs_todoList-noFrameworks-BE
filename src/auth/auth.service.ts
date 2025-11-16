// 매직링크 토큰 생성/검증, 이메일 발송
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import sgMail from '@sendgrid/mail';
import { randomUUID } from 'crypto';
import { User } from '../user/user.entity';
import { MagicLinkToken } from './entities/magic-link-token.entity';
import { devLogger } from '../utils/logger';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MagicLinkToken)
    private magicLinkTokenRepository: Repository<MagicLinkToken>,
  ) {
    // SendGrid 초기화
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      devLogger.log('SendGrid 초기화 완료');
    } else {
      devLogger.warn(
        'SENDGRID_API_KEY가 설정되지 않았습니다. 이메일 발송이 비활성화됩니다.',
      );
    }
  }

  // 매직링크 보낼 때 토큰 생성
  async sendMagicLink(email: string): Promise<{ message: string }> {
    // 환경변수 검증
    if (!process.env.MAGIC_SECRET) {
      devLogger.error('MAGIC_SECRET environment variable is not set');
      throw new InternalServerErrorException('서버 설정 오류가 발생했습니다.');
    }
    if (!process.env.FRONTEND_URL) {
      devLogger.error('FRONTEND_URL environment variable is not set');
      throw new InternalServerErrorException('서버 설정 오류가 발생했습니다.');
    }

    // 이메일 검증 (이중 체크)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('유효하지 않은 이메일입니다.');
    }

    try {
      // 사용자 조회 또는 생성
      let user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        user = this.userRepository.create({ email });
        user = await this.userRepository.save(user);
        devLogger.log(`새로운 사용자 생성: ${email}`);
      }

      // 매직링크 토큰 생성 (10분 만료, 짧은 UUID 사용)
      const expiresIn = 10 * 60; // 10분
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // JWT 대신 짧은 UUID 토큰 사용 (보안 강화)
      const token = randomUUID();

      // 토큰을 DB에 저장 (1회용 처리, used: false)
      const magicLinkToken = this.magicLinkTokenRepository.create({
        token,
        email,
        expiresAt,
        used: false, // 1회용 플래그
      });
      await this.magicLinkTokenRepository.save(magicLinkToken);

      // 이메일 링크는 프론트엔드 도메인으로 설정
      // 프론트엔드는 token을 받아 백엔드의 /api/auth/verify-api로 호출하여 인증 처리
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
      const url = `${frontendUrl}?token=${token}`;

      devLogger.log(`Magic Link URL for ${email}: ${url}`);

      // 환경변수 디버깅 (보안을 위해 마스킹)
      devLogger.log('환경변수 확인:', {
        hasSENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
        hasSENDGRID_SENDER: !!process.env.SENDGRID_SENDER,
        SENDGRID_API_KEY_length: process.env.SENDGRID_API_KEY?.length || 0,
        SENDGRID_SENDER_value: process.env.SENDGRID_SENDER || 'undefined',
        SENDGRID_API_KEY_prefix: process.env.SENDGRID_API_KEY
          ? process.env.SENDGRID_API_KEY.substring(0, 5) + '...'
          : 'undefined',
      });

      // 이메일 전송 (SendGrid 사용)
      if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_SENDER) {
        try {
          const msg = {
            to: email,
            from: process.env.SENDGRID_SENDER,
            subject: 'D-3 로그인 링크',
            html: `
              <h2>로그인 링크</h2>
              <p>아래 링크를 클릭하면 로그인됩니다.</p>
              <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">로그인하기</a>
              <p style="color: #666; font-size: 12px;">이 링크는 10분 후 만료되며, 한 번만 사용할 수 있습니다.</p>
            `,
          };

          await sgMail.send(msg);
          devLogger.log(`이메일 발송 성공: ${email}`);
        } catch (emailError: unknown) {
          // SendGrid 에러 상세 로깅
          const errorMessage =
            emailError instanceof Error
              ? emailError.message
              : '알 수 없는 에러';
          const errorResponse =
            emailError &&
            typeof emailError === 'object' &&
            'response' in emailError
              ? (emailError.response as { body?: unknown })
              : null;

          devLogger.error('이메일 발송 실패:', {
            email,
            error: errorMessage,
            response: errorResponse?.body,
            fullError: emailError,
          });

          // 이메일 발송 실패 시 예외 throw (사용자에게 에러 알림)
          throw new InternalServerErrorException(
            `이메일 발송에 실패했습니다: ${errorMessage}`,
          );
        }
      } else {
        devLogger.warn(
          `SENDGRID_API_KEY 또는 SENDGRID_SENDER가 설정되지 않아 이메일을 발송하지 않습니다.`,
        );
        devLogger.warn(`매직링크 URL (개발용): ${url}`);
        throw new InternalServerErrorException(
          '이메일 발송 서비스가 설정되지 않았습니다. 관리자에게 문의하세요.',
        );
      }

      return { message: '인증 링크가 이메일로 발송되었습니다.' };
    } catch (error) {
      devLogger.error('매직링크 발송 중 오류:', error);

      // DB 연결 오류인 경우
      if (error instanceof Error && error.message.includes('connect')) {
        throw new InternalServerErrorException(
          '데이터베이스 연결에 실패했습니다.',
        );
      }

      // 이미 HttpException인 경우 그대로 throw
      if (
        error instanceof InternalServerErrorException ||
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      // 기타 오류
      throw new InternalServerErrorException(
        `매직링크 발송에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    }
  }

  //프론트에서 토큰 검증 및 세션 생성
  async verifyMagicToken(
    token: string,
  ): Promise<{ message: string; user: { id: number; email: string } }> {
    try {
      // DB에서 토큰 조회
      const magicLinkToken = await this.magicLinkTokenRepository.findOne({
        where: { token },
      });

      if (!magicLinkToken) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      // 1회용 토큰 확인 (이미 사용된 토큰인지 체크)
      if (magicLinkToken.used) {
        throw new UnauthorizedException('이미 사용된 토큰입니다.');
      }

      // 토큰 만료 확인
      if (magicLinkToken.expiresAt < new Date()) {
        // 만료된 토큰은 used로 표시 (재사용 방지)
        await this.magicLinkTokenRepository.update({ token }, { used: true });
        throw new BadRequestException('토큰이 만료되었습니다.');
      }

      // 사용자 조회
      const user = await this.userRepository.findOne({
        where: { email: magicLinkToken.email },
      });

      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      // 1회용 토큰 사용 처리 (used: true로 변경, 삭제하지 않음 - 감사 로그용)
      await this.magicLinkTokenRepository.update({ token }, { used: true });

      devLogger.log(`사용자 인증 완료: ${user.email}`);

      return {
        message: '인증이 완료되었습니다.',
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      // 기타 오류
      devLogger.error('토큰 검증 중 오류:', error);
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  // 로그아웃 (세션 삭제는 main.ts의 세션 미들웨어에서 처리)
  logout(): Promise<{ message: string }> {
    return Promise.resolve({ message: '로그아웃되었습니다.' });
  }
}
