import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { LoginUserDto, CreateUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Auth } from './decorators';
import { ValidRoles } from './interfaces';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { password: dtoPassword, ...userWithoutPassword } = createUserDto;

      const user = this.userRepository.create({
        ...userWithoutPassword,
        password: bcrypt.hashSync(dtoPassword, 10),
      });
      await this.userRepository.save(user);
      const { password, ...userData } = user;
      return userData;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { password: dtoPassword, email } = loginUserDto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: {
        email: true,
        password: true,
        fullName: true,
        isActive: true,
        roles: true,
        id: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales no válidas, usuario');
    }

    if (!bcrypt.compareSync(dtoPassword, user.password)) {
      throw new UnauthorizedException('Credenciales no válidas, password');
    }
    const { password, ...userData } = user;
    return {
      ...userData,
      token: this.getJwt({ id: user.id }),
    };
  }

  @Auth()
  checkAuthStatus(user: User) {
    return {
      ...user,
      token: this.getJwt({ id: user.id }),
    };
  }

  async updateRole(userId: string, role: ValidRoles) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    if (role === ValidRoles.superUser) {
      throw new BadRequestException(
        'Cannot assign super-user role. Only created during initialization.',
      );
    }

    if (!user.roles.includes(role)) {
      user.roles = [role];
    }

    await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAllUsers() {
    const users = await this.userRepository.find();
    return users.map(({ password, ...user }) => user);
  }

  isSuperUser(user: User): boolean {
    return user.roles.includes(ValidRoles.superUser);
  }

  isAdmin(user: User): boolean {
    return user.roles.includes(ValidRoles.admin);
  }

  isAdminOrSuperUser(user: User): boolean {
    return this.isSuperUser(user) || this.isAdmin(user);
  }

  private getJwt(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDBErrors(error: unknown): never {
    const dbError = error as { code?: string; detail?: string };
    if (dbError.code === '23505') throw new BadRequestException(dbError.detail);
    throw new InternalServerErrorException('Please check server logs...');
  }

  async promoteToAdmin(id: string) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    if (user.roles.includes(ValidRoles.admin)) {
      throw new BadRequestException('User is already an admin');
    }

    user.roles = [...user.roles, ValidRoles.admin];
    await this.userRepository.save(user);

    const { password, ...rest } = user;
    return rest;
  }
}
