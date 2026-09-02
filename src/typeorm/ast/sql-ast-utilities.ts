import { walk } from '@pgsql/traverse';
import { deparseSync } from 'pgsql-deparser';
import { loadModule, parseSync } from 'pgsql-parser';
import { AliasMapping } from '../sql-ast-types';

let wasmInitialized = false;
let initPromise: Promise<void> | null = null;

function ensureWasmInitialized(): Promise<void> {
  if (wasmInitialized) {
    return Promise.resolve();
  }
  if (initPromise) {
    return initPromise;
  }
  initPromise = loadModule().then(() => {
    wasmInitialized = true;
  });
  return initPromise;
}

export class ASTUtilities {
  static async initialize(): Promise<void> {
    await ensureWasmInitialized();
  }

  static async parseSQL(sql: string): Promise<any> {
    try {
      await ensureWasmInitialized();
      return parseSync(sql);
    } catch (error: any) {
      throw new Error(`Failed to parse SQL: ${error.message}`);
    }
  }

  static parseSQLSync(sql: string): any {
    if (!wasmInitialized) {
      throw new Error('WASM module not initialized. Call ASTUtilities.initialize() first.');
    }
    try {
      return parseSync(sql);
    } catch (error: any) {
      throw new Error(`Failed to parse SQL: ${error.message}`);
    }
  }

  static deparseAST(ast: any): string {
    try {
      return deparseSync(ast);
    } catch (error: any) {
      throw new Error(`Failed to deparse AST: ${error.message}`);
    }
  }

  static collectAliases(ast: any): Map<string, AliasMapping> {
    const aliasMap = new Map<string, AliasMapping>();
    let aliasIndex = 0;
    const shortAliasChars = 'tuvwxyzabcdefghijlmnopqrswk';

    walk(ast, {
      RangeVar(path: any) {
        const node = path.node;
        if (node.relname && node.alias?.aliasname) {
          const originalAlias = node.alias.aliasname;

          if (/^[a-z]{1,2}\d*$/i.test(originalAlias)) {
            return;
          }

          const shortAlias = shortAliasChars[aliasIndex % shortAliasChars.length];
          const needsQuotes = /^\d/.test(originalAlias);
          aliasMap.set(originalAlias, {
            original: originalAlias,
            simplified: shortAlias,
            tableName: node.relname,
            needsQuotes,
            scope: 'query',
          });
          aliasIndex++;
        }
      },
    });

    return aliasMap;
  }

  static updateRangeVarAliases(ast: any, aliasMap: Map<string, AliasMapping>): void {
    walk(ast, {
      RangeVar(path: any) {
        const node = path.node;
        if (node.alias?.aliasname) {
          const originalAlias = node.alias.aliasname;
          const mapping = aliasMap.get(originalAlias);

          if (mapping) {
            node.alias.aliasname = mapping.simplified;
          }
        }
      },
    });
  }

  static updateColumnReferences(ast: any, aliasMap: Map<string, AliasMapping>): void {
    walk(ast, {
      ColumnRef(path: any) {
        const node = path.node;
        if (node.fields && node.fields.length >= 2) {
          const tableField = node.fields[0];

          if (tableField?.String?.sval) {
            const originalAlias = tableField.String.sval;
            const mapping = aliasMap.get(originalAlias);

            if (mapping) {
              tableField.String.sval = mapping.simplified;
            }
          }
        }
      },
    });
  }

  static validateAST(ast: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const sql = this.deparseAST(ast);
      if (wasmInitialized) {
        parseSync(sql);
      }

      return { valid: true, errors: [] };
    } catch (error: any) {
      errors.push(error.message);
      return { valid: false, errors };
    }
  }
}
