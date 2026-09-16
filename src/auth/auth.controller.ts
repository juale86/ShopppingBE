import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto/';
import { User } from './entities/user.entity';
import { GetUser, Auth } from './decorators/';
import { ValidRoles } from './interfaces';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns token',
  })
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-status')
  @ApiOperation({ summary: 'Check authentication status' })
  @ApiResponse({
    status: 200,
    description: 'Authentication status checked successfully',
  })
  @Auth(ValidRoles.user)
  checkAuthStatus(@GetUser() user: User) {
    return this.authService.checkAuthStatus(user);
  }

  @Patch('users/:id/role')
  @Auth(ValidRoles.superUser)
  @ApiOperation({
    summary: 'Update user role (Super-user only)',
    description:
      'Only super-user can change other users roles. Cannot change your own role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid role or cannot change own role',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateUserRole(
    @Param('id') userId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @GetUser() currentUser: User,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (userId === currentUser.id) {
      throw new BadRequestException(
        'Cannot change your own role. Ask another super-user to do it.',
      );
    }

    await this.authService.findUserById(userId);

    return this.authService.updateRole(userId, updateUserRoleDto.role);
  }

  @Get('users')
  @Auth(ValidRoles.superUser)
  @ApiOperation({
    summary: 'Get all users (Super-user only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
  })
  async getAllUsers() {
    return this.authService.findAllUsers();
  }

  @Get('users/:id')
  @Auth(ValidRoles.superUser)
  @ApiOperation({
    summary: 'Get user by ID (Super-user only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User data (without password)',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserById(@Param('id') userId: string) {
    return this.authService.findUserById(userId);
  }

  @Patch('users/:id/promote')
  @Auth(ValidRoles.superUser)
  promoteToAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.authService.promoteToAdmin(id);
  }
}
