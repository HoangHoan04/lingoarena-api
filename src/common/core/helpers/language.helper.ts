export class LanguageHelper {
  static isVi(lang?: string): boolean {
    return (lang || '').toLowerCase() === 'vi';
  }

  static isEn(lang?: string): boolean {
    return (lang || '').toLowerCase() === 'en';
  }

  static pick(lang: string | undefined, vi?: string | null, en?: string | null): string {
    const fallback = vi || '';
    if (this.isEn(lang)) return (en || fallback).toString();
    return fallback.toString();
  }
}
