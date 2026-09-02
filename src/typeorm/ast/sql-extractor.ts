import { parse } from 'pgsql-parser';
import { ColumnInfo, JoinInfo, TableInfo } from '../types';

export class SqlExtractor {
  static async extractTables(sql: string): Promise<TableInfo[]> {
    try {
      const ast = await parse(sql);
      const tables: TableInfo[] = [];

      function extractTables(node: any) {
        if (!node || typeof node !== 'object') return;

        if (node.RangeVar && node.RangeVar.relname) {
          tables.push({
            name: node.RangeVar.relname,
            schema: node.RangeVar.schemaname,
            alias: node.RangeVar.alias?.aliasname,
          });
        }

        for (const key in node) {
          if (key === 'stmt' || key === 'stmts') {
            extractTables(node[key]);
          } else if (Array.isArray(node[key])) {
            for (const item of node[key]) {
              extractTables(item);
            }
          } else if (typeof node[key] === 'object') {
            extractTables(node[key]);
          }
        }
      }

      extractTables(ast);

      const uniqueTables = Array.from(
        new Map(tables.map(t => [t.name + '|' + (t.alias || ''), t])).values(),
      );

      return uniqueTables;
    } catch (error: any) {
      console.warn('[SqlExtractor] Failed to extract tables:', error.message);
      return [];
    }
  }

  static async extractColumns(sql: string): Promise<ColumnInfo[]> {
    try {
      const ast = await parse(sql);
      const columns: ColumnInfo[] = [];

      function extractColumns(node: any) {
        if (!node || typeof node !== 'object') return;

        if (node.ColumnRef && node.ColumnRef.fields && Array.isArray(node.ColumnRef.fields)) {
          const fields = node.ColumnRef.fields;
          if (fields.length === 2) {
            const tableField = fields[0];
            const columnField = fields[1];

            const table = tableField?.String?.sval || tableField?.RangeVar?.relname;
            const column = columnField?.String?.sval;

            if (table && column) {
              columns.push({ table, column });
            }
          } else if (fields.length === 1) {
            const column = fields[0]?.String?.sval;
            if (column) {
              columns.push({ table: '', column });
            }
          }
        }

        for (const key in node) {
          if (key === 'stmt' || key === 'stmts') {
            extractColumns(node[key]);
          } else if (Array.isArray(node[key])) {
            for (const item of node[key]) {
              extractColumns(item);
            }
          } else if (typeof node[key] === 'object') {
            extractColumns(node[key]);
          }
        }
      }

      extractColumns(ast);

      const uniqueColumns = Array.from(
        new Map(columns.map(c => [c.table + '.' + c.column, c])).values(),
      );

      return uniqueColumns;
    } catch (error: any) {
      console.warn('[SqlExtractor] Failed to extract columns:', error.message);
      return [];
    }
  }

  static async extractJoins(sql: string): Promise<JoinInfo[]> {
    try {
      const ast = await parse(sql);
      const joins: JoinInfo[] = [];

      function extractJoins(node: any) {
        if (!node || typeof node !== 'object') return;

        if (node.JoinExpr) {
          const joinExpr = node.JoinExpr;

          if (joinExpr.larg && joinExpr.rarg) {
            const joinType: JoinInfo['type'] = joinExpr.jointype
              ? (joinExpr.jointype.toUpperCase().replace('_', ' ') as JoinInfo['type'])
              : 'INNER';

            const rightTable = joinExpr.rarg.RangeVar;
            if (rightTable?.relname) {
              joins.push({
                type: joinType,
                table: rightTable.relname,
                alias: rightTable.alias?.aliasname || rightTable.relname,
                condition: joinExpr.quals ? 'condition present' : undefined,
              });
            }
          }
        }

        for (const key in node) {
          if (key === 'stmt' || key === 'stmts') {
            extractJoins(node[key]);
          } else if (Array.isArray(node[key])) {
            for (const item of node[key]) {
              extractJoins(item);
            }
          } else if (typeof node[key] === 'object') {
            extractJoins(node[key]);
          }
        }
      }

      extractJoins(ast);
      return joins;
    } catch (error: any) {
      console.warn('[SqlExtractor] Failed to extract joins:', error.message);
      return [];
    }
  }

  static extractWhereClauses(sql: string): string[] {
    const whereClauses: string[] = [];

    const wherePattern =
      /WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|\s+OFFSET|\s+;|$)/gis;
    let match;
    while ((match = wherePattern.exec(sql)) !== null) {
      whereClauses.push(match[1].trim());
    }

    return whereClauses;
  }

  static extractOrderBy(sql: string): string[] {
    const orderByClauses: string[] = [];

    const orderByPattern = /ORDER\s+BY\s+(.+?)(?:\s+LIMIT|\s+OFFSET|\s+;|$)/gis;
    let match;
    while ((match = orderByPattern.exec(sql)) !== null) {
      orderByClauses.push(match[1].trim());
    }

    return orderByClauses;
  }

  static extractGroupBy(sql: string): string[] {
    const groupByClauses: string[] = [];

    const groupByPattern =
      /GROUP\s+BY\s+(.+?)(?:\s+HAVING|\s+ORDER\s+BY|\s+LIMIT|\s+OFFSET|\s+;|$)/gis;
    let match;
    while ((match = groupByPattern.exec(sql)) !== null) {
      groupByClauses.push(match[1].trim());
    }

    return groupByClauses;
  }
}
