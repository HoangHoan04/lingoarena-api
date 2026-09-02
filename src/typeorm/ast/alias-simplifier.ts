import { ASTAliasSimplifier } from '../sql-ast-simplifier';
import { AliasMapping, AliasSimplificationResult } from '../types';
import { ASTUtilities } from './sql-ast-utilities';

export class AliasSimplifier {
  private static readonly SHORT_ALIAS_CHARS = 'tuvwxyzabcdefghijlmnopqrswk';

  static async simplifyEntityAliases(sql: string): Promise<AliasSimplificationResult> {
    try {
      return await ASTAliasSimplifier.simplifyAliases(sql);
    } catch (error: any) {
      return {
        success: false,
        sql,
        aliasesSimplified: 0,
        errors: [error.message],
      };
    }
  }

  static simplifyEntityAliasesSync(sql: string): AliasSimplificationResult {
    try {
      return ASTAliasSimplifier.simplifyAliasesSync(sql);
    } catch (error: any) {
      return {
        success: false,
        sql,
        aliasesSimplified: 0,
        errors: [error.message],
      };
    }
  }

  static getShortAlias(index: number): string {
    return this.SHORT_ALIAS_CHARS[index % this.SHORT_ALIAS_CHARS.length];
  }

  static simplifyDistinctAliasColumns(sql: string): string {
    let formatted = sql;

    formatted = formatted.replace(
      /"distinctAlias"\."([a-z]{1,2}\d*)_([a-zA-Z0-9_]+)"/g,
      '"distinctAlias"."$2"',
    );

    formatted = formatted.replace(
      /"distinctAlias"\."([A-Z][a-zA-Z0-9]*Entity)_([a-zA-Z0-9_]+)"/g,
      '"distinctAlias"."$2"',
    );

    return formatted;
  }

  static removeOuterDistinctAS(sql: string): string {
    let formatted = sql;

    formatted = formatted.replace(
      /"distinctAlias"\."([a-z]{1,2}\d*)_([a-zA-Z0-9_]+)"\s+AS\s+"ids_[a-z]{1,2}\d*_?\1/gi,
      '"distinctAlias"."$2"',
    );

    formatted = formatted.replace(
      /"distinctAlias"\."([A-Z][a-zA-Z0-9]*Entity)_([a-zA-Z0-9_]+)"\s+AS\s+"ids_[A-Z][a-zA-Z0-9]*Entity_\1/gi,
      '"distinctAlias"."$2"',
    );

    return formatted;
  }

  static simplifyParentheses(sql: string): string {
    return sql.replace(/\b(WHERE|ON|HAVING)\s+\(\(([^()]*(?:\([^()]*\)[^()]*)*)\)\)/g, '$1 ($2)');
  }

  static buildColumnMapping(sql: string, isDistinctQuery: boolean): Map<string, string> {
    const columnMap = new Map<string, string>();
    if (!isDistinctQuery) return columnMap;

    const selectPattern =
      /SELECT\s+DISTINCT\s+"distinctAlias"\."([a-z]{1,2}\d*)_([a-zA-Z0-9_]+)|"distinctAlias"\."([A-Z][a-zA-Z0-9]*Entity)_([a-zA-Z0-9_]+)"/g;

    let match;
    while ((match = selectPattern.exec(sql)) !== null) {
      if (match[1] && match[2]) {
        columnMap.set(`${match[1]}_${match[2]}`, match[2]);
      } else if (match[3] && match[4]) {
        columnMap.set(`${match[3]}_${match[4]}`, match[4]);
      }
    }

    return columnMap;
  }

  static updateOrderByReferences(sql: string, columnMap: Map<string, string>): string {
    let formatted = sql;
    for (const [oldRef, newRef] of columnMap.entries()) {
      const escapedOld = oldRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`ORDER BY\\s+"${escapedOld}"`, 'gi');
      formatted = formatted.replace(regex, `ORDER BY "${newRef}"`);
    }
    return formatted;
  }

  static collectAliases(ast: any): Map<string, AliasMapping> {
    return ASTUtilities.collectAliases(ast);
  }

  static updateRangeVarAliases(ast: any, aliasMap: Map<string, AliasMapping>): void {
    ASTUtilities.updateRangeVarAliases(ast, aliasMap);
  }

  static updateColumnReferences(ast: any, aliasMap: Map<string, AliasMapping>): void {
    ASTUtilities.updateColumnReferences(ast, aliasMap);
  }
}
