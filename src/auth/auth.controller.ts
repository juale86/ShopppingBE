import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto/';
import { GetUser } from './decorators/get-user.decoradot';
import { User } from './entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }
  
  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto){
    return this.authService.login(loginUserDto)
  }

  @Get('privateRoute')
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    @GetUser(['user', 'algooo']) user: User
  ) {
    return {
      ok: true,
      message: "Hola Bruno",
      user: user
    }
  }
  
}
