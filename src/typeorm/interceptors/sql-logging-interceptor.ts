import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestContext } from '~/common/core/context';
import { QueryFormatter } from '../query/query-formatter';
import { QueryStackManager } from '../query/query-stack-manager';
import { QueryLogStack } from '../types';

@Injectable()
export class SqlLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SQL');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const requestId = RequestContext.currentRequestContext()?.id || 'unknown';

    const newStack = QueryStackManager.createStack(requestId);

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logQueries(newStack, duration, false);
        },
        error: error => {
          const duration = Date.now() - startTime;
          this.logQueries(newStack, duration, true);
        },
        finalize: () => {
          QueryStackManager.pop();
        },
      }),
    );
  }

  private logQueries(stack: QueryLogStack, requestDuration: number, hasError: boolean): void {
    if (!stack.queries || stack.queries.length === 0) {
      return;
    }

    this.logger.log(QueryFormatter.formatSummary(stack));

    stack.queries.forEach((query, index) => {
      if (query.error) {
        this.logger.error(QueryFormatter.formatError(query));
      } else {
        this.logger.log(QueryFormatter.formatWithMetadata(query, index + 1, stack.queries.length));
      }
    });
  }
}
