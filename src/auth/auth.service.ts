// 매직링크 토큰 생성/검증, 이메일 발송
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // 매직링크 보낼 때 토큰 생성
  async sendMagicLink(email: string) {
    const token = this.jwtService.sign(
      { email },
      {
        secret: process.env.MAGIC_SECRET,
        expiresIn: '10m',
      },
    );

    const url = `${process.env.FRONTEND_URL}/magic-login?token=${token}`;

    // 이메일 전송 로직 (Nodemailer 등)
    console.log('Magic Link URL:', url);

    return { message: 'Magic link sent' };
  }

  //프론트에서 토큰 검증
  async verifyMagicToken(token: string) {
    const payload = this.jwtService.verify(token, {
      secret: process.env.MAGIC_SECRET,
    });

    //실제 로그인 JWT 발급
    const accessToken = this.jwtService.sign(
      { email: payload.email },
      { secret: process.env.JWT_SECRET, expiresIn: '7d' },
    );

    return { accessToken };
  }
}
