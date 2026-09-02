export class Colorizer {
  private static readonly COLORS = {
    reset: '\x1b[0m',
    keyword: '\x1b[34m',
    string: '\x1b[32m',
    number: '\x1b[35m',
    boolean: '\x1b[95m',
    null: '\x1b[91m',
    table: '\x1b[33m',
    column: '\x1b[36m',
    operator: '\x1b[97m',
  };

  static colorizeSql(sql: string, colorize = true): string {
    if (!colorize) {
      return sql;
    }

    let coloredSql = sql;

    coloredSql = coloredSql.replace(
      /'([^']|'')*'/g,
      match => `${this.COLORS.string}${match}${this.COLORS.reset}`,
    );

    coloredSql = coloredSql.replace(/\b\d+(?:\.\d+)?\b/g, match => {
      if (match.includes('\x1b[')) return match;
      return `${this.COLORS.number}${match}${this.COLORS.reset}`;
    });

    coloredSql = coloredSql.replace(
      /\b(true|false)\b/gi,
      match => `${this.COLORS.boolean}${match.toLowerCase()}${this.COLORS.reset}`,
    );

    coloredSql = coloredSql.replace(
      /\bNULL\b/gi,
      match => `${this.COLORS.null}${match.toUpperCase()}${this.COLORS.reset}`,
    );

    coloredSql = coloredSql.replace(
      /=|!=|<>|<|>|<=|>=|IN\s*\(|BETWEEN|LIKE/gi,
      match => `${this.COLORS.operator}${match}${this.COLORS.reset}`,
    );

    const keywords = [
      'SELECT',
      'FROM',
      'WHERE',
      'INSERT',
      'UPDATE',
      'DELETE',
      'INTO',
      'VALUES',
      'INNER JOIN',
      'LEFT JOIN',
      'RIGHT JOIN',
      'FULL JOIN',
      'CROSS JOIN',
      'JOIN',
      'AND',
      'OR',
      'NOT',
      'GROUP BY',
      'HAVING',
      'ORDER BY',
      'LIMIT',
      'OFFSET',
      'UNION',
      'UNION ALL',
      'INTERSECT',
      'EXCEPT',
      'CASE',
      'WHEN',
      'THEN',
      'ELSE',
      'END',
      'ASC',
      'DESC',
      'IS',
      'DISTINCT',
      'EXISTS',
    ];

    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);

    for (const keyword of sortedKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b(?![^\\x1b]*\\[)`, 'gi');
      coloredSql = coloredSql.replace(
        regex,
        match => `${this.COLORS.keyword}${match.toUpperCase()}${this.COLORS.reset}`,
      );
    }

    coloredSql = coloredSql.replace(
      /(?:FROM|JOIN|\x1b\[34m(?:FROM|JOIN)\x1b\[0m)\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s+([a-z]{1,2})\b/gi,
      (match, table, alias) => {
        if (table.includes('\x1b[')) return match;

        const coloredTable = table.includes('.')
          ? table.replace(
              /([^.]+)\.([^.]+)/,
              (_, schema, name) => `${this.COLORS.table}${schema}.${name}${this.COLORS.reset}`,
            )
          : `${this.COLORS.table}${table}${this.COLORS.reset}`;

        const keywordPart = match.substring(0, match.indexOf(table));
        return `${keywordPart}${coloredTable} ${alias}`;
      },
    );
    const columnPattern = /\b([a-z]{1,2})\.([a-z_][a-z0-9_]*)\b/gi;
    coloredSql = coloredSql.replace(columnPattern, (match, alias, column) => {
      if (match.includes('\x1b[')) return match;

      return `${this.COLORS.column}${alias}.${column}${this.COLORS.reset}`;
    });

    return coloredSql;
  }

  static get resetCode(): string {
    return this.COLORS.reset;
  }

  static getColorCode(name: keyof (typeof Colorizer)['COLORS']): string {
    return this.COLORS[name];
  }
}
