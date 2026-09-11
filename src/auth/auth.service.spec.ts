import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let jwtService: Pick<JwtService, 'sign'>;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('jwt-token') };
    service = new AuthService(
      userRepository as unknown as Repository<User>,
      jwtService as JwtService,
    );
  });

  it('creates a user with a hashed password and omits the password from the response', async () => {
    const savedUser = {
      id: 'user-id',
      email: 'user@example.com',
      fullName: 'Test User',
      password: 'hashed-password',
    } as User;
    userRepository.create.mockReturnValue(savedUser);
    userRepository.save.mockResolvedValue(savedUser);
    (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed-password');

    const result = await service.create({
      email: 'user@example.com',
      fullName: 'Test User',
      password: 'plain-password',
    });

    expect(bcrypt.hashSync).toHaveBeenCalledWith('plain-password', 10);
    expect(userRepository.create).toHaveBeenCalledWith({
      email: 'user@example.com',
      fullName: 'Test User',
      password: 'hashed-password',
    });
    expect(result).toEqual({
      id: 'user-id',
      email: 'user@example.com',
      fullName: 'Test User',
    });
    expect(result).not.toHaveProperty('password');
  });

  it('returns a token when login credentials are valid', async () => {
    const user = {
      id: 'user-id',
      email: 'user@example.com',
      fullName: 'Test User',
      password: 'hashed-password',
      isActive: true,
      roles: ['user'],
    } as unknown as User;
    userRepository.findOne.mockResolvedValue(user);
    (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

    const result = await service.login({
      email: user.email,
      password: 'plain-password',
    });

    expect(jwtService.sign).toHaveBeenCalledWith({ id: 'user-id' });
    expect(result).toEqual({
      id: 'user-id',
      email: 'user@example.com',
      fullName: 'Test User',
      isActive: true,
      roles: ['user'],
      token: 'jwt-token',
    });
    expect(result).not.toHaveProperty('password');
  });

  it('rejects login when the user does not exist or the password is invalid', async () => {
    userRepository.findOne.mockResolvedValueOnce(null);
    await expect(
      service.login({ email: 'missing@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    userRepository.findOne.mockResolvedValueOnce({
      password: 'hashed-password',
    });
    (bcrypt.compareSync as jest.Mock).mockReturnValue(false);
    await expect(
      service.login({ email: 'user@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('maps duplicate and unexpected database errors during registration', async () => {
    userRepository.create.mockImplementation(() => {
      throw Object.assign(new Error('email already exists'), {
        code: '23505',
        detail: 'email already exists',
      });
    });
    await expect(
      service.create({
        email: 'user@example.com',
        fullName: 'Test User',
        password: 'password',
      }),
    ).rejects.toEqual(new BadRequestException('email already exists'));

    userRepository.create.mockImplementation(() => {
      throw Object.assign(new Error('unexpected'), { code: 'unexpected' });
    });
    await expect(
      service.create({
        email: 'user@example.com',
        fullName: 'Test User',
        password: 'password',
      }),
    ).rejects.toEqual(
      new InternalServerErrorException('Please check server logs...'),
    );
  });
});
