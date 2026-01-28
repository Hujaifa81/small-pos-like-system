import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { RedisService } from 'src/common/redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly redisService?: RedisService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const cookieExtractor = (req: Request) => {
      return req?.cookies?.access_token || null;
    };

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const jti = payload?.jti;
    try {
      console.log('JwtStrategy: validating token jti=', jti);
    } catch (e) {
      console.error('JwtStrategy logging error:', e);
    }

    if (jti && this.redisService) {
      try {
        const blocked = await this.redisService.get(`revoked_jti:${jti}`);
        try {
          console.log(`JwtStrategy: revoked_jti:${jti} ->`, blocked);
        } catch (e) {
          console.error('JwtStrategy logging error:', e);
        }
        if (blocked) throw new UnauthorizedException('Token revoked');
      } catch (e) {
        console.error('JwtStrategy check error:', e);
      }
    }

    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
