import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { MagicLinkToken } from './entities/magic-link-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, MagicLinkToken]),
    JwtModule.register({}), // 옵션은 service에서 동적으로 설정
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
