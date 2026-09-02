import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';

export const formatName = (name: string): string => {
  if (!name) return '';

  const trimmedName = name.trim().replace(/\s+/g, ' ');

  const formattedName = trimmedName
    .split(' ')
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  return formattedName;
};

export function getWeekdayLabel(date: Date, locale: 'vi' | 'en' = 'vi'): string {
  if (!date) return '';

  if (locale === 'en') {
    return dayjs(date).locale('en').format('dddd');
  }

  const day = date.getDay();
  if (day === 0) {
    return 'Chủ Nhật';
  }

  return `Thứ ${day + 1}`;
}
