export class ParameterSubstituter {
  static substituteParameters(sql: string, parameters?: any[]): string {
    if (!parameters || parameters.length === 0) {
      return sql;
    }

    let formattedSql = sql;

    for (let i = 0; i < parameters.length; i++) {
      const placeholder = `$${i + 1}`;
      const value = this.formatParameter(parameters[i]);
      const escapedPlaceholder = this.escapeRegex(placeholder);
      formattedSql = formattedSql.replace(
        new RegExp(escapedPlaceholder + '(?=\\s|\\)|\\)|,|;|$)', 'g'),
        value,
      );
    }

    return formattedSql;
  }

  static formatParameter(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'string') {
      return this.escapeString(value);
    }

    if (typeof value === 'object') {
      if (value instanceof Date) {
        return `'${value.toISOString()}'`;
      }

      if (Array.isArray(value)) {
        return this.formatArray(value);
      }

      if (value.toString && value.toString !== Object.prototype.toString) {
        return `'${String(value)}'`;
      }

      if (Buffer.isBuffer(value)) {
        return `'<binary data>'`;
      }

      try {
        return `'${JSON.stringify(value)}'`;
      } catch {
        return `'${String(value)}'`;
      }
    }

    return `'${String(value)}'`;
  }

  static formatArray(value: any[]): string {
    const formattedArray = value.map(v => this.formatParameter(v));
    return `(${formattedArray.join(', ')})`;
  }

  static escapeString(value: string): string {
    const escaped = value.replace(/'/g, "''");
    return `'${escaped}'`;
  }

  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
