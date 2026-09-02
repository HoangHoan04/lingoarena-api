import dayjs from 'dayjs';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

export const getPreviousPeriod = (from: Date, to: Date) => {
  const start = dayjs(from);
  const end = dayjs(to);
  const diffDays = end.diff(start, 'day') + 1;
  const previousTo = start.subtract(1, 'day');
  const previousFrom = previousTo.subtract(diffDays - 1, 'day');

  return {
    from: previousFrom.toDate(),
    to: previousTo.toDate(),
  };
};

export const getDateFilter = (query: any) => {
  const { from, to } = query;
  if (from && to) {
    return Between(from, to);
  }
  if (from) {
    return MoreThanOrEqual(from);
  }
  if (to) {
    return LessThanOrEqual(to);
  }
  return undefined;
};
