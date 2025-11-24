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
        secure: isProduction, // HTTPS 환경에서만 전송 (크로스 도메인 필수)
        sameSite: isProduction ? ('none' as const) : ('lax' as const), // 크로스 도메인 지원 (프로덕션: none, 개발: lax)
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
        domain: undefined, // 크로스 도메인 쿠키 전송을 위해 undefined (도메인 명시하지 않음)
        path: '/', // 모든 경로에서 쿠키 전송
      },
      name: 'sessionId', // 기본값 'connect.sid' 대신 커스텀 이름
    }),
  );

  // CORS 설정
  const allowedOrigins = [
    'https://vanilla-js-todo-list-no-frameworks.vercel.app', // 프로덕션 프론트엔드
    'https://vanilla-js-todo-list-no-frameworks-git-main-quequuens-projects.vercel.app', // Vercel 프리뷰/개발 브랜치
    'http://localhost:5500', // 로컬 개발용 (Live Server 등)
    'http://localhost:3000', // 로컬 개발용
  ];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // origin이 없으면 허용 (OPTIONS preflight, 직접 접근 등)
      if (!origin) {
        callback(null, true);
        return;
      }

      // 정확히 일치하는 origin 확인
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (
        origin.includes('vanilla-js-todo-list') &&
        origin.includes('.vercel.app')
      ) {
        callback(null, true);
        return;
      }

      // 허용되지 않은 origin
      devLogger.warn(`CORS 차단: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'Cookie',
    ],
    exposedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  });

  await app.listen(port);
  devLogger.log(`Server running on http://localhost:${port}`);
  devLogger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
void bootstrap();
