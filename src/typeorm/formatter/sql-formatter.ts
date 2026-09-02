import { AliasSimplifier } from '../ast/alias-simplifier';
import { FormatOptions, ValidationResult } from '../types';
import { Colorizer } from './colorizer';
import { ParameterSubstituter } from './parameter-substituter';
import { PrettyPrinter } from './pretty-printer';

export class SqlFormatter {
  private static initialized = false;

  x;
  static async initialize(): Promise<void> {
    if (!this.initialized) {
      const { AstManager } = await import('../ast/ast-manager');
      await AstManager.initialize();
      this.initialized = true;
    }
  }

  static format(sql: string, parameters?: any[], options?: FormatOptions | boolean): string {
    let colorize = true;
    let formatOpts: FormatOptions = {};

    if (typeof options === 'boolean') {
      colorize = options;
    } else if (options) {
      formatOpts = options;
      colorize = options.colorize ?? true;
    }

    let formattedSql = this.simplifyAliases(sql);
    formattedSql = ParameterSubstituter.substituteParameters(formattedSql, parameters);
    formattedSql = PrettyPrinter.indentSql(formattedSql, formatOpts);
    formattedSql = Colorizer.colorizeSql(formattedSql, colorize);

    return formattedSql;
  }

  static async validate(sql: string): Promise<ValidationResult> {
    const { parse } = await import('pgsql-parser');
    try {
      await parse(sql);
      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  static formatOriginalOnly(sql: string, parameters?: any[], colorize = true): string {
    let originalSql = sql;
    originalSql = ParameterSubstituter.substituteParameters(originalSql, parameters);
    originalSql = Colorizer.colorizeSql(originalSql, colorize);

    return originalSql;
  }

  static formatAndCompare(
    sql: string,
    parameters?: any[],
    options?: FormatOptions | boolean,
  ): string {
    let colorize = true;
    if (typeof options === 'boolean') {
      colorize = options;
    } else if (options) {
      colorize = options.colorize ?? true;
    }

    const beforeSql = this.formatOriginalOnly(sql, parameters, colorize);
    let afterSql: string;
    try {
      afterSql = this.format(sql, parameters, options);
    } catch (error: any) {
      console.warn('[SqlFormatter] formatAndCompare failed for SQL:', sql);
      console.warn('[SqlFormatter] Parameters:', JSON.stringify(parameters));
      console.warn('[SqlFormatter] Error:', error instanceof Error ? error.message : String(error));
      afterSql = beforeSql;
    }

    const divider = '═'.repeat(59);
    const keywordColor = colorize ? Colorizer.getColorCode('keyword') : '';
    const resetColor = colorize ? Colorizer.resetCode : '';

    const comparison =
      `\n  ${keywordColor}BEFORE:${resetColor}\n` +
      `  ${beforeSql}\n\n` +
      `  ${divider}\n\n` +
      `  ${keywordColor}AFTER:${resetColor}\n` +
      `  ${afterSql}`;

    return comparison;
  }

  static logComparison(sql: string, parameters?: any[], options?: FormatOptions | boolean): void {
    const comparison = this.formatAndCompare(sql, parameters, options);
    console.log(comparison);
  }

  private static simplifyAliases(sql: string): string {
    try {
      const result = AliasSimplifier.simplifyEntityAliasesSync(sql);

      if (result.success) {
        console.log(`[SqlFormatter] Simplified ${result.aliasesSimplified} aliases`);
        return result.sql;
      }

      console.warn('[SqlFormatter] AST simplification failed, preserving original aliases');
      return sql;
    } catch (error: any) {
      console.warn('[SqlFormatter] Alias simplification error:', error.message);
      return sql;
    }
  }
}
