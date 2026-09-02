import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

const getDayOfWeek = (day: number, locale: string = 'vi') => {
  const days = {
    vi: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  };
  return days[locale][day];
};

const getMonthOfYear = (month: number, locale: string = 'vi') => {
  const months = {
    vi: [
      'Tháng 1',
      'Tháng 2',
      'Tháng 3',
      'Tháng 4',
      'Tháng 5',
      'Tháng 6',
      'Tháng 7',
      'Tháng 8',
      'Tháng 9',
      'Tháng 10',
      'Tháng 11',
      'Tháng 12',
    ],
    en: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  };
  return months[locale][month];
};

export const dateHelper = {
  getDayOfWeek,
  getMonthOfYear,
};

export function formatTime(time: Date | string, formatString: string = 'HH:mm'): string {
  let hours: string, minutes: string, seconds: string;

  if (typeof time === 'string') {
    const parts = time.split('T').pop()?.split(':') || [];
    hours = (parts[0] ?? '0').padStart(2, '0');
    minutes = (parts[1] ?? '0').padStart(2, '0');
    seconds = (parts[2] ?? '0').padStart(2, '0');
  } else {
    hours = String(time.getHours()).padStart(2, '0');
    minutes = String(time.getMinutes()).padStart(2, '0');
    seconds = String(time.getSeconds()).padStart(2, '0');
  }

  return formatString.replace('HH', hours).replace('mm', minutes).replace('ss', seconds);
}

dayjs.extend(utc);
dayjs.extend(timezone);

export const formatTimeOnly = (date: string | Date) =>
  dayjs(date).tz('Asia/Ho_Chi_Minh').format('HH:mm');

export const parseFlexibleDate = (dateInput: string | number | Date): Date | null => {
  if (!dateInput) {
    return null;
  }

  if (dateInput instanceof Date) {
    return dateInput;
  }

  if (typeof dateInput === 'number') {
    let daysToAdd = dateInput - 1;

    if (dateInput >= 60) {
      daysToAdd = dateInput - 2;
    }

    const excelEpoch = new Date(1900, 0, 1);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const resultDate = new Date(excelEpoch.getTime() + daysToAdd * millisecondsPerDay);

    if (resultDate.getFullYear() >= 1900 && resultDate.getFullYear() <= 2100) {
      return resultDate;
    }
    return null;
  }

  if (typeof dateInput !== 'string') {
    return null;
  }

  const trimmed = dateInput.trim();

  const serialNumber = parseFloat(trimmed);
  if (!isNaN(serialNumber) && /^\d+(\.\d+)?$/.test(trimmed)) {
    let daysToAdd = serialNumber - 1;

    if (serialNumber >= 60) {
      daysToAdd = serialNumber - 2;
    }

    const excelEpoch = new Date(1900, 0, 1);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const resultDate = new Date(excelEpoch.getTime() + daysToAdd * millisecondsPerDay);

    if (resultDate.getFullYear() >= 1900 && resultDate.getFullYear() <= 2100) {
      return resultDate;
    }
    return null;
  }

  const separator = trimmed.includes('/') ? '/' : trimmed.includes('-') ? '-' : null;
  if (!separator) {
    return null;
  }

  const parts = trimmed.split(separator);
  if (parts.length !== 3) {
    return null;
  }

  const [first, second, third] = parts.map(part => parseInt(part, 10));

  if (isNaN(first) || isNaN(second) || isNaN(third)) {
    return null;
  }

  let day: number, month: number, year: number;

  if (first > 31) {
    year = first;
    month = second;
    day = third;
  } else if (third > 31) {
    year = third;

    if (first > 12) {
      day = first;
      month = second;
    } else if (second > 12) {
      day = second;
      month = first;
    } else {
      day = first;
      month = second;
    }
  } else {
    return null;
  }

  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return null;
  }

  const dateObj = dayjs(
    `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
  );

  if (!dateObj.isValid()) {
    return null;
  }

  return dateObj.toDate();
};

export const VN_OFFSET = '+07:00';
export const DAY_START = '06:00:00';
export const DAY_END = '23:00:00';

export function vnDayStart(date: string): Date {
  return new Date(`${date}T00:00:00.000${VN_OFFSET}`);
}

export function vnDayEnd(date: string): Date {
  const start = vnDayStart(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export function toVnIso(
  date: string,
  time?: string | Date,
  fallbackTime: string = DAY_START,
): string {
  let raw: string;
  if (time instanceof Date) {
    raw = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`;
  } else {
    raw = String(time || fallbackTime);
  }
  const hhmmss = raw.length >= 8 ? raw.slice(0, 8) : `${raw.slice(0, 5)}:00`;
  return new Date(`${date}T${hhmmss}${VN_OFFSET}`).toISOString();
}

