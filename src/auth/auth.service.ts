import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { LoginUserDto, CreateUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Auth } from './decorators';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRespository: Repository<User>,
    private readonly jwtService: JwtService,
  ){}

  async create(createUserDto: CreateUserDto) {
    try {
      const { password: dtoPassword, ...userWithoutPassword } = createUserDto;
      
      const user = this.userRespository.create({
        ...userWithoutPassword,
        password: bcrypt.hashSync(dtoPassword, 10)
      })
      await this.userRespository.save(user)
      const { password, ...userData } = user;
      return userData;
      // ToDo: Retornar el JWT de acceso?
    } catch (error) {
      this.handleDBErrors(error)
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { password: dtoPassword, email } = loginUserDto;
    const user = await this.userRespository.findOne({
      where: { email },
      select: { email: true, password: true, fullName: true, isActive: true, roles: true, id: true }
    })

    if(!user) {
      throw new UnauthorizedException('Credenciales no válidas, usuario')
    }

    if( !bcrypt.compareSync(dtoPassword, user.password)) {
      throw new UnauthorizedException('Credenciales no válidas, password')
    }
    const { password, ...userData} = user
    return {
      ...userData,
      token: this.getJwt({id: user.id})
    };
  }
  
  @Auth()
  async checkAuthStatus(
    user: User
  ){
    return {
      ...user,
      token: this.getJwt({id: user.id})
    };
  }
  
  private getJwt( payload: JwtPayload){
    const token = this.jwtService.sign(payload)
    return token;
  }

  private handleDBErrors(error: any): never {
    if(error.code === '23505')
      throw new BadRequestException(error.detail)
    throw new InternalServerErrorException('Please check server logs...')
  }
}
