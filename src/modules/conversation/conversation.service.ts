import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, In, IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DefTransaction } from '~/common/core/decorator';
import SecurityHelper from '~/common/core/helpers/security.helper';
import { enumData } from '~/common/enums/base.enum';
import {
  createdEntityId,
  excelExportTake,
  optionalNumber,
  optionalText,
  parseJsonValue,
  requireText,
  runBulkImport,
  splitCodes,
  transformKeys,
} from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import { AiTutorPersonaEntity, ConversationEntity } from '~/entities';
import {
  AiTutorPersonaRepo,
  ConversationMessageRepo,
  ConversationParticipantRepo,
  ConversationRepo,
} from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../action-log/action-log.service';
import { I18nCustomService } from '../i18n-custom-module/i18n.service';
import {
  CreateAiTutorPersonaDto,
  CreateConversationMessageDto,
  CreateSpeakingRoomDto,
  FilterAiTutorPersonaDto,
  FilterConversationDto,
  JoinSpeakingRoomDto,
  StartAiSessionDto,
  UpdateAiTutorPersonaDto,
} from './dto';

@Injectable()
export class ConversationService {
  constructor(
    private readonly personaRepo: AiTutorPersonaRepo,
    private readonly conversationRepo: ConversationRepo,
    private readonly participantRepo: ConversationParticipantRepo,
    private readonly messageRepo: ConversationMessageRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

  private actorName(user: UserDto) {
    return user.fullName || user.name || user.username || user.email || 'Admin';
  }

  private async writeLog(
    user: UserDto,
    actionType: string,
    entityType: string,
    entityId: string,
    description: string,
  ) {
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

  async paginationPersonas(body: PaginationDto<FilterAiTutorPersonaDto>) {
    const { skip = 0, take = 20, where = {} as FilterAiTutorPersonaDto } = body;
    const whereCon: FindOptionsWhere<AiTutorPersonaEntity> = {
      isDeleted: where.isDeleted ?? false,
    };
    if (where.keyword) whereCon.name = UnaccentILike(`%${where.keyword}%`);
    const [data, total] = await this.personaRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
    });
    return { data: transformKeys(data), total };
  }

  async selectBoxPersonas() {
    const rows = await this.personaRepo.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });
    return rows.map(item => ({
      id: item.id,
      value: item.id,
      name: item.name,
      label: `${item.name} · ${item.title}`,
    }));
  }

  async findPersona(id: string) {
    const item = await this.personaRepo.findOne({ where: { id } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.ai_tutor_persona'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async listActivePersonas() {
    const data = await this.personaRepo.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });
    return { data: transformKeys(data), total: data.length };
  }

  @DefTransaction()
  async createPersona(dto: CreateAiTutorPersonaDto, user: UserDto) {
    const exist = await this.personaRepo.findOne({ where: { code: dto.code } });
    if (exist) throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    const item = await this.personaRepo.save(
      this.personaRepo.create({
        id: uuidv4(),
        code: dto.code.trim(),
        name: dto.name.trim(),
        title: dto.title.trim(),
        gender: dto.gender,
        accent: dto.accent,
        accentLabel: dto.accentLabel,
        avatarUrl: dto.avatarUrl,
        coverImageUrl: dto.coverImageUrl,
        roleDescription: dto.roleDescription,
        personality: dto.personality,
        tagline: dto.tagline,
        topicsJson: dto.topicsJson,
        speechRate: dto.speechRate ?? 1,
        speechPitch: dto.speechPitch ?? 1,
        voiceLang: dto.voiceLang || 'en-US',
        animeId: dto.animeId,
        welcomeMessage: dto.welcomeMessage,
        welcomeMessageVi: dto.welcomeMessageVi,
        samplePromptsJson: dto.samplePromptsJson,
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'AiTutorPersonaEntity',
      item.id,
      `Tạo nhân vật AI: ${item.code}`,
    );
    return this.findPersona(item.id);
  }

  @DefTransaction()
  async updatePersona(id: string, dto: UpdateAiTutorPersonaDto, user: UserDto) {
    const item = await this.personaRepo.findOne({ where: { id } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.ai_tutor_persona'));
    if (dto.code && dto.code !== item.code) {
      const exist = await this.personaRepo.findOne({ where: { code: dto.code } });
      if (exist && exist.id !== id)
        throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }
    Object.assign(item, {
      code: dto.code.trim(),
      name: dto.name.trim(),
      title: dto.title.trim(),
      gender: dto.gender,
      accent: dto.accent,
      accentLabel: dto.accentLabel,
      avatarUrl: dto.avatarUrl,
      coverImageUrl: dto.coverImageUrl,
      roleDescription: dto.roleDescription,
      personality: dto.personality,
      tagline: dto.tagline,
      topicsJson: dto.topicsJson,
      speechRate: dto.speechRate ?? item.speechRate,
      speechPitch: dto.speechPitch ?? item.speechPitch,
      voiceLang: dto.voiceLang || item.voiceLang,
      animeId: dto.animeId,
      welcomeMessage: dto.welcomeMessage,
      welcomeMessageVi: dto.welcomeMessageVi,
      samplePromptsJson: dto.samplePromptsJson,
      updatedBy: user.id,
    });
    await this.personaRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'AiTutorPersonaEntity',
      id,
      `Cập nhật nhân vật AI: ${item.code}`,
    );
    return this.findPersona(id);
  }

  @DefTransaction()
  async deactivatePersona(id: string, user: UserDto) {
    const item = await this.personaRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.ai_tutor_persona'));
    item.isDeleted = true;
    item.deletedAt = new Date();
    item.updatedBy = user.id;
    await this.personaRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'AiTutorPersonaEntity',
      id,
      `Ngưng nhân vật AI: ${item.code}`,
    );
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  @DefTransaction()
  async activatePersona(id: string, user: UserDto) {
    const item = await this.personaRepo.findOne({ where: { id } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.ai_tutor_persona'));
    item.isDeleted = false;
    item.deletedAt = null;
    item.updatedBy = user.id;
    await this.personaRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'AiTutorPersonaEntity',
      id,
      `Kích hoạt nhân vật AI: ${item.code}`,
    );
    return this.findPersona(id);
  }

  async paginationSpeakingRooms(body: PaginationDto<FilterConversationDto>, user: UserDto) {
    const { skip = 0, take = 20, where = {} as FilterConversationDto } = body;
    const memberships = await this.participantRepo.find({
      where: { userId: user.id, isDeleted: false },
    });
    const memberIds = memberships.map(item => item.conversationId);
    const qb = this.conversationRepo
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .where('conversation.isDeleted = :isDeleted', { isDeleted: where.isDeleted ?? false })
      .andWhere('conversation.conversationType = :type', {
        type: enumData.CONVERSATION_TYPE.SPEAKING_ROOM.code,
      });
    if (where.status) qb.andWhere('conversation.status = :status', { status: where.status });
    else
      qb.andWhere('conversation.status = :status', {
        status: enumData.CONVERSATION_STATUS.OPEN.code,
      });
    if (where.keyword)
      qb.andWhere('conversation.title ILIKE :keyword', { keyword: `%${where.keyword}%` });
    if (where.topic) {
      qb.andWhere('conversation.topic ILIKE :topic', { topic: `%${where.topic.trim()}%` });
    }
    if (memberIds.length) {
      qb.andWhere('(conversation.isPrivate = false OR conversation.id IN (:...memberIds))', {
        memberIds,
      });
    } else {
      qb.andWhere('conversation.isPrivate = false');
    }
    qb.orderBy('conversation.lastMessageAt', 'DESC', 'NULLS LAST').addOrderBy(
      'conversation.createdAt',
      'DESC',
    );
    qb.skip(skip).take(take || 20);
    const [data, total] = await qb.getManyAndCount();
    return { data: transformKeys(data), total };
  }

  @DefTransaction()
  async createSpeakingRoom(dto: CreateSpeakingRoomDto, user: UserDto) {
    const passwordHash =
      dto.isPrivate && dto.password ? await SecurityHelper.hash(dto.password) : undefined;
    const item = await this.conversationRepo.save(
      this.conversationRepo.create({
        id: uuidv4(),
        conversationType: enumData.CONVERSATION_TYPE.SPEAKING_ROOM.code,
        title: dto.title.trim(),
        topic: dto.topic,
        hostUserId: user.id,
        cefrLevel: dto.cefrLevel,
        maxParticipants: dto.maxParticipants ?? 8,
        isPrivate: Boolean(dto.isPrivate),
        passwordHash,
        icebreakersJson: dto.icebreakersJson,
        status: enumData.CONVERSATION_STATUS.OPEN.code,
        messageCount: 0,
        createdBy: user.id,
      }),
    );
    await this.participantRepo.save(
      this.participantRepo.create({
        id: uuidv4(),
        conversationId: item.id,
        userId: user.id,
        role: enumData.CONVERSATION_PARTICIPANT_ROLE.HOST.code,
        joinedAt: new Date(),
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'ConversationEntity',
      item.id,
      `Tạo phòng luyện nói: ${item.title}`,
    );
    return this.findConversation(item.id, user);
  }

  @DefTransaction()
  async joinSpeakingRoom(id: string, dto: JoinSpeakingRoomDto, user: UserDto) {
    const item = await this.conversationRepo.findOne({
      where: {
        id,
        conversationType: enumData.CONVERSATION_TYPE.SPEAKING_ROOM.code,
        isDeleted: false,
      },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.conversation'));
    if (item.status !== enumData.CONVERSATION_STATUS.OPEN.code) {
      throw new BusinessException('Phòng đã đóng');
    }
    if (item.isPrivate) {
      if (!dto.password || !item.passwordHash)
        throw new BusinessException('Phòng riêng tư cần mật khẩu');
      const ok = await SecurityHelper.compare(dto.password, item.passwordHash);
      if (!ok) throw new BusinessException('Mật khẩu phòng không đúng');
    }
    const existing = await this.participantRepo.findOne({
      where: { conversationId: id, userId: user.id },
    });
    if (existing && !existing.isDeleted && !existing.leftAt) return this.findConversation(id, user);
    const activeCount = await this.participantRepo.count({
      where: { conversationId: id, isDeleted: false, leftAt: IsNull() },
    });
    if (item.maxParticipants && activeCount >= item.maxParticipants) {
      throw new BusinessException('Phòng đã đủ người');
    }
    if (existing) {
      existing.isDeleted = false;
      existing.leftAt = null;
      existing.joinedAt = new Date();
      existing.updatedBy = user.id;
      await this.participantRepo.save(existing);
    } else {
      await this.participantRepo.save(
        this.participantRepo.create({
          id: uuidv4(),
          conversationId: id,
          userId: user.id,
          role: enumData.CONVERSATION_PARTICIPANT_ROLE.MEMBER.code,
          joinedAt: new Date(),
          createdBy: user.id,
        }),
      );
    }
    return this.findConversation(id, user);
  }

  @DefTransaction()
  async startAiSession(dto: StartAiSessionDto, user: UserDto) {
    const persona = await this.personaRepo.findOne({
      where: { id: dto.personaId, isDeleted: false },
    });
    if (!persona)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.ai_tutor_persona'));
    const item = await this.conversationRepo.save(
      this.conversationRepo.create({
        id: uuidv4(),
        conversationType: enumData.CONVERSATION_TYPE.AI_TUTOR.code,
        title: persona.name,
        personaId: persona.id,
        hostUserId: user.id,
        isPrivate: true,
        status: enumData.CONVERSATION_STATUS.OPEN.code,
        messageCount: 0,
        createdBy: user.id,
      }),
    );
    await this.participantRepo.save(
      this.participantRepo.create({
        id: uuidv4(),
        conversationId: item.id,
        userId: user.id,
        role: enumData.CONVERSATION_PARTICIPANT_ROLE.HOST.code,
        joinedAt: new Date(),
        createdBy: user.id,
      }),
    );
    if (persona.welcomeMessage) {
      await this.messageRepo.save(
        this.messageRepo.create({
          id: uuidv4(),
          conversationId: item.id,
          senderRole: enumData.CONVERSATION_ROLE.AI.code,
          content: persona.welcomeMessage,
          translationVi: persona.welcomeMessageVi,
          isSystem: false,
          sentAt: new Date(),
          createdBy: user.id,
        }),
      );
      item.messageCount = 1;
      item.lastMessageAt = new Date();
      await this.conversationRepo.save(item);
    }
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'ConversationEntity',
      item.id,
      `Bắt đầu hội thoại AI: ${persona.name}`,
    );
    return this.findConversation(item.id, user);
  }

  async paginationMyAiSessions(body: PaginationDto<FilterConversationDto>, user: UserDto) {
    const memberships = await this.participantRepo.find({
      where: { userId: user.id, isDeleted: false },
    });
    const ids = memberships.map(item => item.conversationId);
    if (!ids.length) return { data: [], total: 0 };
    const { skip = 0, take = 20, where = {} as FilterConversationDto } = body || {};
    const whereCon: FindOptionsWhere<ConversationEntity> = {
      id: In(ids),
      conversationType: enumData.CONVERSATION_TYPE.AI_TUTOR.code,
      isDeleted: false,
    };
    if (where.status) whereCon.status = where.status;
    if (where.personaId) whereCon.personaId = where.personaId;
    const [data, total] = await this.conversationRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
      relations: { persona: true },
    });
    return { data: transformKeys(data), total };
  }

  async findConversation(id: string, user: UserDto) {
    const item = await this.conversationRepo.findOne({
      where: { id, isDeleted: false },
      relations: { persona: true, participants: true, messages: true },
    });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.conversation'));
    const isMember = (item.participants || []).some(
      part => part.userId === user.id && !part.isDeleted,
    );
    const isPublicRoom =
      item.conversationType === enumData.CONVERSATION_TYPE.SPEAKING_ROOM.code && !item.isPrivate;
    if (!isMember && !isPublicRoom) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.conversation'));
    }
    item.messages = (item.messages || [])
      .filter(message => !message.isDeleted)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
    item.participants = (item.participants || []).filter(part => !part.isDeleted);
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  @DefTransaction()
  async postMessage(id: string, dto: CreateConversationMessageDto, user: UserDto) {
    const item = await this.conversationRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.conversation'));
    if (item.status !== enumData.CONVERSATION_STATUS.OPEN.code) {
      throw new BusinessException('Hội thoại đã đóng');
    }
    const member = await this.participantRepo.findOne({
      where: { conversationId: id, userId: user.id, isDeleted: false },
    });
    if (!member)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.conversation'));
    const message = await this.messageRepo.save(
      this.messageRepo.create({
        id: uuidv4(),
        conversationId: id,
        senderUserId: user.id,
        senderRole: enumData.CONVERSATION_ROLE.USER.code,
        content: dto.content,
        translationVi: dto.translationVi,
        audioUrl: dto.audioUrl,
        audioDurationSeconds: dto.audioDurationSeconds,
        feedbackJson: dto.feedbackJson,
        isSystem: false,
        sentAt: new Date(),
        createdBy: user.id,
      }),
    );
    item.messageCount = Number(item.messageCount || 0) + 1;
    item.lastMessageAt = message.sentAt;
    await this.conversationRepo.save(item);
    return { message: this.i18n.commonTranslate('save_success'), data: transformKeys(message) };
  }

  @DefTransaction()
  async closeConversation(id: string, user: UserDto) {
    const item = await this.conversationRepo.findOne({ where: { id, isDeleted: false } });
    if (!item)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.conversation'));
    const member = await this.participantRepo.findOne({
      where: { conversationId: id, userId: user.id, isDeleted: false },
    });
    const isHost = item.hostUserId === user.id;
    if (!member && !isHost)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.conversation'));
    item.status = enumData.CONVERSATION_STATUS.CLOSED.code;
    item.updatedBy = user.id;
    await this.conversationRepo.save(item);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'ConversationEntity',
      id,
      `Đóng hội thoại: ${item.title || item.id}`,
    );
    return this.findConversation(id, user);
  }

  async importPersonas(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const topics = splitCodes(item.topicsJson);
      const created = await this.createPersona(
        {
          code: requireText(item.code, 'Mã'),
          name: requireText(item.name, 'Tên'),
          title: requireText(item.title, 'Chức danh'),
          gender: requireText(item.gender, 'Giới tính'),
          accent: requireText(item.accent, 'Accent'),
          accentLabel: requireText(item.accentLabel, 'Nhãn accent'),
          avatarUrl: optionalText(item.avatarUrl),
          coverImageUrl: optionalText(item.coverImageUrl),
          roleDescription: requireText(item.roleDescription, 'Mô tả vai trò'),
          personality: requireText(item.personality, 'Tính cách'),
          tagline: optionalText(item.tagline),
          topicsJson: topics.length ? topics : undefined,
          speechRate: optionalNumber(item.speechRate, 1),
          speechPitch: optionalNumber(item.speechPitch, 1),
          voiceLang: optionalText(item.voiceLang) || 'en-US',
          animeId: optionalText(item.animeId),
          welcomeMessage: requireText(item.welcomeMessage, 'Lời chào'),
          welcomeMessageVi: optionalText(item.welcomeMessageVi),
          samplePromptsJson: parseJsonValue(item.samplePromptsJson),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportPersonas(body: PaginationDto<FilterAiTutorPersonaDto>) {
    const { data } = await this.paginationPersonas({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }
}
