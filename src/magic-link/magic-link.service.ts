import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import sgMail from '@sendgrid/mail';

@Injectable()
export class MagicLinkService {
  constructor(private jwtService: JwtService) {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not set');
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendMagicLink(email: string) {
    if (!process.env.MAGIC_SECRET) {
      throw new Error('MAGIC_SECRET environment variable is not set');
    }
    if (!process.env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL environment variable is not set');
    }
    if (!process.env.SENDGRID_SENDER) {
      throw new Error('SENDGRID_SENDER is not set');
    }

    const token = this.jwtService.sign(
      { email },
      {
        secret: process.env.MAGIC_SECRET,
        expiresIn: '10m',
      },
    );

    const url = `${process.env.FRONTEND_URL}/magic-login?token=${token}`;

    const msg = {
      to: email,
      from: process.env.SENDGRID_SENDER, // 인증된 발신자
      subject: 'Your Magic Login Link',
      html: `
        <h2>로그인 링크</h2>
        <p>아래 링크를 클릭하면 로그인됩니다.</p>
        <a href="${url}">${url}</a>
        <p>10분 후 만료됩니다.</p>
      `,
    };

    await sgMail.send(msg);

    return { message: 'Magic link sent' };
  }

  verifyMagicToken(token: string): { accessToken: string } {
    if (!process.env.MAGIC_SECRET) {
      throw new Error('MAGIC_SECRET environment variable is not set');
    }
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const payload = this.jwtService.verify<{ email: string }>(token, {
      secret: process.env.MAGIC_SECRET,
    });

    // 실제 로그인 access token 발급
    const accessToken = this.jwtService.sign<{ email: string }>(
      { email: payload.email },
      { secret: process.env.JWT_SECRET, expiresIn: '7d' },
    );
    return { accessToken };
  }
}
