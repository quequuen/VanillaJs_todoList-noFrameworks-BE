import { Module } from '@nestjs/common';
import { MagicLinkController } from './magic-link.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * 하위 호환성 모듈
 * 프론트엔드가 /magic-link/* 엔드포인트를 사용하고 있어서 유지
 * 내부적으로는 AuthModule의 AuthService를 사용
 */
@Module({
  imports: [AuthModule], // AuthService를 사용하기 위해 import
  controllers: [MagicLinkController],
})
export class MagicLinkModule {}
