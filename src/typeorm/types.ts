export interface AliasMapping {
  original: string;
  simplified: string;
  tableName: string;
  needsQuotes: boolean;
  scope: 'query' | 'subquery';
}

export interface AliasSimplificationResult {
  success: boolean;
  sql: string;
  aliasesSimplified: number;
  errors: string[];
}

export interface ASTNode {
  RangeVar?: {
    relname?: string;
    alias?: { Alias?: { aliasname?: string; colnames?: any[] } };
  };
  ColumnRef?: {
    fields: any[];
  };
  [key: string]: any;
}

export type QueryOp = 'READ' | 'WRITE' | 'OTHER';

export interface QueryEntry {
  sql: string;
  params?: any[];
  op: QueryOp;
  table?: string;
  durationMs?: number;
  error?: string;
  txn?: boolean;
}

export interface QueryLogStack {
  requestId: string;
  queries: QueryEntry[];
}

export interface FormatOptions {
  colorize?: boolean;
  uppercaseKeywords?: boolean;
  uppercaseFunctions?: boolean;
  indentSize?: number;
  useTabs?: boolean;
  preservePlaceholders?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface TableInfo {
  name: string;
  schema?: string;
  alias?: string;
}

export interface ColumnInfo {
  table: string;
  column: string;
  alias?: string;
}

export interface JoinInfo {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';
  table: string;
  alias: string;
  condition?: string;
}

export interface Validation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
