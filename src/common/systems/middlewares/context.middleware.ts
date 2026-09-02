import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { ClsHook, RequestContext } from '~/common/core/context';

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: Function) {
    try {
      const requestContext = new RequestContext(req, res);
      ClsHook.run(() => {
        ClsHook.set(RequestContext.name, requestContext);
        next();
      });
    } catch (error) {
      next();
    }
  }
}
