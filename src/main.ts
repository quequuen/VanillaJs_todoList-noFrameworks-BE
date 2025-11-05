import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

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
      if (!origin || allowedOrigins.includes(origin)) {
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
  console.log(`Server running on http://localhost:${port}`);
}
void bootstrap();
