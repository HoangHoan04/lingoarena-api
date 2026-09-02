import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { In, LessThanOrEqual } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { enumData } from '~/common/enums/base.enum';
import { PaginationDto, UserDto } from '~/dto';
import { VocabularyDeckEntity, VocabularyEntity } from '~/entities';
import {
  ExamTypeRepo,
  MediaAssetRepo,
  TopicRepo,
  UserVocabularyStateRepo,
  VocabularyCollocationRepo,
  VocabularyDeckItemRepo,
  VocabularyDeckRepo,
  VocabularyExamTypeRepo,
  VocabularyExampleRepo,
  VocabularyRelationRepo,
  VocabularyRepo,
  VocabularyReviewLogRepo,
  VocabularyReviewSessionRepo,
  VocabularyTopicRepo,
} from '~/repositories';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import { UploadFileService } from '../../upload-file/upload-file.service';
import {
  AnswerSessionDto,
  CreateDeckDto,
  CreateVocabularyDto,
  FilterDeckDto,
  FilterNotebookDto,
  FilterVocabularyDto,
  GenerateWordTtsDto,
  ReplaceDeckItemsDto,
  StartSessionDto,
  UpdateDeckDto,
  UpdateVocabularyDto,
} from '../dto';
import {
  applySm2Rating,
  buildPublicDeck,
  buildPublicWord,
  buildQuizQuestion,
  isCorrectRating,
  normalizeHeadword,
  normalizeRating,
  pickStudyQueue,
  slugify,
  summarizeProgress,
  fetchTtsMp3,
} from '../helpers';

@Injectable()
export class VocabularyService {
  constructor(
    private readonly vocabularyRepo: VocabularyRepo,
    private readonly vocabularyExampleRepo: VocabularyExampleRepo,
    private readonly vocabularyCollocationRepo: VocabularyCollocationRepo,
    private readonly vocabularyRelationRepo: VocabularyRelationRepo,
    private readonly vocabularyTopicRepo: VocabularyTopicRepo,
    private readonly vocabularyExamTypeRepo: VocabularyExamTypeRepo,
    private readonly vocabularyDeckRepo: VocabularyDeckRepo,
    private readonly vocabularyDeckItemRepo: VocabularyDeckItemRepo,
    private readonly userVocabularyStateRepo: UserVocabularyStateRepo,
    private readonly vocabularyReviewLogRepo: VocabularyReviewLogRepo,
    private readonly vocabularyReviewSessionRepo: VocabularyReviewSessionRepo,
    private readonly topicRepo: TopicRepo,
    private readonly examTypeRepo: ExamTypeRepo,
    private readonly mediaAssetRepo: MediaAssetRepo,
    private readonly uploadFileService: UploadFileService,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

  private wordRelations() {
    return {
      examples: true,
      collocations: true,
      relations: { relatedVocabulary: true },
      vocabularyTopics: { topic: true },
      vocabularyExamTypes: { examType: true },
      audioUkAsset: true,
      audioUsAsset: true,
    } as const;
  }

  private actorName(user: UserDto) {
    return user.fullName || user.name || user.username || user.email || 'Admin';
  }

  private async writeLog(
    user: UserDto,
    actionType: string,
    entityType: string,
    entityId: string,
    description: string,
    dataAfter: Record<string, unknown> = {},
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
      dataAfter: JSON.stringify(dataAfter),
    });
  }

  private async replaceExamples(
    vocabularyId: string,
    examples?: { sentence: string; translation: string; sortOrder?: number }[],
  ) {
    await this.vocabularyExampleRepo.delete({ vocabularyId });
    if (!examples?.length) return;
    await this.vocabularyExampleRepo.save(
      examples.map((item, index) =>
        this.vocabularyExampleRepo.create({
          id: uuidv4(),
          vocabularyId,
          sentence: item.sentence,
          translation: item.translation,
          sortOrder: item.sortOrder ?? index,
        }),
      ),
    );
  }

  private async replaceCollocations(
    vocabularyId: string,
    items?: CreateVocabularyDto['collocations'],
  ) {
    await this.vocabularyCollocationRepo.delete({ vocabularyId });
    if (!items?.length) return;
    await this.vocabularyCollocationRepo.save(
      items.map((item, index) =>
        this.vocabularyCollocationRepo.create({
          id: uuidv4(),
          vocabularyId,
          collocation: item.collocation.trim(),
          meaningVi: item.meaningVi,
          exampleSentence: item.exampleSentence,
          sortOrder: item.sortOrder ?? index,
        }),
      ),
    );
  }

  private async replaceRelations(
    vocabularyId: string,
    items?: CreateVocabularyDto['relations'],
  ) {
    await this.vocabularyRelationRepo.delete({ vocabularyId });
    if (!items?.length) return;
    const unique = items.filter(
      (item, index, list) =>
        item.relatedVocabularyId !== vocabularyId &&
        list.findIndex(
          row =>
            row.relatedVocabularyId === item.relatedVocabularyId &&
            row.relationType === item.relationType,
        ) === index,
    );
    if (!unique.length) return;
    await this.vocabularyRelationRepo.save(
      unique.map(item =>
        this.vocabularyRelationRepo.create({
          id: uuidv4(),
          vocabularyId,
          relatedVocabularyId: item.relatedVocabularyId,
          relationType: item.relationType,
        }),
      ),
    );
  }

  private async replaceTopics(vocabularyId: string, topicIds?: string[]) {
    await this.vocabularyTopicRepo.delete({ vocabularyId });
    const ids = [...new Set((topicIds || []).filter(Boolean))];
    if (!ids.length) return;
    await this.vocabularyTopicRepo.save(
      ids.map(topicId =>
        this.vocabularyTopicRepo.create({ id: uuidv4(), vocabularyId, topicId }),
      ),
    );
  }

  private async replaceExamTypes(vocabularyId: string, examTypeIds?: string[]) {
    await this.vocabularyExamTypeRepo.delete({ vocabularyId });
    const ids = [...new Set((examTypeIds || []).filter(Boolean))];
    if (!ids.length) return;
    await this.vocabularyExamTypeRepo.save(
      ids.map(examTypeId =>
        this.vocabularyExamTypeRepo.create({ id: uuidv4(), vocabularyId, examTypeId }),
      ),
    );
  }

  private async persistNested(vocabularyId: string, dto: CreateVocabularyDto | UpdateVocabularyDto) {
    if (dto.examples) await this.replaceExamples(vocabularyId, dto.examples);
    if (dto.collocations) await this.replaceCollocations(vocabularyId, dto.collocations);
    if (dto.relations) await this.replaceRelations(vocabularyId, dto.relations);
    if (dto.topicIds) await this.replaceTopics(vocabularyId, dto.topicIds);
    if (dto.examTypeIds) await this.replaceExamTypes(vocabularyId, dto.examTypeIds);
  }

  async paginationWords(body: PaginationDto<FilterVocabularyDto>) {
    const { skip = 0, take = 20, where = {} as FilterVocabularyDto } = body;
    const qb = this.vocabularyRepo
      .createQueryBuilder('word')
      .leftJoinAndSelect('word.examples', 'examples')
      .leftJoinAndSelect('word.audioUkAsset', 'audioUkAsset')
      .leftJoinAndSelect('word.audioUsAsset', 'audioUsAsset')
      .where('word.isDeleted = :isDeleted', { isDeleted: where.isDeleted ?? false });

    if (where.keyword) {
      qb.andWhere(
        '(LOWER(word.headword) LIKE :kw OR LOWER(word.meaningVi) LIKE :kw OR LOWER(word.definitionEn) LIKE :kw)',
        { kw: `%${where.keyword.trim().toLowerCase()}%` },
      );
    }
    if (where.cefrLevel) qb.andWhere('word.cefrLevel = :cefrLevel', { cefrLevel: where.cefrLevel });
    if (where.partOfSpeech) qb.andWhere('word.partOfSpeech = :pos', { pos: where.partOfSpeech });
    if (where.status) qb.andWhere('word.status = :status', { status: where.status });
    if (where.topicId) {
      qb.innerJoin('word.vocabularyTopics', 'vt', 'vt.topicId = :topicId', { topicId: where.topicId });
    }
    if (where.examTypeId) {
      qb.innerJoin('word.vocabularyExamTypes', 'vet', 'vet.examTypeId = :examTypeId', {
        examTypeId: where.examTypeId,
      });
    }

    const [rows, total] = await qb
      .orderBy('word.createdAt', 'DESC')
      .skip(skip)
      .take(take || 20)
      .getManyAndCount();
    return { data: rows.map(item => buildPublicWord(item)), total };
  }

  async paginationPublicWords(body: PaginationDto<FilterVocabularyDto>) {
    return this.paginationWords({
      skip: body.skip,
      take: body.take,
      where: {
        ...(body.where || {}),
        isDeleted: false,
        status: enumData.CONTENT_REVIEW_STATUS.APPROVED.code,
      },
    });
  }

  async myNotebook(userId: string, body: PaginationDto<FilterNotebookDto>) {
    const { skip = 0, take = 20, where = {} as FilterNotebookDto } = body;
    const qb = this.userVocabularyStateRepo
      .createQueryBuilder('state')
      .leftJoinAndSelect('state.vocabulary', 'word')
      .leftJoinAndSelect('word.examples', 'examples')
      .leftJoinAndSelect('word.audioUkAsset', 'audioUkAsset')
      .leftJoinAndSelect('word.audioUsAsset', 'audioUsAsset')
      .where('state.userId = :userId', { userId })
      .andWhere('state.isDeleted = false')
      .andWhere('word.isDeleted = false');

    if (where.keyword) {
      qb.andWhere(
        '(LOWER(word.headword) LIKE :kw OR LOWER(word.meaningVi) LIKE :kw OR LOWER(word.definitionEn) LIKE :kw)',
        { kw: `%${where.keyword.trim().toLowerCase()}%` },
      );
    }
    if (where.state) {
      qb.andWhere('state.state = :srsState', { srsState: where.state });
    }
    if (where.dueOnly) {
      qb.andWhere('state.nextReviewAt <= :now', { now: new Date() });
    }

    const [rows, total] = await qb
      .orderBy('state.nextReviewAt', 'ASC')
      .skip(skip)
      .take(take || 20)
      .getManyAndCount();

    return {
      data: rows
        .filter(item => item.vocabulary)
        .map(item => ({
          ...buildPublicWord(item.vocabulary),
          srsState: item.state,
          nextReviewAt: item.nextReviewAt,
          intervalDays: item.intervalDays,
          repetitionCount: item.repetitionCount,
        })),
      total,
    };
  }

  async findWord(id: string, publicOnly = false) {
    const word = await this.vocabularyRepo.findOne({
      where: { id, isDeleted: false },
      relations: this.wordRelations(),
    });
    if (!word) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.vocabulary'));
    }
    if (publicOnly && word.status !== enumData.CONTENT_REVIEW_STATUS.APPROVED.code) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.vocabulary'));
    }
    return { message: this.i18n.commonTranslate('find_success'), data: buildPublicWord(word) };
  }

  async selectBoxWords(keyword?: string) {
    const qb = this.vocabularyRepo
      .createQueryBuilder('word')
      .where('word.isDeleted = false')
      .orderBy('word.headword', 'ASC')
      .take(50);
    if (keyword) {
      qb.andWhere('LOWER(word.headword) LIKE :kw', { kw: `%${keyword.trim().toLowerCase()}%` });
    }
    const rows = await qb.getMany();
    return rows.map(item => ({
      id: item.id,
      label: `${item.headword} (${item.partOfSpeech})`,
      value: item.id,
      name: item.headword,
    }));
  }

  async selectBoxTopics() {
    const rows = await this.topicRepo.find({
      where: { isDeleted: false },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map(item => ({
      id: item.id,
      label: item.name,
      value: item.id,
      name: item.name,
      code: item.code,
    }));
  }

  async selectBoxExamTypes() {
    const rows = await this.examTypeRepo.find({
      where: { isActive: true, isDeleted: false },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map(item => ({
      id: item.id,
      label: item.name,
      value: item.id,
      name: item.name,
      code: item.code,
    }));
  }

  private async saveTtsAsset(
    buffer: Buffer,
    headword: string,
    accent: 'uk' | 'us',
    user: UserDto,
  ) {
    const fileName = `vocab-${accent}-${slugify(headword) || 'word'}.mp3`;
    const uploaded = await this.uploadFileService.uploadBuffer(
      buffer,
      'audio/mpeg',
      fileName,
      'lingoarena-vocab-tts',
    );
    const asset = this.mediaAssetRepo.create({
      id: uuidv4(),
      ownerId: user.id,
      assetType: enumData.MEDIA_ASSET_TYPE.AUDIO.code,
      storageProvider: uploaded.storage,
      storageKey: uploaded.fileName,
      publicUrl: uploaded.fileUrl,
      originalFilename: fileName,
      mimeType: 'audio/mpeg',
      sizeBytes: uploaded.sizeBytes,
      processingStatus: 'ready',
      visibility: enumData.VISIBILITY.PUBLIC.code,
      createdBy: user.id,
    });
    await this.mediaAssetRepo.save(asset);
    return {
      assetId: asset.id,
      publicUrl: asset.publicUrl || uploaded.fileUrl,
      fileName: uploaded.fileName,
    };
  }

  async synthesizeWordAudio(text: string, user: UserDto) {
    const cleaned = (text || '').trim();
    if (cleaned.length < 1) {
      throw new BadRequestException('Thiếu từ để tạo audio');
    }
    const [ukBuffer, usBuffer] = await Promise.all([
      fetchTtsMp3(cleaned, 'uk'),
      fetchTtsMp3(cleaned, 'us'),
    ]);
    const [uk, us] = await Promise.all([
      this.saveTtsAsset(ukBuffer, cleaned, 'uk', user),
      this.saveTtsAsset(usBuffer, cleaned, 'us', user),
    ]);
    return { text: cleaned, uk, us };
  }

  async generateWordTts(dto: GenerateWordTtsDto, user: UserDto) {
    const data = await this.synthesizeWordAudio(dto.text, user);
    return { message: this.i18n.commonTranslate('create_success'), data };
  }

  private async attachTtsIfMissing(
    headword: string,
    user: UserDto,
    existing: { uk?: string; us?: string },
  ) {
    if (existing.uk && existing.us) return existing;
    try {
      const generated = await this.synthesizeWordAudio(headword, user);
      return {
        uk: existing.uk || generated.uk.assetId,
        us: existing.us || generated.us.assetId,
      };
    } catch (err) {
      console.error('Vocabulary TTS skipped:', err);
      return existing;
    }
  }

  async createWord(dto: CreateVocabularyDto, user: UserDto) {
    const normalizedWord = normalizeHeadword(dto.headword);
    const exist = await this.vocabularyRepo.findOne({
      where: { normalizedWord, partOfSpeech: dto.partOfSpeech, isDeleted: false },
    });
    if (exist) throw new BadRequestException('Từ vựng với từ loại này đã tồn tại');

    const audioIds = dto.skipAudio
      ? { uk: dto.audioUkAssetId, us: dto.audioUsAssetId }
      : await this.attachTtsIfMissing(dto.headword, user, {
          uk: dto.audioUkAssetId,
          us: dto.audioUsAssetId,
        });

    const word = this.vocabularyRepo.create({
      id: uuidv4(),
      headword: dto.headword.trim(),
      normalizedWord,
      partOfSpeech: dto.partOfSpeech.trim(),
      definitionEn: dto.definitionEn.trim(),
      meaningVi: dto.meaningVi.trim(),
      ipaUk: dto.ipaUk,
      ipaUs: dto.ipaUs,
      frequencyLevel: dto.frequencyLevel || 1,
      audioUkAssetId: audioIds.uk,
      audioUsAssetId: audioIds.us,
      cefrLevel: dto.cefrLevel || enumData.CEFR_LEVEL.B1.code,
      status: dto.status || enumData.CONTENT_REVIEW_STATUS.APPROVED.code,
      createdBy: user.id,
    });
    await this.vocabularyRepo.save(word);
    await this.persistNested(word.id, {
      ...dto,
      examples: dto.examples || [],
      collocations: dto.collocations || [],
      relations: dto.relations || [],
      topicIds: dto.topicIds || [],
      examTypeIds: dto.examTypeIds || [],
    });
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'VocabularyEntity',
      word.id,
      `Tạo từ: ${word.headword}`,
    );
    return this.findWord(word.id);
  }

  async updateWord(id: string, dto: UpdateVocabularyDto, user: UserDto) {
    const word = await this.vocabularyRepo.findOne({ where: { id, isDeleted: false } });
    if (!word) throw new NotFoundException('Không tìm thấy từ vựng');

    const normalizedWord = normalizeHeadword(dto.headword);
    const audioIds = await this.attachTtsIfMissing(dto.headword, user, {
      uk: dto.audioUkAssetId || word.audioUkAssetId,
      us: dto.audioUsAssetId || word.audioUsAssetId,
    });
    Object.assign(word, {
      headword: dto.headword.trim(),
      normalizedWord,
      partOfSpeech: dto.partOfSpeech.trim(),
      definitionEn: dto.definitionEn.trim(),
      meaningVi: dto.meaningVi.trim(),
      ipaUk: dto.ipaUk,
      ipaUs: dto.ipaUs,
      frequencyLevel: dto.frequencyLevel ?? word.frequencyLevel,
      audioUkAssetId: audioIds.uk,
      audioUsAssetId: audioIds.us,
      cefrLevel: dto.cefrLevel || word.cefrLevel,
      status: dto.status || word.status,
      updatedBy: user.id,
    });
    await this.vocabularyRepo.save(word);
    await this.persistNested(word.id, dto);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'VocabularyEntity',
      word.id,
      `Cập nhật từ: ${word.headword}`,
    );
    return this.findWord(word.id);
  }

  async deactivateWord(id: string, user: UserDto) {
    const word = await this.vocabularyRepo.findOne({ where: { id, isDeleted: false } });
    if (!word) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.vocabulary'));
    }
    word.isDeleted = true;
    word.deletedAt = new Date();
    word.updatedBy = user.id;
    await this.vocabularyRepo.save(word);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'VocabularyEntity', word.id, `Ngưng từ: ${word.headword}`);
    return { message: this.i18n.commonTranslate('update_success'), data: { id } };
  }

  async activateWord(id: string, user: UserDto) {
    const word = await this.vocabularyRepo.findOne({ where: { id } });
    if (!word) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.vocabulary'));
    }
    word.isDeleted = false;
    word.deletedAt = null;
    word.updatedBy = user.id;
    await this.vocabularyRepo.save(word);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'VocabularyEntity', word.id, `Kích hoạt từ: ${word.headword}`);
    return this.findWord(word.id);
  }

  async paginationDecks(body: PaginationDto<FilterDeckDto>, onlyPublic = false) {
    const { skip = 0, take = 20, where = {} as FilterDeckDto } = body;
    const qb = this.vocabularyDeckRepo
      .createQueryBuilder('deck')
      .leftJoinAndSelect('deck.examType', 'examType')
      .where('deck.isDeleted = :isDeleted', { isDeleted: where.isDeleted ?? false });

    if (onlyPublic) {
      qb.andWhere('deck.visibility = :visibility', { visibility: enumData.VISIBILITY.PUBLIC.code });
      qb.andWhere('deck.ownerType = :ownerType', {
        ownerType: enumData.VOCAB_DECK_OWNER_TYPE.SYSTEM.code,
      });
    } else if (where.visibility) {
      qb.andWhere('deck.visibility = :visibility', { visibility: where.visibility });
    }
    if (where.keyword) {
      qb.andWhere('(LOWER(deck.title) LIKE :kw OR LOWER(deck.slug) LIKE :kw)', {
        kw: `%${where.keyword.trim().toLowerCase()}%`,
      });
    }
    if (where.level) qb.andWhere('deck.level = :level', { level: where.level });
    if (where.examTypeId)
      qb.andWhere('deck.examTypeId = :examTypeId', { examTypeId: where.examTypeId });
    if (where.exam) {
      qb.andWhere('(LOWER(deck.title) LIKE :exam OR LOWER(deck.slug) LIKE :exam)', {
        exam: `%${where.exam.trim().toLowerCase()}%`,
      });
    }

    const [rows, total] = await qb
      .orderBy('deck.createdAt', 'DESC')
      .skip(skip)
      .take(take || 20)
      .getManyAndCount();
    return { data: rows.map(item => buildPublicDeck(item)), total };
  }

  async findDeck(id: string) {
    const deck = await this.vocabularyDeckRepo.findOne({
      where: { id, isDeleted: false },
      relations: {
        examType: true,
        items: { vocabulary: this.wordRelations() as any },
      },
    });
    if (!deck) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.vocabulary_deck'));
    }
    const words = (deck.items || [])
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(item =>
        item.vocabulary && !item.vocabulary.isDeleted
          ? buildPublicWord(item.vocabulary, { note: item.note, sortOrder: item.sortOrder })
          : null,
      )
      .filter(Boolean);
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: { ...buildPublicDeck(deck), words },
    };
  }

  async findDeckBySlug(slug: string, userId?: string) {
    const deck = await this.vocabularyDeckRepo.findOne({
      where: { slug, isDeleted: false },
      relations: {
        examType: true,
        items: { vocabulary: this.wordRelations() as any },
      },
    });
    if (!deck) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.vocabulary_deck'));
    }
    const words = (deck.items || [])
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(item => item.vocabulary)
      .filter((item): item is VocabularyEntity => Boolean(item) && !item.isDeleted);

    let progress = summarizeProgress(words.length, []);
    if (userId && words.length) {
      const states = await this.userVocabularyStateRepo.find({
        where: { userId, vocabularyId: In(words.map(item => item.id)), isDeleted: false },
      });
      progress = summarizeProgress(words.length, states);
    }

    return {
      message: this.i18n.commonTranslate('find_success'),
      data: {
        ...buildPublicDeck(deck, { progress }),
        words: words.map(item => buildPublicWord(item)),
      },
    };
  }

  async createDeck(dto: CreateDeckDto, user: UserDto) {
    const slug = await this.uniqueSlug(dto.slug || dto.title);
    const deck = this.vocabularyDeckRepo.create({
      id: uuidv4(),
      title: dto.title.trim(),
      slug,
      description: dto.description,
      thumbnailUrl: dto.thumbnailUrl,
      visibility: dto.visibility || enumData.VISIBILITY.PUBLIC.code,
      ownerType: dto.ownerType || enumData.VOCAB_DECK_OWNER_TYPE.SYSTEM.code,
      examTypeId: dto.examTypeId,
      level: dto.level,
      itemCount: 0,
      createdBy: user.id,
    });
    await this.vocabularyDeckRepo.save(deck);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'VocabularyDeckEntity',
      deck.id,
      `Tạo deck: ${deck.title}`,
    );
    return this.findDeck(deck.id);
  }

  async updateDeck(id: string, dto: UpdateDeckDto, user: UserDto) {
    const deck = await this.vocabularyDeckRepo.findOne({ where: { id, isDeleted: false } });
    if (!deck) throw new NotFoundException('Không tìm thấy bộ từ');
    if (dto.slug && dto.slug !== deck.slug) {
      deck.slug = await this.uniqueSlug(dto.slug, deck.id);
    }
    Object.assign(deck, {
      title: dto.title?.trim() || deck.title,
      description: dto.description,
      thumbnailUrl: dto.thumbnailUrl,
      visibility: dto.visibility || deck.visibility,
      ownerType: dto.ownerType || deck.ownerType,
      examTypeId: dto.examTypeId || null,
      level: dto.level,
      updatedBy: user.id,
    });
    await this.vocabularyDeckRepo.save(deck);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'VocabularyDeckEntity',
      deck.id,
      `Cập nhật deck: ${deck.title}`,
    );
    return this.findDeck(deck.id);
  }

  async deactivateDeck(id: string, user: UserDto) {
    const deck = await this.vocabularyDeckRepo.findOne({ where: { id, isDeleted: false } });
    if (!deck) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.vocabulary_deck'));
    }
    deck.isDeleted = true;
    deck.deletedAt = new Date();
    deck.updatedBy = user.id;
    await this.vocabularyDeckRepo.save(deck);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'VocabularyDeckEntity',
      deck.id,
      `Ngưng bộ thẻ: ${deck.title}`,
    );
    return { message: this.i18n.commonTranslate('update_success'), data: { id } };
  }

  async activateDeck(id: string, user: UserDto) {
    const deck = await this.vocabularyDeckRepo.findOne({ where: { id } });
    if (!deck) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.vocabulary_deck'));
    }
    deck.isDeleted = false;
    deck.deletedAt = null;
    deck.updatedBy = user.id;
    await this.vocabularyDeckRepo.save(deck);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'VocabularyDeckEntity',
      deck.id,
      `Kích hoạt bộ thẻ: ${deck.title}`,
    );
    return this.findDeck(deck.id);
  }

  async replaceDeckItems(id: string, dto: ReplaceDeckItemsDto, user: UserDto) {
    const deck = await this.vocabularyDeckRepo.findOne({ where: { id, isDeleted: false } });
    if (!deck) throw new NotFoundException('Không tìm thấy bộ từ');
    await this.vocabularyDeckItemRepo.delete({ deckId: id });
    const items = (dto.items || []).map((item, index) =>
      this.vocabularyDeckItemRepo.create({
        id: uuidv4(),
        deckId: id,
        vocabularyId: item.vocabularyId,
        sortOrder: item.sortOrder ?? index,
        note: item.note,
      }),
    );
    if (items.length) await this.vocabularyDeckItemRepo.save(items);
    deck.itemCount = items.length;
    deck.updatedBy = user.id;
    await this.vocabularyDeckRepo.save(deck);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'VocabularyDeckEntity',
      deck.id,
      `Cập nhật từ trong deck: ${deck.title}`,
      {
        itemCount: items.length,
      },
    );
    return this.findDeck(id);
  }

  private async uniqueSlug(raw: string, excludeId?: string) {
    const base = slugify(raw) || `deck-${Date.now()}`;
    let slug = base;
    let i = 1;
    while (true) {
      const exist = await this.vocabularyDeckRepo.findOne({ where: { slug, isDeleted: false } });
      if (!exist || exist.id === excludeId) return slug;
      slug = `${base}-${i++}`;
    }
  }

  async publicDeckPagination(body: PaginationDto<FilterDeckDto>, userId?: string) {
    const result = await this.paginationDecks(body, true);
    if (!userId || !result.data.length) return result;

    const deckIds = result.data.map(item => item.id);
    const items = await this.vocabularyDeckItemRepo.find({
      where: { deckId: In(deckIds), isDeleted: false },
    });
    const vocabIds = [...new Set(items.map(item => item.vocabularyId))];
    const states = vocabIds.length
      ? await this.userVocabularyStateRepo.find({
          where: { userId, vocabularyId: In(vocabIds), isDeleted: false },
        })
      : [];

    const byDeck = new Map<string, string[]>();
    for (const item of items) {
      const list = byDeck.get(item.deckId) || [];
      list.push(item.vocabularyId);
      byDeck.set(item.deckId, list);
    }

    return {
      ...result,
      data: result.data.map(deck => {
        const ids = byDeck.get(deck.id) || [];
        const deckStates = states.filter(state => ids.includes(state.vocabularyId));
        return { ...deck, progress: summarizeProgress(ids.length, deckStates) };
      }),
    };
  }

  async myStats(userId: string) {
    const states = await this.userVocabularyStateRepo.find({
      where: { userId, isDeleted: false },
    });
    const sessions = await this.vocabularyReviewSessionRepo.find({
      where: {
        userId,
        isDeleted: false,
        status: enumData.REVIEW_SESSION_STATUS.COMPLETED.code,
      },
    });
    const now = new Date();
    const dueTodayCount = states.filter(
      item => new Date(item.nextReviewAt).getTime() <= now.getTime(),
    ).length;
    const newCount = states.filter(item => item.state === enumData.VOCAB_SRS_STATE.NEW.code).length;
    const learningCount = states.filter(
      item => item.state === enumData.VOCAB_SRS_STATE.LEARNING.code,
    ).length;
    const reviewCount = states.filter(
      item => item.state === enumData.VOCAB_SRS_STATE.REVIEW.code,
    ).length;
    const masteredCount = states.filter(
      item => item.state === enumData.VOCAB_SRS_STATE.MASTERED.code,
    ).length;
    const totalCards = states.length;
    const totalReviewed = states.reduce((sum, item) => sum + (item.repetitionCount || 0), 0);
    const sessionAnswers = sessions.reduce((sum, item) => sum + (item.cardsReviewed || 0), 0);
    const sessionCorrect = sessions.reduce((sum, item) => sum + (item.cardsCorrect || 0), 0);
    const accuracy = sessionAnswers ? Math.round((sessionCorrect / sessionAnswers) * 100) : 0;

    return {
      message: this.i18n.commonTranslate('find_success'),
      data: {
        dueTodayCount,
        learningWords: states.filter(item => item.state !== enumData.VOCAB_SRS_STATE.MASTERED.code)
          .length,
        totalMasteredWords: masteredCount,
        totalReviewed,
        totalCards,
        totalSessions: sessions.length,
        newCount,
        learningCount,
        reviewCount,
        masteredCount,
        accuracy,
      },
    };
  }

  async startSession(dto: StartSessionDto, user: UserDto) {
    const mode = (dto.mode || '').toUpperCase();
    const allowedModes: string[] = [
      enumData.VOCAB_STUDY_MODE.FLASHCARD.code,
      enumData.VOCAB_STUDY_MODE.QUIZ.code,
    ];
    if (!allowedModes.includes(mode)) {
      throw new BadRequestException('Chế độ học không hợp lệ');
    }

    const limit = dto.limit || 12;
    let deck: VocabularyDeckEntity | null = null;
    let words: VocabularyEntity[] = [];

    if (dto.deckId) {
      deck = await this.vocabularyDeckRepo.findOne({
        where: { id: dto.deckId, isDeleted: false },
        relations: { examType: true, items: { vocabulary: this.wordRelations() as any } },
      });
      if (!deck) {
        throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.vocabulary_deck'));
      }
      words = (deck.items || [])
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(item => item.vocabulary)
        .filter((item): item is VocabularyEntity => Boolean(item) && !item.isDeleted);
      if (!words.length) throw new BadRequestException('Bộ từ chưa có từ vựng');
    } else {
      words = await this.loadDueMixWords(user.id, limit);
      if (!words.length) throw new BadRequestException('Chưa có thẻ đến hạn. Hãy học một bộ từ trước.');
    }

    const states = await this.userVocabularyStateRepo.find({
      where: { userId: user.id, vocabularyId: In(words.map(item => item.id)), isDeleted: false },
    });
    const queue = pickStudyQueue(words, states, limit);

    const session = this.vocabularyReviewSessionRepo.create({
      id: uuidv4(),
      userId: user.id,
      deckId: deck?.id,
      status: enumData.REVIEW_SESSION_STATUS.IN_PROGRESS.code,
      cardsDue: queue.length,
      cardsReviewed: 0,
      cardsCorrect: 0,
      startedAt: new Date(),
    });
    await this.vocabularyReviewSessionRepo.save(session);

    const cards = queue.map(word => {
      const base = buildPublicWord(word);
      if (mode === enumData.VOCAB_STUDY_MODE.QUIZ.code) {
        return { ...base, quiz: buildQuizQuestion(word, words) };
      }
      return base;
    });

    return {
      message: 'Bắt đầu phiên học',
      data: {
        sessionId: session.id,
        mode,
        deck: deck
          ? buildPublicDeck(deck)
          : {
              id: 'due-review',
              title: 'Ôn đến hạn',
              slug: 'due-review',
              description: 'Thẻ đến hạn từ mọi bộ từ đã học',
              thumbnailUrl: null,
              visibility: enumData.VISIBILITY.PUBLIC.code,
              ownerType: enumData.VOCAB_DECK_OWNER_TYPE.SYSTEM.code,
              examTypeId: null,
              examType: null,
              level: null,
              itemCount: queue.length,
              isDeleted: false,
              estimatedMinutes: Math.max(3, Math.ceil(queue.length * 0.4)),
            },
        cards,
        total: cards.length,
      },
    };
  }

  private async loadDueMixWords(userId: string, limit: number) {
    const dueStates = await this.userVocabularyStateRepo.find({
      where: { userId, isDeleted: false, nextReviewAt: LessThanOrEqual(new Date()) },
      order: { nextReviewAt: 'ASC' },
      take: limit,
    });
    const dueIds = dueStates.map(item => item.vocabularyId);
    let words = dueIds.length
      ? await this.vocabularyRepo.find({
          where: { id: In(dueIds), isDeleted: false },
          relations: this.wordRelations(),
        })
      : [];

    if (words.length >= limit) return words.slice(0, limit);

    const extra = await this.vocabularyRepo
      .createQueryBuilder('word')
      .innerJoin('vocabulary_deck_items', 'item', 'item.vocabularyId = word.id AND item."isDeleted" = false')
      .innerJoin(
        'vocabulary_decks',
        'deck',
        'deck.id = item.deckId AND deck."isDeleted" = false AND deck.visibility = :pub AND deck."ownerType" = :owner',
        {
          pub: enumData.VISIBILITY.PUBLIC.code,
          owner: enumData.VOCAB_DECK_OWNER_TYPE.SYSTEM.code,
        },
      )
      .leftJoinAndSelect('word.examples', 'examples')
      .leftJoinAndSelect('word.collocations', 'collocations')
      .leftJoinAndSelect('word.audioUkAsset', 'audioUkAsset')
      .leftJoinAndSelect('word.audioUsAsset', 'audioUsAsset')
      .where('word.isDeleted = false')
      .andWhere(dueIds.length ? 'word.id NOT IN (:...dueIds)' : '1=1', { dueIds: dueIds.length ? dueIds : ['00000000-0000-0000-0000-000000000000'] })
      .orderBy('word.createdAt', 'DESC')
      .take(limit - words.length)
      .getMany();

    return [...words, ...extra];
  }

  async answerSession(sessionId: string, dto: AnswerSessionDto, user: UserDto) {
    const session = await this.vocabularyReviewSessionRepo.findOne({
      where: { id: sessionId, userId: user.id, isDeleted: false },
    });
    if (!session) throw new NotFoundException('Không tìm thấy phiên học');
    if (session.status !== enumData.REVIEW_SESSION_STATUS.IN_PROGRESS.code) {
      throw new BadRequestException('Phiên học đã kết thúc');
    }

    const word = await this.vocabularyRepo.findOne({
      where: { id: dto.vocabularyId, isDeleted: false },
      relations: this.wordRelations(),
    });
    if (!word) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.vocabulary'));
    }

    let rating = dto.rating ? normalizeRating(dto.rating) : '';
    let correct = false;
    if (dto.optionId) {
      correct = dto.optionId === word.id;
      rating = correct ? enumData.FLASHCARD_RATING.GOOD.code : enumData.FLASHCARD_RATING.AGAIN.code;
    } else {
      if (!rating) throw new BadRequestException('Thiếu đánh giá hoặc đáp án');
      correct = isCorrectRating(rating);
    }

    let state = await this.userVocabularyStateRepo.findOne({
      where: { userId: user.id, vocabularyId: word.id, isDeleted: false },
    });
    const oldIntervalDays = state?.intervalDays || 0;
    const snapshot = applySm2Rating(state, rating);
    if (!state) {
      state = this.userVocabularyStateRepo.create({
        id: uuidv4(),
        userId: user.id,
        vocabularyId: word.id,
        ...snapshot,
      });
    } else {
      Object.assign(state, snapshot);
    }
    await this.userVocabularyStateRepo.save(state);

    await this.vocabularyReviewLogRepo.save(
      this.vocabularyReviewLogRepo.create({
        id: uuidv4(),
        userId: user.id,
        vocabularyId: word.id,
        rating,
        responseTimeMs: dto.responseTimeMs || 0,
        oldIntervalDays,
        newIntervalDays: snapshot.intervalDays,
        reviewedAt: new Date(),
      }),
    );

    session.cardsReviewed += 1;
    if (correct) session.cardsCorrect += 1;
    await this.vocabularyReviewSessionRepo.save(session);

    return {
      message: correct ? 'Chính xác' : 'Cần ôn lại',
      data: {
        correct,
        rating,
        explanation: {
          headword: word.headword,
          meaningVi: word.meaningVi,
          definitionEn: word.definitionEn,
          exampleEn: word.examples?.[0]?.sentence || null,
          exampleVi: word.examples?.[0]?.translation || null,
          collocations: (word.collocations || []).map(item => ({
            collocation: item.collocation,
            meaningVi: item.meaningVi,
          })),
        },
        nextReviewAt: snapshot.nextReviewAt,
        state: snapshot.state,
        session: {
          cardsReviewed: session.cardsReviewed,
          cardsCorrect: session.cardsCorrect,
          cardsDue: session.cardsDue,
        },
      },
    };
  }

  async completeSession(sessionId: string, user: UserDto) {
    const session = await this.vocabularyReviewSessionRepo.findOne({
      where: { id: sessionId, userId: user.id, isDeleted: false },
    });
    if (!session) throw new NotFoundException('Không tìm thấy phiên học');
    session.status = enumData.REVIEW_SESSION_STATUS.COMPLETED.code;
    session.endedAt = new Date();
    await this.vocabularyReviewSessionRepo.save(session);
    return {
      message: 'Hoàn thành phiên học',
      data: {
        sessionId: session.id,
        cardsReviewed: session.cardsReviewed,
        cardsCorrect: session.cardsCorrect,
        cardsDue: session.cardsDue,
        accuracy: session.cardsReviewed
          ? Math.round((session.cardsCorrect / session.cardsReviewed) * 100)
          : 0,
      },
    };
  }
}
