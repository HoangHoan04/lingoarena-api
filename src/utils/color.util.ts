export const hex2rgb = (hex: string): { r: number; g: number; b: number } => {
  const cleanHex = hex.replace('#', '');
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    console.warn(`Invalid hex color: ${hex}, using white as fallback`);
    return { r: 255, g: 255, b: 255 };
  }
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex
      .split('')
      .map(char => char + char)
      .join('');
  }
  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);

  return { r, g, b };
};

export const rgb2hex = (r: number, g: number, b: number): string => {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  const toHex = (value: number) => {
    const hex = clamp(value).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const mixColors = (color1: string, color2: string, ratio: number = 0.5): string => {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const c1 = hex2rgb(color1);
  const c2 = hex2rgb(color2);
  const mixed = {
    r: c1.r * clampedRatio + c2.r * (1 - clampedRatio),
    g: c1.g * clampedRatio + c2.g * (1 - clampedRatio),
    b: c1.b * clampedRatio + c2.b * (1 - clampedRatio),
  };
  return rgb2hex(mixed.r, mixed.g, mixed.b);
};
