import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { customAlphabet } from 'nanoid';
import * as QRCode from 'qrcode';
import { Raw } from 'typeorm';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

class CoreHelper {
  parseDateVN(dateStr: string) {
    if (dateStr.length !== 10) return;
    const [day, month, year] = dateStr.split('/');
    return new Date(+year, +month - 1, +day);
  }

  findDuplicates(arr: any[], key: string): string[] {
    const seen: { [key: string]: boolean } = {};
    const duplicates: string[] = [];
    let array = [];
    array = arr;
    for (const prop of array) {
      if (seen[prop[key]]) {
        if (!duplicates.includes(prop[key])) {
          duplicates.push(prop[key]);
        }
      } else {
        seen[prop[key]] = true;
      }
    }
    return duplicates;
  }

  genCodeDefault(data: string) {
    const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890', 5);
    const genCode = `${data}${dayjs().format('YYMMDD')}${nanoid()}`;
    return genCode;
  }

  public convertObjToArray(obj: any) {
    const arr = [];
    for (const key in obj) {
      const value = obj[key];
      arr.push(value);
    }
    return arr;
  }

  normalizePhoneNumber(phone: string): string {
    if (phone.startsWith('0')) {
      return '84' + phone.slice(1);
    }
    if (phone.startsWith('84')) {
      return phone;
    }
    if (phone.startsWith('+84')) {
      return phone;
    }
    return '84' + phone;
  }

  normalizePhoneNumberPrefix0(phone: string): string {
    if (phone.startsWith('+84')) {
      return '0' + phone.slice(3);
    } else {
      return phone;
    }
  }

  parseDuprPoint = (value?: string): number => {
    return value === 'NR' ? 0 : parseFloat(value || '0');
  };

  formatNumber(number: number): string {
    return number < 10 ? `0${number}` : `${number}`;
  }

  public newDateTZ() {
    return dayjs().tz('Asia/Ho_Chi_Minh').toDate();
  }

  convertUTC7ToUTC(date: Date): Date {
    const UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
    return new Date(date.getTime() - UTC_OFFSET_MS);
  }

  getEnumMultiLevelToArray(enumData: object) {
    const enumObj: Record<string, any> = {};

    for (const key in enumData) {
      if (Object.prototype.hasOwnProperty.call(enumData, key)) {
        const element = (enumData as any)[key];
        const children = element.children;

        for (const enumItem of children) {
          const objectKey = enumItem.code;
          const objectValue = enumItem;
          enumObj[objectKey] = objectValue;
        }
      }
    }

    return enumObj;
  }

  convertResModulePermissionToArray(listPermissionJSONRes: any) {
    const result = listPermissionJSONRes.map((item: any) => item[0]);
    return result;
  }

  selectDistinct(arr: any[], field: string) {
    if (!arr?.length) return [];
    const set = new Set<string>();
    for (const item of arr) if (item[field]) set.add(item[field]);
    return [...set];
  }

  getFilterBetweenDateArrange(whereCon: any, field: string, dates?: Date[]) {
    if (dates && dates.length > 0) {
      const dsStr = dayjs(dates[0]).startOf('day').format('YYYY-MM-DD HH:mm:ss');
      const deStr = dayjs(dates[1]).endOf('day').format('YYYY-MM-DD HH:mm:ss');

      whereCon[field] = Raw(alias => `(${alias}) BETWEEN ("${dsStr}") AND ("${deStr}")`);
    }
  }

  getFirstDay(date: Date): Date {
    return dayjs(date).startOf('day').toDate();
  }

  getLastDay(date: Date): Date {
    return dayjs(date).endOf('day').toDate();
  }

  getLastDayOfMonth(date: Date) {
    return dayjs(date).endOf('month').toDate();
  }

  groupBy<T>(items: T[], keyGetter: (item: T) => string): Record<string, T> {
    return items.reduce(
      (acc, item) => {
        const key = keyGetter(item);
        acc[key] = item;
        return acc;
      },
      {} as Record<string, T>,
    );
  }

  async genQRCodeBase64(data: any): Promise<string> {
    try {
      const base64 = await QRCode.toDataURL(JSON.stringify(data), {
        errorCorrectionLevel: 'L',
        type: 'image/png',
        margin: 2,
        scale: 2,
        width: 150,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return base64;
    } catch (err) {
      console.error('QR Code generation error:', err);
      throw new Error('QR Code generation failed');
    }
  }

  filterUndefinedOrNull(obj: any): any {
    if (obj === null || obj === undefined) {
      return undefined;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.filterUndefinedOrNull(item)).filter(item => item !== undefined);
    }

    if (typeof obj !== 'object' || obj instanceof Date) {
      return obj;
    }

    const filteredObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = this.filterUndefinedOrNull(obj[key]);
        if (value !== undefined) {
          filteredObj[key] = value;
        }
      }
    }

    return filteredObj;
  }

  toDict(arr: any[], key = 'id') {
    const dict: Record<string, any> = {};
    for (const item of arr) {
      dict[item[key]] = item;
    }
    return dict;
  }

  getPrevDay(date: Date): Date {
    return dayjs(date).subtract(1, 'day').startOf('day').toDate();
  }

  convertToTreeNodes() {}

  formatMoneyVND(money: string | number) {
    if (!!money || money === 0) {
      if (money && money.toString().length > 0) {
        const moneyNumber = typeof money === 'string' ? parseFloat(money) : money;
        return Math.round(moneyNumber).toLocaleString('vi-VN') + ' VNĐ';
      } else {
        return money + ' VNĐ';
      }
    } else {
      return '0 VNĐ';
    }
  }

  toOrderTuple(val: string | number | null | undefined): number[] {
    if (val == null) return [Number.MAX_SAFE_INTEGER];
    const parts = String(val)
      .split('_')
      .map(x => parseInt(x, 10))
      .filter(n => !Number.isNaN(n));
    if (!parts.length) return [Number.MAX_SAFE_INTEGER];
    parts.sort((a, b) => a - b);
    return parts;
  }

  mergeDateAndTime(date: Date, time: Date): Date {
    const result = new Date(date);
    result.setHours(time.getHours(), time.getMinutes(), 0, 0);
    const dayjsResult = dayjs(result).tz('Asia/Ho_Chi_Minh');
    return new Date(dayjsResult.format('YYYY-MM-DD HH:mm:ss'));
  }

  formatVietNameseDateTime(date: Date): string {
    return dayjs(date).locale('vi').format('DD/MM/YYYY HH:mm');
  }

  decodeXOR(value: string) {
    let result = '';
    for (let i = value.length - 1; i >= 0; i--) {
      result += String.fromCharCode(value.charCodeAt(i) + 1);
    }
    return result;
  }

  numDayFrom1970(date: Date): number {
    if (!date) return 0;
    return dayjs(date).diff(dayjs('1970-01-01'), 'day');
  }

  resetSecond(date: Date | string | null | undefined): Date | null {
    if (!date) return null;
    return dayjs(date).second(0).millisecond(0).toDate();
  }

  diffMinutes(date1: Date, date2: Date) {
    return Math.abs(dayjs(date2).diff(dayjs(date1), 'minute'));
  }

  getTimeFromBeginDate() {
    const fd = this.getFirstDay(new Date());
    return new Date().getTime() - fd.getTime();
  }

  getDayLabel(day: number): string {
    const map: Record<number, string> = {
      1: 'Thứ 2',
      2: 'Thứ 3',
      3: 'Thứ 4',
      4: 'Thứ 5',
      5: 'Thứ 6',
      6: 'Thứ 7',
      7: 'Chủ nhật',
    };
    return map[+day || 0] ?? `Thứ ${day}`;
  }

  isMobileScreen(width?: string, height?: string): boolean {
    const w = width ? parseInt(width, 10) : null;
    const h = height ? parseInt(height, 10) : null;
    if (!w || !h || isNaN(w) || isNaN(h)) return false;
    return w < 768 || (h < 768 && w < 1024);
  }
}

export const coreHelper = new CoreHelper();
