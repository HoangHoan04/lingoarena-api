export type MinutesRange = [number, number];

export function getMinutesOfDay(date: Date): number {
  const d = new Date(date);
  return d.getHours() * 60 + d.getMinutes();
}

export function splitMinutesRange(startMin: number, endMin: number): MinutesRange[] {
  if (endMin > startMin) return [[startMin, endMin]];
  if (endMin < startMin)
    return [
      [startMin, 24 * 60],
      [0, endMin],
    ];
  return [];
}

export function isTimeOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  const aSegments = splitMinutesRange(startA, endA);
  const bSegments = splitMinutesRange(startB, endB);
  for (const [aStart, aEnd] of aSegments) {
    for (const [bStart, bEnd] of bSegments) {
      if (aStart < bEnd && bStart < aEnd) return true;
    }
  }
  return false;
}

export function intersectSegments(
  aSegments: MinutesRange[],
  bSegments: MinutesRange[],
): MinutesRange[] {
  const result: MinutesRange[] = [];
  for (const [aStart, aEnd] of aSegments) {
    for (const [bStart, bEnd] of bSegments) {
      const start = Math.max(aStart, bStart);
      const end = Math.min(aEnd, bEnd);
      if (start < end) result.push([start, end]);
    }
  }
  return result;
}

export function mergeSegments(segments: MinutesRange[]): MinutesRange[] {
  if (!segments.length) return [];
  const sorted = [...segments].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: MinutesRange[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const [start, end] = sorted[i];
    const last = merged[merged.length - 1];
    if (start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

export function formatHHmmFromMinutes(totalMinutes: number): string {
  if (totalMinutes === 24 * 60) return '24:00';
  const minutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function formatMinutesRanges(ranges: MinutesRange[]): string {
  return ranges
    .map(([s, e]) => `${formatHHmmFromMinutes(s)} - ${formatHHmmFromMinutes(e)}`)
    .join(', ');
}

export const timeRangeHelper = {
  getMinutesOfDay,
  splitMinutesRange,
  isTimeOverlap,
  intersectSegments,
  mergeSegments,
  formatHHmmFromMinutes,
  formatMinutesRanges,
};
