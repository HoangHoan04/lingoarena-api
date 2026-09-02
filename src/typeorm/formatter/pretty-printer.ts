import { format as formatSQL } from 'sql-formatter';
import { FormatOptions } from '../types';

export class PrettyPrinter {
  static indentSql(sql: string, options?: FormatOptions): string {
    try {
      return formatSQL(sql, {
        language: 'postgresql',
        keywordCase: options?.uppercaseKeywords ? 'upper' : 'preserve',
        functionCase: options?.uppercaseFunctions ? 'upper' : 'preserve',
        tabWidth: options?.indentSize ?? 2,
        useTabs: options?.useTabs ?? false,
        linesBetweenQueries: 1,
      });
    } catch (error) {
      console.warn(
        '[PrettyPrinter] Failed to pretty-print SQL, returning original:',
        error instanceof Error ? error.message : String(error),
      );
      return sql;
    }
  }

  static shouldIncreaseIndent(sql: string, position: number): boolean {
    const before = sql.substring(0, position).toUpperCase();
    const after = sql.substring(position);

    const clauseStartPatterns = [
      /\bSELECT\b/,
      /\bFROM\b/,
      /\bWHERE\b/,
      /\bGROUP BY\b/,
      /\bHAVING\b/,
      /\bORDER BY\b/,
      /\bUNION\b/,
      /\bINTERSECT\b/,
      /\bEXCEPT\b/,
    ];

    for (const pattern of clauseStartPatterns) {
      if (before.match(pattern)) {
        return true;
      }
    }

    return false;
  }

  static isStartOfClause(sql: string, position: number): boolean {
    const before = sql.substring(0, position).toUpperCase();

    const clauses = [
      'SELECT',
      'FROM',
      'WHERE',
      'GROUP BY',
      'HAVING',
      'ORDER BY',
      'LIMIT',
      'OFFSET',
      'UNION',
      'INTERSECT',
      'EXCEPT',
      'AND',
      'OR',
    ];

    for (const clause of clauses) {
      const regex = new RegExp(`\\b${clause}\\s*$`, 'i');
      if (before.match(regex)) {
        return true;
      }
    }

    return false;
  }

  static addIndentation(sql: string, indentSize: number = 2, useTabs: boolean = false): string {
    const indentChar = useTabs ? '\t' : ' '.repeat(indentSize);
    const lines = sql.split('\n');
    let currentIndent = 0;

    const indentedLines = lines.map(line => {
      const trimmed = line.trim();

      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      currentIndent -= closeParens;
      const result = indentChar.repeat(Math.max(0, currentIndent)) + trimmed;
      currentIndent += openParens;

      return result;
    });

    return indentedLines.join('\n');
  }
}
