import { IsEnum, IsOptional } from 'class-validator';
import { ValidRoles } from '../interfaces/roles.interface';

export class UpdateUserRoleDto {
  @IsEnum(ValidRoles, {
    message: `Role must be one of: ${Object.values(ValidRoles).join(', ')}`,
  })
  role: ValidRoles;
}
