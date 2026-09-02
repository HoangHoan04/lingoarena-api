import { ValidationResult } from '../types';
import { ASTUtilities } from './sql-ast-utilities';

export class AstManager {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (!this.initialized) {
      await ASTUtilities.initialize();
      this.initialized = true;
    }
  }

  static async parse(sql: string): Promise<any> {
    try {
      return await ASTUtilities.parseSQL(sql);
    } catch (error: any) {
      throw new Error(`Failed to parse SQL: ${error.message}`);
    }
  }

  static parseSync(sql: string): any {
    if (!this.initialized) {
      throw new Error('WASM module not initialized. Call AstManager.initialize() first.');
    }
    try {
      return ASTUtilities.parseSQLSync(sql);
    } catch (error: any) {
      throw new Error(`Failed to parse SQL: ${error.message}`);
    }
  }

  static format(ast: any): string {
    try {
      return ASTUtilities.deparseAST(ast);
    } catch (error: any) {
      throw new Error(`Failed to format AST: ${error.message}`);
    }
  }

  static getNodeType(node: any): string | null {
    if (!node || typeof node !== 'object') {
      return null;
    }

    if (node.RangeVar) return 'RangeVar';
    if (node.ColumnRef) return 'ColumnRef';
    if (node.ResTarget) return 'ResTarget';
    if (node.A_Const) return 'A_Const';
    if (node.FuncCall) return 'FuncCall';
    if (node.BoolExpr) return 'BoolExpr';
    if (node.JoinExpr) return 'JoinExpr';
    if (node.SelectStmt) return 'SelectStmt';
    if (node.InsertStmt) return 'InsertStmt';
    if (node.UpdateStmt) return 'UpdateStmt';
    if (node.DeleteStmt) return 'DeleteStmt';

    for (const key of Object.keys(node)) {
      if (key.endsWith('Stmt') || key.endsWith('Expr') || key.endsWith('Ref')) {
        return key;
      }
    }

    return null;
  }

  static validate(ast: any): ValidationResult {
    try {
      const validation = ASTUtilities.validateAST(ast);
      return {
        valid: validation.valid,
        error: !validation.valid ? validation.errors.join(', ') : undefined,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }
}
