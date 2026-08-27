import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ValidRoles, Roles } from '../../interfaces';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ){}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const validRoles: ValidRoles[] = this.reflector.get(Roles, context.getHandler())

    if(!validRoles) return true;
    if(validRoles.length === 0 ) return false;
    
    const {user} = context.switchToHttp().getRequest()

    if (!user) {
      throw new BadRequestException('User not found')
    }

    if (user.roles.some((element) => validRoles.includes(element)))
      return true
    
    throw new ForbiddenException(`User ${ user.fullName } need a valid role: [${validRoles}]`)
  }
}
