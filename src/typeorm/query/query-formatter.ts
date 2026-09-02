import { SqlFormatter } from '../formatter/sql-formatter';
import { QueryEntry, QueryOp } from '../types';

export class QueryFormatter {
  static formatForLog(entry: QueryEntry): string {
    try {
      return SqlFormatter.formatAndCompare(entry.sql, entry.params);
    } catch (error) {
      let formattedSql = `SQL formatting failed:\n${entry.sql}`;
      if (entry.params?.length) {
        formattedSql += `\nParameters: ${JSON.stringify(entry.params)}`;
      }
      return formattedSql;
    }
  }

  static formatWithMetadata(entry: QueryEntry, index: number, total: number): string {
    const parts: string[] = [];

    parts.push(`Query ${index}/${total}`);

    const opType = this.formatOperationType(entry.op);
    parts.push(`Type: ${opType}`);

    if (entry.table) {
      parts.push(`Table: ${entry.table}`);
    }

    if (entry.durationMs) {
      const durationColor = this.getDurationColor(entry.durationMs);
      parts.push(`Duration: ${durationColor}${entry.durationMs}ms\x1b[0m`);
    }

    if (entry.txn) {
      parts.push(`Transaction: \x1b[35mActive\x1b[0m`);
    }

    const metadata = parts.join(' | ');
    const formattedSql = this.formatForLog(entry);

    return `${metadata}\n${'─'.repeat(80)}\n${formattedSql}\n${'─'.repeat(80)}`;
  }

  static formatOperationType(op: QueryOp): string {
    const colors = {
      READ: '\x1b[36m',
      WRITE: '\x1b[33m',
      OTHER: '\x1b[90m',
    };
    return `${colors[op]}${op}\x1b[0m`;
  }

  static getDurationColor(durationMs: number): string {
    if (durationMs > 1000) return '\x1b[31m';
    if (durationMs > 500) return '\x1b[33m';
    return '\x1b[32m';
  }

  static formatSummary(stack: { requestId: string; queries: QueryEntry[] }): string {
    const totalQueries = stack.queries.length;
    const readQueries = stack.queries.filter(q => q.op === 'READ').length;
    const writeQueries = stack.queries.filter(q => q.op === 'WRITE').length;
    const errorQueries = stack.queries.filter(q => q.error).length;
    const totalDuration = stack.queries.reduce((sum, q) => sum + (q.durationMs || 0), 0);

    const summary =
      `\n${'='.repeat(80)}\n` +
      `Request ID: ${stack.requestId}\n` +
      `Total Queries: ${totalQueries} | READ: ${readQueries} | WRITE: ${writeQueries} | ERRORS: ${errorQueries}\n` +
      `Total Duration: ${totalDuration}ms\n` +
      `${'='.repeat(80)}`;

    return summary;
  }

  static formatError(entry: QueryEntry): string {
    const formattedSql = this.formatForLog(entry);
    return `${formattedSql}\nERROR: ${entry.error}`;
  }
}
