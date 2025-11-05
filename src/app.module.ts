// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from './user/user.entity';
// import { UserModule } from './user/user.module';

// @Module({
//   imports: [
//     TypeOrmModule.forRoot({
//       type: 'postgres',
//       host: process.env.DB_HOST || 'localhost',
//       port: 5432,
//       username: process.env.DB_USER || 'postgres',
//       password: process.env.DB_PASS || 'your_password',
//       database: process.env.DB_NAME || 'nest_app_db',
//       entities: [User],
//       synchronize: true, // ⚠️ 개발 중엔 true, 배포시 false!
//     }),
//     UserModule,
//   ],
// })
// export class AppModule {}

import { Module } from '@nestjs/common';
import { TestController } from './test/test.controller';

@Module({
  controllers: [TestController],
})
export class AppModule {}
