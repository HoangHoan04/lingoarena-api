import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DefTransaction } from '~/common/core/decorator';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { PaginationDto, UserDto } from '~/dto';
import { SupportTicketEntity } from '~/entities';
import { SupportTicketMessageRepo, SupportTicketRepo, UserRepo } from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import {
  CreateContactDto,
  CreateSupportTicketDto,
  CreateTicketMessageDto,
  FilterSupportDto,
  PatchTicketStatusDto,
  UpdateSupportTicketDto,
} from '../dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly supportTicketRepo: SupportTicketRepo,
    private readonly supportTicketMessageRepo: SupportTicketMessageRepo,
    private readonly userRepo: UserRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

  private actorName(user?: UserDto) {
    return user?.fullName || user?.name || user?.username || user?.email || 'Guest';
  }

  private async writeLog(
    user: UserDto | undefined,
    actionType: string,
    entityType: string,
    entityId: string,
    description: string,
  ) {
    if (!user?.id) return;
    await this.actionLogService.create({
      entityId,
      entityType,
      actionType,
      createdBy: user.id,
      actorCode: user.username || user.email || user.id,
      actorName: this.actorName(user),
      description,
      dataBefore: '{}',
      dataAfter: '{}',
    });
  }

  private ticketNumber() {
    return `TK${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  private async resolveContactOwnerId(user?: UserDto) {
    if (user?.id) return user.id;
    const admin = await this.userRepo.findOne({
      where: { email: 'admin@lingoarena.com', isDeleted: false },
    });
    if (!admin) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.user'));
    return admin.id;
  }

  @DefTransaction()
  async createContact(dto: CreateContactDto, user?: UserDto) {
    const ownerId = await this.resolveContactOwnerId(user);
    const description = [
      `Người gửi: ${dto.name}`,
      `Email: ${dto.email}`,
      dto.phone ? `SĐT: ${dto.phone}` : null,
      '',
      dto.message,
    ]
      .filter(item => item !== null)
      .join('\n');
    const ticket = await this.supportTicketRepo.save(
      this.supportTicketRepo.create({
        id: uuidv4(),
        ticketNumber: this.ticketNumber(),
        userId: ownerId,
        category: enumData.TICKET_CATEGORY.OTHER.code,
        subject: dto.subject,
        description,
        priority: enumData.TICKET_PRIORITY.MEDIUM.code,
        createdBy: user?.id || ownerId,
      }),
    );
    await this.supportTicketMessageRepo.save(
      this.supportTicketMessageRepo.create({
        id: uuidv4(),
        supportTicketId: ticket.id,
        senderUserId: user?.id || ownerId,
        senderRole: enumData.TICKET_SENDER_ROLE.USER.code,
        content: description,
        isInternalNote: false,
        sentAt: new Date(),
        createdBy: user?.id || ownerId,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'SupportTicketEntity',
      ticket.id,
      `Liên hệ: ${ticket.subject}`,
    );
    return { message: this.i18n.commonTranslate('save_success'), data: transformKeys(ticket) };
  }

  async paginationTickets(body: PaginationDto<FilterSupportDto>, userId?: string) {
    const { skip = 0, take = 20, where = {} as FilterSupportDto } = body;
    const whereCon: FindOptionsWhere<SupportTicketEntity> = { isDeleted: where.isDeleted ?? false };
    if (userId) whereCon.userId = userId;
    if (where.userId && !userId) whereCon.userId = where.userId;
    if (where.keyword) whereCon.subject = UnaccentILike(`%${where.keyword}%`);
    const [data, total] = await this.supportTicketRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
    });
    return { data: transformKeys(data), total };
  }

  async findTicket(id: string, userId?: string) {
    const item = await this.supportTicketRepo.findOne({
      where: { id, ...(userId ? { userId } : {}) },
      relations: { messages: true },
      order: { messages: { sentAt: 'ASC' } },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.support_ticket'));
    item.messages = (item.messages || []).filter(
      message => !message.isDeleted && (!userId || !message.isInternalNote),
    );
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  @DefTransaction()
  async createTicket(dto: CreateSupportTicketDto, user: UserDto) {
    const ticket = await this.supportTicketRepo.save(
      this.supportTicketRepo.create({
        id: uuidv4(),
        ticketNumber: this.ticketNumber(),
        userId: user.id,
        category: dto.category,
        subject: dto.subject,
        description: dto.message,
        priority: dto.priority || enumData.TICKET_PRIORITY.MEDIUM.code,
        createdBy: user.id,
      }),
    );
    await this.supportTicketMessageRepo.save(
      this.supportTicketMessageRepo.create({
        id: uuidv4(),
        supportTicketId: ticket.id,
        senderUserId: user.id,
        senderRole: enumData.TICKET_SENDER_ROLE.USER.code,
        content: dto.message,
        isInternalNote: false,
        sentAt: new Date(),
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'SupportTicketEntity',
      ticket.id,
      `Tạo phiếu: ${ticket.ticketNumber}`,
    );
    return this.findTicket(ticket.id, user.id);
  }

  @DefTransaction()
  async updateTicket(id: string, dto: UpdateSupportTicketDto, user: UserDto) {
    const item = await this.supportTicketRepo.findOne({
      where: { id, userId: user.id, isDeleted: false },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.support_ticket'));
    Object.assign(item, {
      subject: dto.subject ?? item.subject,
      category: dto.category ?? item.category,
      priority: dto.priority ?? item.priority,
      updatedBy: user.id,
    });
    await this.supportTicketRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'SupportTicketEntity',
      id,
      `Cập nhật phiếu: ${item.ticketNumber}`,
    );
    return this.findTicket(id, user.id);
  }

  @DefTransaction()
  async addMessage(ticketId: string, dto: CreateTicketMessageDto, user: UserDto, asAdmin = false) {
    const ticket = await this.supportTicketRepo.findOne({
      where: { id: ticketId, ...(asAdmin ? {} : { userId: user.id }), isDeleted: false },
    });
    if (!ticket)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.support_ticket'));
    const message = await this.supportTicketMessageRepo.save(
      this.supportTicketMessageRepo.create({
        id: uuidv4(),
        supportTicketId: ticketId,
        senderUserId: user.id,
        senderRole: asAdmin
          ? enumData.TICKET_SENDER_ROLE.AGENT.code
          : enumData.TICKET_SENDER_ROLE.USER.code,
        content: dto.message,
        isInternalNote: asAdmin ? Boolean(dto.isInternal) : false,
        sentAt: new Date(),
        createdBy: user.id,
      }),
    );
    if (asAdmin && !dto.isInternal) {
      ticket.updatedBy = user.id;
      await this.supportTicketRepo.save(ticket);
    }
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'SupportTicketMessageEntity',
      message.id,
      'Gửi tin nhắn hỗ trợ',
    );
    return this.findTicket(ticketId, asAdmin ? undefined : user.id);
  }

  @DefTransaction()
  async patchStatus(id: string, dto: PatchTicketStatusDto, user: UserDto) {
    const item = await this.supportTicketRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.support_ticket'));
    if (
      dto.status === enumData.TICKET_STATUS.RESOLVED.code ||
      dto.status === enumData.TICKET_STATUS.CLOSED.code
    ) {
      item.resolvedAt = new Date();
    }
    item.updatedBy = user.id;
    await this.supportTicketRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'SupportTicketEntity',
      id,
      `Cập nhật trạng thái phiếu: ${dto.status}`,
    );
    return this.findTicket(id);
  }
}
