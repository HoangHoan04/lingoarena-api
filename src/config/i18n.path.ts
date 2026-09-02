import { existsSync } from 'fs';
import { join } from 'path';

/**
 * nest start --watch + deleteOutDir xóa dist mỗi lần compile.
 * nestjs-i18n không được watch dist, nếu không sẽ ENOENT.
 */
export function resolveI18nLocalesPath(): string {
  const srcPath = join(process.cwd(), 'src', 'assets', 'locales');
  const distFromCwd = join(process.cwd(), 'dist', 'assets', 'locales');
  const distBesideConfig = join(__dirname, '..', 'assets', 'locales');

  if (existsSync(srcPath)) return srcPath;
  if (existsSync(distFromCwd)) return distFromCwd;
  if (existsSync(distBesideConfig)) return distBesideConfig;
  return srcPath;
}

export function shouldWatchI18nFiles(): boolean {
  const localesPath = resolveI18nLocalesPath();
  const isSrcTree = localesPath.includes(`${join('src', 'assets', 'locales')}`);
  return process.env.NODE_ENV !== 'production' && isSrcTree && existsSync(localesPath);
}
