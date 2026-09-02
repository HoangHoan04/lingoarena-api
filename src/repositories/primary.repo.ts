import { FindOneOptions } from 'typeorm';
import { validate, version } from 'uuid';
import { TYPEORM_EX_CONNECTION_NAME } from '~/common/constants/typeorm';
import { BaseRepoPostgreSql } from './base.repo';

const isUuidV4 = (value: unknown): boolean => {
  return typeof value === 'string' && validate(value) && version(value) === 4;
};

const getIdFromWhere = (where: any): unknown => {
  if (!where) return undefined;
  if (Array.isArray(where)) {
    for (const cond of where) {
      const id = cond?.id;
      if (id !== undefined) return id;
    }
    return undefined;
  }
  if (typeof where?.id !== 'string') {
    return undefined;
  }
  return where?.id;
};

export class PrimaryRepo<Entity> extends BaseRepoPostgreSql<Entity> {
  constructor(target: any, manager: any, queryRunner?: any) {
    super(target, manager, queryRunner);
  }
  static getConnectionName() {
    return TYPEORM_EX_CONNECTION_NAME;
  }

  async findOne(options: FindOneOptions<Entity>): Promise<Entity | null> {
    const id = getIdFromWhere(options?.where);
    if (id !== undefined && !isUuidV4(id)) {
      return null;
    }
    return super.findOne(options);
  }
}
