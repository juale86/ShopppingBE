import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { LoginUserDto, CreateUserDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRespository: Repository<User>
  ){}
  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;
      
      const user = this.userRespository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10)
      })
      await this.userRespository.save(user)
      delete user.password;
      return user;
      // ToDo: Retornar el JWT de acceso
    } catch (error) {
      this.handleDBErrors(error)
    }
  }
  
  async login (loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;
    const user = await this.userRespository.findOne({
      where: { email },
      select: { email: true, password: true}
    })

    if(!user) {
      throw new UnauthorizedException('Credenciales no válidas')
    }

    if( bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Credenciales no válidas')
    }
    return user;
    // ToDo: Retornar el JWT de acceso.
  }
  
  private handleDBErrors(error: any): never {
    if(error.code === '23505')
      throw new BadRequestException(error.detail)
    throw new InternalServerErrorException('Please check server logs...')
  }
}
