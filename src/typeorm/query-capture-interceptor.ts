import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class QueryCaptureInterceptor implements NestInterceptor {
  private static readonly logger = new Logger(QueryCaptureInterceptor.name);
  private static capturedQueries: CapturedQuery[] = [];
  private static queryRunner: QueryRunner | null = null;
  private static dataSource: DataSource | null = null;

  constructor() {}

  static initialize(dataSource: DataSource): void {
    this.dataSource = dataSource;
    this.capturedQueries = [];
    this.logger.log('QueryCaptureInterceptor initialized');
  }

  static startCapture(): void {
    if (!this.dataSource) {
      throw new Error('QueryCaptureInterceptor not initialized. Call initialize() first.');
    }

    this.queryRunner = this.dataSource.createQueryRunner();
    this.queryRunner.connect();
    this.queryRunner.startTransaction();
    this.logger.debug('Query capture started');
  }

  static stopCapture(): CapturedQuery[] {
    if (this.queryRunner) {
      this.queryRunner.rollbackTransaction();
      this.queryRunner.release();
      this.queryRunner = null;
    }
    const queries = [...this.capturedQueries];
    this.capturedQueries = [];
    this.logger.debug(`Query capture stopped. Captured ${queries.length} queries.`);
    return queries;
  }

  static getCapturedQueries(): CapturedQuery[] {
    return [...this.capturedQueries];
  }

  static clearCapturedQueries(): void {
    this.capturedQueries = [];
  }

  static captureQuery(sql: string, parameters?: any[]): void {
    this.capturedQueries.push({
      sql,
      parameters: parameters || [],
      timestamp: new Date(),
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: data => {
          const duration = Date.now() - startTime;
          QueryCaptureInterceptor.logger.debug(`Request completed in ${duration}ms`);
          if (QueryCaptureInterceptor.queryRunner) {
            const queryLog = (QueryCaptureInterceptor.queryRunner as any).queryLog;
            if (queryLog && Array.isArray(queryLog)) {
              for (const log of queryLog) {
                QueryCaptureInterceptor.capturedQueries.push({
                  sql: log.query,
                  parameters: log.parameters || [],
                  timestamp: new Date(),
                });
              }
            }
          }
        },
        error: error => {
          const duration = Date.now() - startTime;
          QueryCaptureInterceptor.logger.error(
            `Request failed after ${duration}ms: ${error.message}`,
          );
        },
      }),
    );
  }
}

export interface CapturedQuery {
  sql: string;
  parameters: any[];
  timestamp: Date;
}

export class QueryCaptureHelper {
  private dataSource: DataSource | null = null;

  async initialize(dataSource: DataSource): Promise<void> {
    this.dataSource = dataSource;
    QueryCaptureInterceptor.initialize(dataSource);
  }

  async capture<T>(fn: () => Promise<T>): Promise<{ result: T; queries: CapturedQuery[] }> {
    if (!this.dataSource) {
      throw new Error('QueryCaptureHelper not initialized. Call initialize() first.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const originalQuery = queryRunner.query.bind(queryRunner);
      (queryRunner as any).query = async (sql: string, parameters?: any[]): Promise<any> => {
        QueryCaptureInterceptor.captureQuery(sql, parameters);
        return originalQuery(sql, parameters);
      };

      const result = await fn();

      await queryRunner.commitTransaction();
      const queries = QueryCaptureInterceptor.stopCapture();

      return { result, queries };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      QueryCaptureInterceptor.stopCapture();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async captureRepositoryOperation<T>(
    repository: any,
    method: string,
    args: any[],
  ): Promise<CapturedQuery[]> {
    return this.capture(async () => {
      await (repository as any)[method](...args);
    }).then(({ queries }) => queries);
  }

  static getLastQuery(queries: CapturedQuery[]): CapturedQuery | null {
    if (queries.length === 0) return null;
    return queries[queries.length - 1];
  }

  static filterByPattern(queries: CapturedQuery[], pattern: RegExp): CapturedQuery[] {
    return queries.filter(q => pattern.test(q.sql));
  }

  static findDistinctQueries(queries: CapturedQuery[]): CapturedQuery[] {
    return this.filterByPattern(queries, /\bSELECT\s+DISTINCT\b/i);
  }

  static findOrderByQueries(queries: CapturedQuery[]): CapturedQuery[] {
    return this.filterByPattern(queries, /\bORDER\s+BY\b/i);
  }

  static findSubqueryQueries(queries: CapturedQuery[]): CapturedQuery[] {
    return this.filterByPattern(queries, /\(SELECT/i);
  }
}
