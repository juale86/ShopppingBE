import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const RawHeadersDecorator = createParamDecorator((
    data: string, ctx: ExecutionContext
) => {
    const rawHeaders = ctx.switchToHttp().getRequest()
    return rawHeaders.rawHeaders;
})