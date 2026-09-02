import { ASTUtilities } from './ast/sql-ast-utilities';
import { AliasSimplificationResult } from './sql-ast-types';

export class ASTAliasSimplifier {
  static async simplifyAliases(sql: string): Promise<AliasSimplificationResult> {
    const errors: string[] = [];

    try {
      const ast = await ASTUtilities.parseSQL(sql);
      const aliasMap = ASTUtilities.collectAliases(ast);

      if (aliasMap.size === 0) {
        return {
          success: true,
          sql,
          aliasesSimplified: 0,
          errors: [],
        };
      }

      ASTUtilities.updateRangeVarAliases(ast, aliasMap);
      ASTUtilities.updateColumnReferences(ast, aliasMap);

      const validation = ASTUtilities.validateAST(ast);
      if (!validation.valid) {
        errors.push(...validation.errors);
        return {
          success: false,
          sql,
          aliasesSimplified: 0,
          errors,
        };
      }

      const simplifiedSQL = ASTUtilities.deparseAST(ast);
      return {
        success: true,
        sql: simplifiedSQL,
        aliasesSimplified: aliasMap.size,
        errors: [],
      };
    } catch (error: any) {
      errors.push(error.message);
      return {
        success: false,
        sql,
        aliasesSimplified: 0,
        errors,
      };
    }
  }

  static simplifyAliasesSync(sql: string): AliasSimplificationResult {
    const errors: string[] = [];

    try {
      const ast = ASTUtilities.parseSQLSync(sql);
      const aliasMap = ASTUtilities.collectAliases(ast);

      if (aliasMap.size === 0) {
        return {
          success: true,
          sql: sql,
          aliasesSimplified: 0,
          errors: [],
        };
      }

      ASTUtilities.updateRangeVarAliases(ast, aliasMap);
      ASTUtilities.updateColumnReferences(ast, aliasMap);

      const validation = ASTUtilities.validateAST(ast);
      if (!validation.valid) {
        errors.push(...validation.errors);
        return {
          success: false,
          sql,
          aliasesSimplified: 0,
          errors,
        };
      }

      const simplifiedSQL = ASTUtilities.deparseAST(ast);
      return {
        success: true,
        sql: simplifiedSQL,
        aliasesSimplified: aliasMap.size,
        errors: [],
      };
    } catch (error: any) {
      errors.push(error.message);
      return {
        success: false,
        sql,
        aliasesSimplified: 0,
        errors,
      };
    }
  }

  static async simplifyWithFallback(sql: string): Promise<string> {
    const result = await this.simplifyAliases(sql);

    if (result.success) {
      return result.sql;
    }

    console.warn('[ASTAliasSimplifier] AST approach failed, using minimal fallback');
    console.warn('[ASTAliasSimplifier] Errors:', result.errors);

    return sql;
  }
}
