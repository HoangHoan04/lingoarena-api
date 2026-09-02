import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { UserDto } from '~/dto';

export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  if (!request.user) return null;

  const user = plainToClass(UserDto, request.user);
  user.name = user.employeeName || user.username;
  user.code = user.employeeCode || user.username;
  return user;
});
