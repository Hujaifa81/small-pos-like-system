import { Controller, Post, Body, UseGuards, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserService } from 'src/user/user.service';
import { CurrentUser } from './current-user.decorator';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import type { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.create(createUserDto);
    return { data: user, message: 'User registered successfully' };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(user);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 1000,
    };
    res.cookie('access_token', result.access_token, cookieOptions);

    return {
      data: { user: result.user, access_token: result.access_token },
      message: 'Login successful',
    };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token =
      req.cookies?.access_token ||
      req.headers['authorization']?.toString().replace(/^Bearer\s+/i, '') ||
      null;
    if (token) {
      try {
        await this.authService.revokeToken(token);
      } catch (e) {
        console.error(e);
      }
    }
    res.clearCookie('access_token');
    return { message: 'Logged out' };
  }
}
