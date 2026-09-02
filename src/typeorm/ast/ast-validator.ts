import { Validation } from '../types';

export class AstValidator {
  static validateTableReferences(ast: any): Validation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const definedTables = new Set<string>();
    const referencedTables = new Set<string>();

    function collectTables(node: any) {
      if (!node || typeof node !== 'object') return;

      if (node.RangeVar && node.RangeVar.relname) {
        const tableName = node.RangeVar.relname;
        definedTables.add(tableName);
      }

      if (node.ColumnRef && node.ColumnRef.fields && Array.isArray(node.ColumnRef.fields)) {
        const fields = node.ColumnRef.fields;
        if (fields.length >= 1) {
          const tableRef = fields[0]?.String?.sval || fields[0]?.RangeVar?.relname;
          if (tableRef && tableRef !== '') {
            referencedTables.add(tableRef);
          }
        }
      }

      for (const key in node) {
        if (key === 'stmt' || key === 'stmts') {
          collectTables(node[key]);
        } else if (Array.isArray(node[key])) {
          for (const item of node[key]) {
            collectTables(item);
          }
        } else if (typeof node[key] === 'object') {
          collectTables(node[key]);
        }
      }
    }

    collectTables(ast);

    for (const ref of referencedTables) {
      if (!definedTables.has(ref)) {
        errors.push(`Table "${ref}" is referenced but not defined in FROM/JOIN clauses`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateColumnReferences(ast: any): Validation {
    const errors: string[] = [];
    const warnings: string[] = [];

    function validateColumns(node: any) {
      if (!node || typeof node !== 'object') return;

      if (node.ColumnRef && (!node.ColumnRef.fields || node.ColumnRef.fields.length === 0)) {
        errors.push('Empty column reference found');
      }

      for (const key in node) {
        if (key === 'stmt' || key === 'stmts') {
          validateColumns(node[key]);
        } else if (Array.isArray(node[key])) {
          for (const item of node[key]) {
            validateColumns(item);
          }
        } else if (typeof node[key] === 'object') {
          validateColumns(node[key]);
        }
      }
    }

    validateColumns(ast);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateJoinConditions(ast: any): Validation {
    const errors: string[] = [];
    const warnings: string[] = [];

    function validateJoins(node: any) {
      if (!node || typeof node !== 'object') return;

      if (node.JoinExpr) {
        const joinExpr = node.JoinExpr;

        if (joinExpr.jointype !== '0' && !joinExpr.quals && !joinExpr.natural) {
          warnings.push('JOIN found without ON or USING clause');
        }

        if (joinExpr.natural) {
          warnings.push('NATURAL JOIN found (can be ambiguous)');
        }
      }

      for (const key in node) {
        if (key === 'stmt' || key === 'stmts') {
          validateJoins(node[key]);
        } else if (Array.isArray(node[key])) {
          for (const item of node[key]) {
            validateJoins(item);
          }
        } else if (typeof node[key] === 'object') {
          validateJoins(node[key]);
        }
      }
    }

    validateJoins(ast);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateQueryStructure(ast: any): Validation {
    const errors: string[] = [];
    const warnings: string[] = [];

    let statementCount = 0;
    let hasSelect = false;
    let hasInsert = false;
    let hasUpdate = false;
    let hasDelete = false;

    function validateStructure(node: any) {
      if (!node || typeof node !== 'object') return;

      if (node.SelectStmt) {
        hasSelect = true;
        statementCount++;
      } else if (node.InsertStmt) {
        hasInsert = true;
        statementCount++;
      } else if (node.UpdateStmt) {
        hasUpdate = true;
        statementCount++;
      } else if (node.DeleteStmt) {
        hasDelete = true;
        statementCount++;
      }

      if (
        node.SelectStmt &&
        (!node.SelectStmt.targetList || node.SelectStmt.targetList.length === 0)
      ) {
        errors.push('SELECT statement has empty target list (no columns selected)');
      }

      if (node.InsertStmt && (!node.InsertStmt.cols || node.InsertStmt.cols.length === 0)) {
        warnings.push('INSERT statement without column list (will insert into all columns)');
      }

      for (const key in node) {
        if (key === 'stmt' || key === 'stmts') {
          validateStructure(node[key]);
        } else if (Array.isArray(node[key])) {
          for (const item of node[key]) {
            validateStructure(item);
          }
        } else if (typeof node[key] === 'object') {
          validateStructure(node[key]);
        }
      }
    }

    validateStructure(ast);

    const statementTypes = [hasSelect, hasInsert, hasUpdate, hasDelete].filter(Boolean).length;
    if (statementTypes > 1) {
      errors.push('Multiple statement types found (SELECT, INSERT, UPDATE, or DELETE mixed)');
    }

    if (statementCount === 0) {
      errors.push('No valid statement found (SELECT, INSERT, UPDATE, or DELETE)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateAST(ast: any): Validation {
    const tableRefValidation = this.validateTableReferences(ast);
    const columnRefValidation = this.validateColumnReferences(ast);
    const joinConditionValidation = this.validateJoinConditions(ast);
    const structureValidation = this.validateQueryStructure(ast);

    const allErrors = [
      ...tableRefValidation.errors,
      ...columnRefValidation.errors,
      ...joinConditionValidation.errors,
      ...structureValidation.errors,
    ];

    const allWarnings = [
      ...tableRefValidation.warnings,
      ...columnRefValidation.warnings,
      ...joinConditionValidation.warnings,
      ...structureValidation.warnings,
    ];

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }
}
