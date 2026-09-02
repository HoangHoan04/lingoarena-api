import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PageResponse } from '~/common/helpers';
import { isUuid } from '~/common/helpers/validate.helper';
import { ActionLogEntity } from '~/entities';
import { ActionLogRepo, UserRepo } from '~/repositories';
import { PaginationDto } from '../../dto';
import { ActionLogCreateDto } from './dto';

@Injectable()
export class ActionLogService {
  constructor(
    private repo: ActionLogRepo,
    private userRepo: UserRepo,
  ) {}

  async create(dto: ActionLogCreateDto): Promise<void> {
    const actionLog = new ActionLogEntity();
    actionLog.id = uuidv4();
    actionLog.entityId = dto.entityId;
    actionLog.entityType = dto.entityType;
    actionLog.actionType = dto.actionType;
    actionLog.actorName = dto.actorName;
    actionLog.description = dto.description;
    actionLog.actorCode = dto.actorCode || '';
    actionLog.createdBy = dto.createdBy || dto.actorCode || 'system';
    actionLog.dataBefore = JSON.parse(dto.dataBefore || '{}');
    actionLog.dataAfter = JSON.parse(dto.dataAfter || '{}');
    await this.repo.insert(actionLog);
  }

  async createList(dto: ActionLogCreateDto[]): Promise<void> {
    const lstInsert = [];
    for (let item of dto) {
      const actionLog = new ActionLogEntity();
      actionLog.id = uuidv4();
      actionLog.entityId = item.entityId;
      actionLog.entityType = item.entityType;
      actionLog.actionType = item.actionType;
      actionLog.actorName = item.actorName;
      actionLog.description = item.description;
      actionLog.actorCode = item.actorCode || '';
      actionLog.createdBy = item.createdBy || item.actorCode || 'system';
      actionLog.dataBefore = JSON.parse(item?.dataBefore || '{}');
      actionLog.dataAfter = JSON.parse(item?.dataAfter || '{}');
      lstInsert.push(actionLog);
    }
    await this.repo.insert(lstInsert);
  }

  async pagination(data: PaginationDto): Promise<PageResponse<ActionLogEntity>> {
    const { skip = 0, take = 10, where } = data;
    const whereCon: FindOptionsWhere<ActionLogEntity> = {
      entityType: where.entityType,
      entityId: where.entityId,
    };
    if (where.actorCode) {
      whereCon.actorCode = where.actorCode;
    }
    if (where.actionType) {
      whereCon.actionType = where.actionType;
    }
    const res: any = await this.repo.findAndCount({
      where: data.where,
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    const lstUserId = res[0].mapAndDistinct(item => item.createdBy).filter(id => isUuid(id));
    const lstUser = await this.userRepo.find({
      where: { id: In(lstUserId) },
      relations: {},
      select: {
        id: true,
      },
    });
    const mapUser = new Map(lstUser.map(user => [user.id, user]));
    for (let item of res[0]) {
      const curUser = mapUser.get(item.createdBy);
      if (curUser) {
        item.createdByName = curUser.email || '';
        item.createdByCode = curUser.email || '';
      }
    }

    return {
      data: res[0],
      total: res[1],
    };
  }

  async findByEntityId(entityId: string): Promise<ActionLogEntity[]> {
    return this.repo.find({
      where: { entityId },
      order: { createdAt: 'DESC' },
    });
  }
}
