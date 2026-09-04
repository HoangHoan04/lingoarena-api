/**
 * Import Excel dùng chung toàn hệ thống.
 *
 * API: nhận mảng items, trả results[] theo rowIndex.
 * Một dòng lỗi không làm fail cả lô.
 *
 * Admin: ExcelImportModal `onProcessBatch` + `runChunkedImport` (mặc định 200 dòng/request).
 * Resource mới: POST /admin/<feature>/import { items, ... }
 */
export const BULK_IMPORT_MAX_ITEMS = 500;
export const BULK_IMPORT_CHUNK_SIZE = 200;

export type BulkImportRowResult = {
  rowIndex: number;
  success: boolean;
  message: string;
  id?: string;
};

export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  const step = Math.max(1, size);
  for (let i = 0; i < items.length; i += step) {
    chunks.push(items.slice(i, i + step));
  }
  return chunks;
}

export function okImportRow(
  rowIndex: number,
  message = 'Thành công',
  id?: string,
): BulkImportRowResult {
  return { rowIndex, success: true, message, id };
}

export function failImportRow(rowIndex: number, message: string): BulkImportRowResult {
  return { rowIndex, success: false, message };
}

export function sortImportResults(results: BulkImportRowResult[]): BulkImportRowResult[] {
  return [...results].sort((a, b) => a.rowIndex - b.rowIndex);
}

export function summarizeImport(results: BulkImportRowResult[]) {
  const sorted = sortImportResults(results);
  return {
    total: sorted.length,
    success: sorted.filter(item => item.success).length,
    failed: sorted.filter(item => !item.success).length,
    results: sorted,
  };
}

export function importErrorMessage(err: unknown): string {
  if (!err) return 'Lỗi không xác định';
  if (typeof err === 'object') {
    const anyErr = err as {
      getResponse?: () => unknown;
      message?: string;
      response?: { message?: string | string[] };
    };
    if (typeof anyErr.getResponse === 'function') {
      const res = anyErr.getResponse();
      if (typeof res === 'string' && res.trim()) return res;
      if (res && typeof res === 'object') {
        const msg = (res as { message?: string | string[] }).message;
        if (Array.isArray(msg)) return msg.filter(Boolean).join(', ');
        if (typeof msg === 'string' && msg.trim()) return msg;
      }
    }
    const nested = anyErr.response?.message;
    if (Array.isArray(nested)) return nested.filter(Boolean).join(', ');
    if (typeof nested === 'string' && nested.trim()) return nested;
    if (typeof anyErr.message === 'string' && anyErr.message.trim()) return anyErr.message;
  }
  return String(err);
}

export function createdEntityId(res: unknown): string | undefined {
  if (!res || typeof res !== 'object') return undefined;
  const obj = res as { id?: string; data?: { id?: string } };
  return obj.data?.id || obj.id;
}

export function requireText(value: unknown, label: string): string {
  const text = String(value ?? '').trim();
  if (!text || text === '(Bắt buộc)') {
    throw new Error(`Thiếu ${label}`);
  }
  return text;
}

export function optionalText(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  if (!text || text === '(Bắt buộc)') return undefined;
  return text;
}

export function optionalNumber(value: unknown, fallback?: number): number | undefined {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) throw new Error('Giá trị số không hợp lệ');
  return num;
}

export function splitCodes(value: unknown): string[] {
  return String(value ?? '')
    .split(/[,;|]/)
    .map(item => item.trim())
    .filter(item => item && item !== '(Bắt buộc)');
}

export function parseJsonValue<T = Record<string, unknown>>(value: unknown, fallback?: T): T | undefined {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value as T;
  const text = String(value).trim();
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('JSON không hợp lệ');
  }
}

export function excelExportTake(take?: number) {
  const size = Number(take || 5000);
  if (!Number.isFinite(size) || size <= 0) return 5000;
  return Math.min(size, 5000);
}

export function slugifyText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function runBulkImport<T extends { rowIndex?: number }>(
  items: T[] | undefined,
  process: (item: T, rowIndex: number) => Promise<{ id?: string; message?: string } | undefined>,
) {
  const rows = items || [];
  const results: BulkImportRowResult[] = [];
  for (let i = 0; i < rows.length; i++) {
    const item = rows[i];
    const rowIndex = Number(item?.rowIndex || i + 1);
    try {
      const res = await process(item, rowIndex);
      results.push(okImportRow(rowIndex, res?.message || 'Thành công', res?.id));
    } catch (err) {
      results.push(failImportRow(rowIndex, importErrorMessage(err)));
    }
  }
  return summarizeImport(results);
}
