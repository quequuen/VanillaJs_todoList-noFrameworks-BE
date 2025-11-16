import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TestController } from './test/test.controller';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MagicLinkModule } from './magic-link/magic-link.module';

@Module({
  controllers: [TestController],
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      // entities: [User],
      synchronize: true, // 개발 중엔 true, 배포시 false!
    }),
    ConfigModule.forRoot({
      isGlobal: true, // 전역 모듈화
    }),
    AuthModule,
    MagicLinkModule,
  ],
})
export class AppModule {}
