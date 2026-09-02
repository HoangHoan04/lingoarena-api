import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

export class DateTransformHelper {
  static transformExcelDate(value: any): string {
    if (!value) return value;

    if (typeof value === 'string') {
      const parsed = dayjs(value, 'DD/MM/YYYY HH:mm', true);
      if (parsed.isValid()) {
        return parsed.toISOString();
      }
      return value;
    }

    if (typeof value === 'number' && /^\d+(\.\d+)?$/.test(value.toString())) {
      const adjustedValue = value > 59 ? value - 1 : value;

      const days = Math.floor(adjustedValue) - 1;
      const timeFraction = adjustedValue - Math.floor(adjustedValue);

      const excelEpoch = dayjs('1900-01-01');
      const date = excelEpoch.add(days, 'days');

      const totalMinutes = Math.round(timeFraction * 24 * 60);
      const finalDate = date.add(totalMinutes, 'minutes');

      if (finalDate.isValid()) {
        return finalDate.toISOString();
      }
    }

    return value;
  }

  static transformForClassTransformer({ value }: { value: string }): string {
    return DateTransformHelper.transformExcelDate(value);
  }
}
