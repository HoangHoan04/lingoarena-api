import { Raw } from 'typeorm';

export const UnaccentILike = (value: string) => {
  let normalizedValue = value.replace(/[Đ]/g, 'D').replace(/[đ]/g, 'd');
  normalizedValue = normalizedValue.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  normalizedValue = normalizedValue.replace(/\s+/g, '%');

  return Raw(
    alias =>
      `lower(translate(
      ${alias},
      'áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ',
      'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD'
    )) ILIKE :value`,
    { value: normalizedValue },
  );
};

function pgLiteral(value: string): string {
  return "'" + value.replace(/'/g, "''") + "'";
}

type JsonPath = string | JsonNav<any>;

export const jsonbIsNull = (path: JsonPath): string => `${path} IS NULL`;

export const jsonbIsEmpty = (path: JsonPath): string =>
  `(${path} IS NULL OR ${path} = '[]'::jsonb OR ${path} = 'null'::jsonb)`;

export const jsonbContains = (path: JsonPath, value: string): string =>
  `${path} @> ${pgLiteral(value)}::jsonb`;

export const jsonbNotContains = (path: JsonPath, value: string): string =>
  `NOT (${path} @> ${pgLiteral(value)}::jsonb)`;

export const jsonbEquals = (path: JsonPath, value: string): string =>
  `${path} = ${pgLiteral(value)}::jsonb`;

export class JsonNav<T = any> {
  constructor(private readonly _sql: string) {}

  nav<K extends keyof T & string>(key: K): JsonNav<T[K]> {
    return new JsonNav(`${this._sql}->'${key}'`);
  }

  navUnsafe(key: string): JsonNav<any> {
    return new JsonNav(`${this._sql}->'${key}'`);
  }

  navText<K extends keyof T & string>(key: K): JsonNav<T[K]> {
    return new JsonNav(`${this._sql}->>'${key}'`);
  }

  index(i: number): JsonNav<T extends (infer U)[] ? U : unknown> {
    return new JsonNav(`${this._sql}->${i}`);
  }

  indexText(i: number): JsonNav<T extends (infer U)[] ? U : unknown> {
    return new JsonNav(`${this._sql}->>${i}`);
  }

  path(keys: string[]): JsonNav<any> {
    return new JsonNav(`${this._sql}#>'{${keys.join(',')}}'`);
  }

  pathText(keys: string[]): JsonNav<any> {
    return new JsonNav(`${this._sql}#>>'{${keys.join(',')}}'`);
  }

  toString(): string {
    return this._sql;
  }
}

export function jsonNav(expr: string, key: string): JsonNav<any> {
  return new JsonNav(expr).navUnsafe(key);
}

export function jsonCol<T = any>(alias: string, column: string): JsonNav<T> {
  return new JsonNav<T>(`${alias}."${column}"`);
}
