import { Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/common/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly redisService?: RedisService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hash = await bcrypt.hash(
      createUserDto.password,
      process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS) : 10,
    );
    const user = await this.userService.create({
      ...createUserDto,
      password: hash,
    });
    return user;
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...rest } = user as any;
    return rest;
  }

  async login(user: any) {
    if (!user || !user.id) {
      throw new UnauthorizedException();
    }
    const payload = { email: user.email, sub: user.id, role: user.role };
    const jti = randomUUID();
    const access_token = await this.jwtService.signAsync(payload, {
      jwtid: jti,
    });
    return { access_token, user, jti };
  }

  async revokeToken(token: string) {
    if (!token || !this.redisService) return;
    try {
      const decoded = this.jwtService.decode(token);
      if (!decoded) return;
      const jti = decoded.jti || decoded.jti || decoded['jti'];
      const exp = decoded.exp;
      if (!jti || !exp) return;
      const ttlMs = exp * 1000 - Date.now();
      const ttlSeconds = Math.max(1, Math.floor(ttlMs / 1000));
      await this.redisService.set(`revoked_jti:${jti}`, '1', ttlSeconds);
    } catch (e) {
      console.log(e);
    }
  }
}
