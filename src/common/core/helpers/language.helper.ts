export class LanguageHelper {
  static isVi(lang?: string): boolean {
    return (lang || '').toLowerCase() === 'vi';
  }

  static isEn(lang?: string): boolean {
    return (lang || '').toLowerCase() === 'en';
  }
}
