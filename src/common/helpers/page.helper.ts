import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiProperty, getSchemaPath } from '@nestjs/swagger';
type TOperatorString = '=' | 'LIKE' | 'NOT LIKE';
type TOperatorNumber = '=' | '!=' | '<' | '>' | '>=' | '<=';
type TOperatorDate = '=' | '!=' | '<' | '>' | '>=' | '<=';
type TOperatorSelect = 'IN' | 'NOT IN';
type TOperatorBoolean = '=';

export class FilterItemString {
  type: 'TEXT' = 'TEXT';
  value: string = '';
  compare?: TOperatorString = 'LIKE';
}
export class FilterItemNumber {
  type: 'NUMBER' = 'NUMBER';
  value: number;
  compare?: TOperatorNumber = '=';
}
export class FilterItemDate {
  type: 'DATE' = 'DATE';
  value: Date;
  compare?: TOperatorDate = '=';
}
export class FilterItemBoolean {
  type: 'BOOLEAN' = 'BOOLEAN';
  value: boolean;
  compare?: TOperatorBoolean = '=';
}

export class FilterItemSelect {
  type: 'SELECT' = 'SELECT';
  value: any[] = [];
  compare?: TOperatorSelect = 'IN';
}
export type FilterItem =
  FilterItemString | FilterItemNumber | FilterItemDate | FilterItemBoolean | FilterItemSelect;

export type FilterOption<T = any> = {
  [k in keyof T]?: FilterItem;
};
export type OrderOption<T> = {
  [k in keyof T]?: 'ASC' | 'DESC';
};

export class PageRequest {
  pageSize: number = 10;
  pageIndex: number = 1;
}

export class TablePageRequest<T = any> extends PageRequest {
  @ApiProperty({
    type: Object,
  })
  orders?: OrderOption<T>;
  @ApiProperty({
    type: Object,
  })
  filters?: FilterOption<T>;
}

export class PageResponse<T = any> {
  data: T[];
  total: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  skip?: number;
  take?: number;
  page?: number;
  pageSize?: number;
  totalPage?: number;
}
export class SuccessResponse {
  message: string = 'success';
  data?: any;
}

export class DataSuccessResponse<T> {
  message: string = 'success';
  data: T;

  constructor(data: T) {
    this.data = data;
  }
}

function mapPostgresQueryFilter<T>(filters: FilterOption<T> = {}) {
  let where = ' where 1 = 1 ';
  Object.keys(filters).forEach(key => {
    const filterItem: FilterItem = filters[key] || [];

    if (filterItem.type === 'TEXT') {
      const { value, compare = 'LIKE' } = filterItem;
      if (value) {
        where += ` AND ( "${key}" ${compare} '%${value}%'  ) `;
      }
    }
    if (filterItem.type === 'DATE') {
      const { value, compare = '=' } = filterItem;
      if (value) {
        switch (compare) {
          case '=':
            where += ` AND ( "${key}" >= '${value}'::date AND  "${key}" < ('${value}'::date + '1 day'::interval) ) `;
            break;
          default:
            where += ` AND ( "${key}" ${compare} '%${value}%'  ) `;
            break;
        }
      }
    }

    if (filterItem.type === 'NUMBER' || filterItem.type === 'BOOLEAN') {
      const { value, compare = '=' } = filterItem;
      if (value !== undefined && value !== null && typeof value === 'number') {
        where += ` AND ( "${key}" ${compare} ${value}  ) `;
      }
    }

    if (filterItem.type === 'SELECT') {
      const { value, compare = 'IN' } = filterItem;
      const makeValue = value.filter(v => v);
      if (makeValue && makeValue.length > 0) {
        where += ` AND ( "${key}" ${compare} ('${value.join(',')}')  ) `;
      }
    }
  });
  return where;
}

export const ApiPaginatedDto = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PageResponse) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};
export const ApiOkResponsePaginated = <DataDto extends Type<unknown>>(dataDto: DataDto) => {
  return applyDecorators(
    ApiExtraModels(PageResponse, dataDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PageResponse) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(dataDto) },
              },
            },
          },
        ],
      },
    }),
  );
};
export default {
  mapPostgresQueryFilter,
};

export function transformKeys(obj: any): any {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      const value = obj[key];
      if (value instanceof Date) {
        newObj[key.startsWith('__') ? key.slice(2, key.length - 2) : key] = value;
        continue;
      }
      const newKey = key.startsWith('__') ? key.slice(2, key.length - 2) : key;
      newObj[newKey] = transformKeys(value);
    }
    return newObj;
  }
  return obj;
}

export function transformArrObj<T>(arr: T[]): T[] {
  return arr.map(item => {
    if (typeof item === 'object' && item !== null) {
      return transformKeys(item);
    }
    return item;
  });
}
