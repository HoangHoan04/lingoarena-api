import { Logger, QueryRunner } from 'typeorm';
import { SqlFormatter } from '../formatter/sql-formatter';
import { QueryStackManager } from './query-stack-manager';

export class QueryLogger implements Logger {
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    const pushed = QueryStackManager.push(query, parameters, undefined, queryRunner);

    if (!pushed) {
      try {
        const formattedQuery = SqlFormatter.format(query, parameters);
        console.log(`[SQL] query:\n${formattedQuery}`);
      } catch (error) {
        console.log(`[SQL] query (formatting failed): ${query}`);
        if (parameters && parameters.length) {
          console.log(`[SQL] parameters: ${JSON.stringify(parameters)}`);
        }
        console.error(
          '[SqlFormatter] Error:',
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    const errorMsg = typeof error === 'string' ? error : (error?.message ?? `${error}`);
    const pushed = QueryStackManager.push(
      query,
      parameters,
      e => {
        e.error = errorMsg;
      },
      queryRunner,
    );

    if (!pushed) {
      try {
        const formattedQuery = SqlFormatter.format(query, parameters);
        console.warn(`[WARN] query failed: ${errorMsg}`);
        console.log(`[SQL] query:\n${formattedQuery}`);
      } catch (error) {
        console.warn(`[WARN] query failed: ${errorMsg}`);
        console.log(`[SQL] query (formatting failed): ${query}`);
        if (parameters && parameters.length) {
          console.log(`[SQL] parameters: ${JSON.stringify(parameters)}`);
        }
        console.error(
          '[SqlFormatter] Error:',
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    const pushed = QueryStackManager.push(
      query,
      parameters,
      e => {
        e.durationMs = time;
      },
      queryRunner,
    );

    if (!pushed) {
      try {
        const formattedQuery = SqlFormatter.format(query, parameters);
        console.warn(`[WARN] slow query (${time}ms):\n${formattedQuery}`);
      } catch (error) {
        console.warn(`[WARN] slow query (${time}ms) (formatting failed): ${query}`);
        if (parameters && parameters.length) {
          console.log(`[SQL] parameters: ${JSON.stringify(parameters)}`);
        }
        console.error(
          '[SqlFormatter] Error:',
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    console.log(`[LOG] ${message}`);
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    console.log(`[LOG] ${message}`);
  }

  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
    const prefix = level.toUpperCase();
    const msg = typeof message === 'string' ? message : JSON.stringify(message);

    if (
      msg.includes('query:') ||
      msg.includes('SELECT') ||
      msg.includes('INSERT') ||
      msg.includes('UPDATE') ||
      msg.includes('DELETE')
    ) {
      const queryMatch = msg.match(/query:\s*(.+?)(?:\s+--\s+parameters:\s*(\[.*\]))?$/s);
      if (queryMatch) {
        const query = queryMatch[1].trim();
        const paramsStr = queryMatch[2];
        const parameters = paramsStr ? JSON.parse(paramsStr) : undefined;

        try {
          const formattedQuery = SqlFormatter.format(query, parameters);
          console.log(`[SQL] query:\n${formattedQuery}`);
        } catch (error) {
          console.log(`[SQL] query (formatting failed): ${query}`);
          if (parameters && parameters.length) {
            console.log(`[SQL] parameters: ${JSON.stringify(parameters)}`);
          }
          console.error(
            '[SqlFormatter] Error:',
            error instanceof Error ? error.message : String(error),
          );
        }
      } else {
        console.log(`[SQL] ${msg}`);
      }
    } else {
      console.log(`[${prefix}] ${msg}`);
    }
  }
}
