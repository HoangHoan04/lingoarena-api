import { QueryOp } from '../types';

export class QueryClassifier {
  static classify(sql: string): { op: QueryOp; table?: string } {
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();
    let op: QueryOp = 'OTHER';

    if (upper.startsWith('SELECT')) op = 'READ';
    else if (upper.startsWith('INSERT') || upper.startsWith('UPDATE') || upper.startsWith('DELETE'))
      op = 'WRITE';

    let table: string | undefined;
    if (upper.startsWith('SELECT')) {
      const m = sql.match(/FROM\s+(?:"([a-zA-Z0-9_]+)"\.)?"?([a-zA-Z0-9_]+)"?/i);
      table = m ? (m[1] ? `${m[1]}.${m[2]}` : m[2]) : undefined;
    } else if (upper.startsWith('INSERT')) {
      const m = sql.match(/INTO\s+(?:"([a-zA-Z0-9_]+)"\.)?"?([a-zA-Z0-9_]+)"?/i);
      table = m ? (m[1] ? `${m[1]}.${m[2]}` : m[2]) : undefined;
    } else if (upper.startsWith('UPDATE')) {
      const m = sql.match(/UPDATE\s+(?:"([a-zA-Z0-9_]+)"\.)?"?([a-zA-Z0-9_]+)"?/i);
      table = m ? (m[1] ? `${m[1]}.${m[2]}` : m[2]) : undefined;
    } else if (upper.startsWith('DELETE')) {
      const m = sql.match(/FROM\s+(?:"([a-zA-Z0-9_]+)"\.)?"?([a-zA-Z0-9_]+)"?/i);
      table = m ? (m[1] ? `${m[1]}.${m[2]}` : m[2]) : undefined;
    }

    return { op, table };
  }

  static getOperationType(sql: string): QueryOp {
    const result = this.classify(sql);
    return result.op;
  }

  static getAffectedTable(sql: string): string | undefined {
    const result = this.classify(sql);
    return result.table;
  }

  static isWriteOperation(sql: string): boolean {
    const op = this.getOperationType(sql);
    return op === 'WRITE';
  }

  static isReadOperation(sql: string): boolean {
    const op = this.getOperationType(sql);
    return op === 'READ';
  }
}
