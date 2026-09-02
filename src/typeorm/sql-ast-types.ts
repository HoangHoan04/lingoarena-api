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
    alias?: { Alias: { aliasname?: string; colnames?: any[] } };
  };
  ColumnRef?: {
    fields: any[];
  };
  [key: string]: any;
}
