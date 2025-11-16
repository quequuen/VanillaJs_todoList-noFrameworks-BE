import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TestController } from './test/test.controller';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { User } from './user/user.entity';
import { MagicLinkToken } from './auth/entities/magic-link-token.entity';
import { devLogger } from './utils/logger';

// 환경변수 검증
function validateEnvironmentVariables() {
  const required = [
    'DB_HOST',
    'DB_USER',
    'DB_PASS',
    'DB_NAME',
    'MAGIC_SECRET',
    'JWT_SECRET',
    'FRONTEND_URL',
    'SESSION_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    devLogger.error(
      `필수 환경변수가 설정되지 않았습니다: ${missing.join(', ')}`,
    );
    // 개발 환경에서는 경고만, 프로덕션에서는 에러
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `필수 환경변수가 설정되지 않았습니다: ${missing.join(', ')}`,
      );
    }
  }
}

// 앱 시작 시 환경변수 검증
validateEnvironmentVariables();

@Module({
  controllers: [TestController],
  imports: [
    // 환경변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? [] : ['.env'],
    }),
    // Rate Limiting 설정 (매직링크 발송 API 보호)
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1분
        limit: 5, // 5회
      },
      {
        name: 'medium',
        ttl: 3600000, // 1시간
        limit: 10, // 10회
      },
    ]),
    // TypeORM 설정
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [User, MagicLinkToken],
      synchronize: process.env.NODE_ENV !== 'production', // 프로덕션에서는 false
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
  ],
  providers: [
    // Rate Limiting 전역 가드
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
