import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    UserModule,
    PassportModule,
    ConfigModule.forRoot(),
    ((): any => {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error(
          'JWT_SECRET environment variable is not set. Set it or load .env before starting the app.',
        );
      }
      return JwtModule.register({
        secret,
        signOptions: { expiresIn: '1d' },
      });
    })(),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
