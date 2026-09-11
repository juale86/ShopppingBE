import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '../entities/user.entity';

export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();
    const user = req.user as User | undefined;
    if (!user) {
      throw new InternalServerErrorException('User not found (request)<<<<');
    }
    return !data ? user : (user as unknown as Record<string, unknown>)[data];
  },
);
