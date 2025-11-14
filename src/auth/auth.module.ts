import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})], //옵션은 service에서 동적으로 설정
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
