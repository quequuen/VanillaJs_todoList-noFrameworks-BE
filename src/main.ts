import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { devLogger } from './utils/logger';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  // 전역 예외 필터 설정 (에러 로깅 개선)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Validation Pipe 전역 설정
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Cookie Parser 설정
  app.use(cookieParser());

  // 세션 미들웨어 설정
  const isProduction = process.env.NODE_ENV === 'production';
  const sessionSecret = process.env.SESSION_SECRET || 'dev-secret-key';

  if (!sessionSecret || sessionSecret === 'dev-secret-key') {
    if (isProduction) {
      throw new Error('SESSION_SECRET 환경변수가 설정되지 않았습니다.');
    }
    devLogger.warn(
      'SESSION_SECRET이 기본값으로 설정되었습니다. 프로덕션에서는 반드시 변경하세요.',
    );
  }

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true, // JavaScript 접근 차단 (XSS 방지)
        secure: isProduction, // HTTPS 환경에서만 전송
        sameSite: 'lax', // CORS 환경에 맞게 설정
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      },
      name: 'sessionId', // 기본값 'connect.sid' 대신 커스텀 이름
    }),
  );

  // CORS 설정
  const allowedOrigins = [
    'https://vanilla-js-todo-list-no-frameworks.vercel.app', // 프로덕션 프론트엔드
    'http://localhost:5500', // 로컬 개발용 (Live Server 등)
    'http://localhost:3000', // 로컬 개발용
  ];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // 개발 환경에서는 origin이 없어도 허용 (Postman 등)
      if (!origin && process.env.NODE_ENV !== 'production') {
        callback(null, true);
        return;
      }

      // 프로덕션에서는 origin 필수
      if (!origin) {
        callback(new Error('Origin이 필요합니다.'));
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(port);
  devLogger.log(`Server running on http://localhost:${port}`);
  devLogger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
void bootstrap();
