import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TrimInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { body } = request;
    const where = body?.where;
    if (where) {
      for (const key in where) {
        if (typeof where[key] === 'string') {
          where[key] = where[key].trim();

          const specialChars = [';', '"', "'"];
          const keywords = ['SELECT', 'UNION'];
          let result = where[key];
          specialChars.forEach(char => {
            result = result.replaceAll(char, '');
          });
          keywords.forEach(keyword => {
            result = result.replaceAll(new RegExp(keyword, 'gi'), '');
          });

          where[key] = result;
        }
      }
    }
    return next.handle().pipe(
      map(data => {
        return data;
      }),
    );
  }
}
