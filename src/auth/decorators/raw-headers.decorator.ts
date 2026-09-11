import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const RawHeadersDecorator = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();
    return req.rawHeaders;
  },
);
