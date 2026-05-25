import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'absentia.db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
