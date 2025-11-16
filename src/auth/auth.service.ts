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
  ) {}

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

      // 매직링크 토큰 생성 (15분 만료)
      const expiresIn = 15 * 60; // 15분
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      const token = this.jwtService.sign(
        { email },
        {
          secret: process.env.MAGIC_SECRET,
          expiresIn: `${expiresIn}s`,
        },
      );

      // 토큰을 DB에 저장 (1회용 처리)
      const magicLinkToken = this.magicLinkTokenRepository.create({
        token,
        email,
        expiresAt,
      });
      await this.magicLinkTokenRepository.save(magicLinkToken);

      const url = `${process.env.FRONTEND_URL}/verify?token=${token}`;

      // 이메일 전송 로직 (Nodemailer 등)
      devLogger.log(`Magic Link URL for ${email}: ${url.substring(0, 50)}...`);

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
    // 환경변수 검증
    if (!process.env.MAGIC_SECRET) {
      devLogger.error('MAGIC_SECRET environment variable is not set');
      throw new InternalServerErrorException('서버 설정 오류가 발생했습니다.');
    }

    try {
      // 토큰 검증
      const payload = this.jwtService.verify<{ email: string }>(token, {
        secret: process.env.MAGIC_SECRET,
      });

      // DB에서 토큰 조회 (1회용 확인)
      const magicLinkToken = await this.magicLinkTokenRepository.findOne({
        where: { token },
      });

      if (!magicLinkToken) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      // 토큰 만료 확인
      if (magicLinkToken.expiresAt < new Date()) {
        // 만료된 토큰 삭제
        await this.magicLinkTokenRepository.delete({ token });
        throw new BadRequestException('토큰이 만료되었습니다.');
      }

      // 사용자 조회
      const user = await this.userRepository.findOne({
        where: { email: payload.email },
      });

      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      // 1회용 토큰 삭제 (재사용 방지)
      await this.magicLinkTokenRepository.delete({ token });

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

      // JWT 검증 실패 등
      devLogger.error('토큰 검증 중 오류:', error);
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  // 로그아웃 (세션 삭제는 main.ts의 세션 미들웨어에서 처리)
  logout(): Promise<{ message: string }> {
    return Promise.resolve({ message: '로그아웃되었습니다.' });
  }
}
