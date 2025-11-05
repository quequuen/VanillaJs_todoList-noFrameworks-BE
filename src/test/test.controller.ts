import { Controller, Get } from '@nestjs/common';

@Controller('api/test')
export class TestController {
  @Get()
  getTest(): { data: string } {
    return { data: 'Test endpoint is working' };
  }
}
