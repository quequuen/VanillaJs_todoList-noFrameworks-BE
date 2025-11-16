import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MagicLinkService } from './magic-link.service';
import { MagicLinkController } from './magic-link.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MagicLinkController],
  providers: [MagicLinkService],
})
export class MagicLinkModule {}
