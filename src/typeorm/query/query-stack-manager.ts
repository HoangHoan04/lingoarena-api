import { RequestContext } from '~/common/core/context';
import { QueryEntry, QueryLogStack } from '../types';

export class QueryStackManager {
  static push(
    query: string,
    parameters?: any[],
    modifier?: (entry: QueryEntry) => void,
    queryRunner?: any,
  ): boolean {
    const stack = RequestContext.getAttribute<QueryLogStack[]>('queryLog.stack');
    const active = Array.isArray(stack) && stack.length ? stack[stack.length - 1] : undefined;

    if (!active) {
      console.warn('[QueryStackManager] Unable to push to stack - no active context available');
      return false;
    }

    const { QueryClassifier } = require('./query-classifier');
    const { op, table } = QueryClassifier.classify(query);
    const entry: QueryEntry = { sql: query, params: parameters, op, table };

    if (queryRunner && (queryRunner as any).isTransactionActive) {
      entry.txn = true;
    }

    if (modifier) {
      modifier(entry);
    }

    active.queries.push(entry);
    RequestContext.setAttribute('queryLog.stack', stack);
    return true;
  }

  static pop(): void {
    const stack = RequestContext.getAttribute<QueryLogStack[]>('queryLog.stack');
    if (Array.isArray(stack)) {
      stack.pop();
      RequestContext.setAttribute('queryLog.stack', stack);
    }
  }

  static getActiveStack(): QueryLogStack | undefined {
    const stack = RequestContext.getAttribute<QueryLogStack[]>('queryLog.stack');
    if (Array.isArray(stack) && stack.length) {
      return stack[stack.length - 1];
    }
    return undefined;
  }

  static getAllStacks(): QueryLogStack[] {
    const stack = RequestContext.getAttribute<QueryLogStack[]>('queryLog.stack');
    return Array.isArray(stack) ? stack : [];
  }

  static clear(): void {
    RequestContext.setAttribute('queryLog.stack', []);
  }

  static createStack(requestId: string): QueryLogStack {
    const newStack: QueryLogStack = {
      requestId,
      queries: [],
    };

    let existingStacks = RequestContext.getAttribute<QueryLogStack[]>('queryLog.stack');
    if (!Array.isArray(existingStacks)) {
      existingStacks = [];
    }

    existingStacks.push(newStack);
    RequestContext.setAttribute('queryLog.stack', existingStacks);

    return newStack;
  }
}
