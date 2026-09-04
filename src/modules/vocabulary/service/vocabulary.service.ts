import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { In, LessThanOrEqual } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DefTransaction } from '~/common/core/decorator';
import { enumData } from '~/common/enums/base.enum';
import {
  createdEntityId,
  excelExportTake,
  failImportRow,
  okImportRow,
  optionalText,
  requireText,
  runBulkImport,
  summarizeImport,
  type BulkImportRowResult,
} from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import { VocabularyDeckEntity, VocabularyEntity } from '~/entities';
import {
  ContentTaxonomyRepo,
  ExamTypeRepo,
  MediaAssetRepo,
  StudySessionItemRepo,
  StudySessionRepo,
  TaxonomyRepo,
  UserVocabularyStateRepo,
  VocabularyDeckItemRepo,
  VocabularyDeckRepo,
  VocabularyRelationRepo,
  VocabularyRepo,
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
  ImportVocabularyDto,
  ImportVocabularyItemDto,
  ReplaceDeckItemsDto,
  StartSessionDto,
  SyncWordsAudioDto,
  UpdateDeckDto,
  UpdateVocabularyDto,
} from '../dto';
import {
  applySm2Rating,
  buildPublicDeck,
  buildPublicWord,
  buildQuizQuestion,
  fetchTtsMp3,
  isCorrectRating,
  normalizeHeadword,
  normalizeRating,
  pickStudyQueue,
  slugify,
  summarizeProgress,
} from '../helpers';

const VOCAB_ENTITY_TYPE = 'VocabularyEntity';
const SESSION_TARGET_VOCABULARY = 'VOCABULARY';

@Injectable()
export class VocabularyService {
  constructor(
    private readonly vocabularyRepo: VocabularyRepo,
    private readonly vocabularyRelationRepo: VocabularyRelationRepo,
    private readonly vocabularyDeckRepo: VocabularyDeckRepo,
    private readonly vocabularyDeckItemRepo: VocabularyDeckItemRepo,
    private readonly userVocabularyStateRepo: UserVocabularyStateRepo,
    private readonly studySessionRepo: StudySessionRepo,
    private readonly studySessionItemRepo: StudySessionItemRepo,
    private readonly examTypeRepo: ExamTypeRepo,
    private readonly mediaAssetRepo: MediaAssetRepo,
    private readonly contentTaxonomyRepo: ContentTaxonomyRepo,
    private readonly taxonomyRepo: TaxonomyRepo,
    private readonly uploadFileService: UploadFileService,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

  private wordRelations() {
    return { relations: { relatedVocabulary: true } } as const;
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

  private mapExamplesJson(dto: Pick<CreateVocabularyDto, 'examples' | 'examplesJson'>) {
    const raw = dto.examplesJson || dto.examples;
    if (!raw) return undefined;
    return raw
      .filter(item => item?.sentence?.trim() && item?.translation?.trim())
      .map((item, index) => ({
        sentence: item.sentence.trim(),
        translation: item.translation.trim(),
        sortOrder: item.sortOrder ?? index,
      }));
  }

  private mapCollocationsJson(dto: Pick<CreateVocabularyDto, 'collocations' | 'collocationsJson'>) {
    const raw = dto.collocationsJson || dto.collocations;
    if (!raw) return undefined;
    return raw
      .filter(item => item?.collocation?.trim())
      .map((item, index) => ({
        collocation: item.collocation.trim(),
        meaningVi: item.meaningVi,
        exampleSentence: item.exampleSentence,
        sortOrder: item.sortOrder ?? index,
      }));
  }

  private async replaceRelations(vocabularyId: string, items?: CreateVocabularyDto['relations']) {
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
    await this.contentTaxonomyRepo.delete({
      entityType: VOCAB_ENTITY_TYPE,
      entityId: vocabularyId,
    });
    const ids = [...new Set((topicIds || []).filter(Boolean))];
    if (!ids.length) return;
    const valid = await this.taxonomyRepo.find({
      where: { id: In(ids), isDeleted: false },
      select: { id: true },
    });
    if (!valid.length) return;
    await this.contentTaxonomyRepo.save(
      valid.map(row =>
        this.contentTaxonomyRepo.create({
          id: uuidv4(),
          taxonomyId: row.id,
          entityType: VOCAB_ENTITY_TYPE,
          entityId: vocabularyId,
        }),
      ),
    );
  }

  private async persistNested(
    vocabularyId: string,
    dto: CreateVocabularyDto | UpdateVocabularyDto,
  ) {
    if (dto.relations) await this.replaceRelations(vocabularyId, dto.relations);
    if (dto.topicIds) await this.replaceTopics(vocabularyId, dto.topicIds);
  }

  private async loadTopicIds(wordIds: string[]) {
    const map = new Map<string, string[]>();
    if (!wordIds.length) return map;
    const rows = await this.contentTaxonomyRepo.find({
      where: { entityType: VOCAB_ENTITY_TYPE, entityId: In(wordIds), isDeleted: false },
    });
    for (const row of rows) {
      const list = map.get(row.entityId) || [];
      list.push(row.taxonomyId);
      map.set(row.entityId, list);
    }
    return map;
  }

  private async loadWordTopics(wordIds: string[]) {
    const map = new Map<string, { id: string; name: string; nameEn?: string | null; slug?: string }[]>();
    if (!wordIds.length) return map;
    const links = await this.contentTaxonomyRepo.find({
      where: { entityType: VOCAB_ENTITY_TYPE, entityId: In(wordIds), isDeleted: false },
    });
    if (!links.length) return map;
    const taxonomyIds = [...new Set(links.map(l => l.taxonomyId))];
    const taxonomies = await this.taxonomyRepo.find({
      where: { id: In(taxonomyIds), isDeleted: false },
    });
    const taxMap = new Map(
      taxonomies.map(t => [t.id, { id: t.id, name: t.name, nameEn: t.nameEn || null, slug: t.slug }]),
    );
    for (const link of links) {
      const tax = taxMap.get(link.taxonomyId);
      if (tax) {
        const list = map.get(link.entityId) || [];
        list.push(tax);
        map.set(link.entityId, list);
      }
    }
    return map;
  }

  private toPublicWord(word: VocabularyEntity, extra?: Record<string, unknown>) {
    return buildPublicWord(word, extra);
  }

  async paginationWords(body: PaginationDto<FilterVocabularyDto>) {
    const { skip = 0, take = 20, where = {} as FilterVocabularyDto } = body;
    const qb = this.vocabularyRepo
      .createQueryBuilder('word')
      .leftJoinAndSelect('word.relations', 'relations')
      .leftJoinAndSelect('relations.relatedVocabulary', 'relatedVocabulary')
      .where('word.isDeleted = :isDeleted', { isDeleted: where.isDeleted ?? false });

    if (where.keyword) {
      qb.andWhere(
        '(LOWER(word.headword) LIKE :kw OR LOWER(word.meaningVi) LIKE :kw OR LOWER(word.definitionVi) LIKE :kw OR LOWER(word.definitionEn) LIKE :kw)',
        { kw: `%${where.keyword.trim().toLowerCase()}%` },
      );
    }
    if (where.cefrLevel) qb.andWhere('word.cefrLevel = :cefrLevel', { cefrLevel: where.cefrLevel });
    if (where.partOfSpeech) qb.andWhere('word.partOfSpeech = :pos', { pos: where.partOfSpeech });
    if (where.topicId) {
      qb.innerJoin(
        'content_taxonomies',
        'ct',
        'ct."entityId" = word.id AND ct."entityType" = :entityType AND ct."taxonomyId" = :topicId AND ct."isDeleted" = false',
        { entityType: VOCAB_ENTITY_TYPE, topicId: where.topicId },
      );
    }

    const [rows, total] = await qb
      .orderBy('word.createdAt', 'DESC')
      .skip(skip)
      .take(take || 20)
      .getManyAndCount();
    const topicMap = await this.loadTopicIds(rows.map(item => item.id as string));
    return {
      data: rows.map(item =>
        this.toPublicWord(item, { topicIds: topicMap.get(item.id as string) || [] }),
      ),
      total,
    };
  }

  async paginationPublicWords(body: PaginationDto<FilterVocabularyDto>) {
    return this.paginationWords({
      skip: body.skip,
      take: body.take,
      where: {
        ...(body.where || {}),
        isDeleted: false,
      },
    });
  }

  async myNotebook(userId: string, body: PaginationDto<FilterNotebookDto>) {
    const { skip = 0, take = 20, where = {} as FilterNotebookDto } = body;
    const qb = this.userVocabularyStateRepo
      .createQueryBuilder('state')
      .leftJoinAndSelect('state.vocabulary', 'word')
      .leftJoinAndSelect('word.relations', 'relations')
      .leftJoinAndSelect('relations.relatedVocabulary', 'relatedVocabulary')
      .where('state.userId = :userId', { userId })
      .andWhere('state.isDeleted = false')
      .andWhere('state.isSaved = true')
      .andWhere('word.isDeleted = false');

    if (where.keyword) {
      qb.andWhere(
        '(LOWER(word.headword) LIKE :kw OR LOWER(word.meaningVi) LIKE :kw OR LOWER(word.definitionVi) LIKE :kw OR LOWER(word.definitionEn) LIKE :kw)',
        { kw: `%${where.keyword.trim().toLowerCase()}%` },
      );
    }
    if (where.state) {
      qb.andWhere('state.srsState = :srsState', { srsState: where.state });
    }
    if (where.dueOnly) {
      qb.andWhere('state.nextReviewAt IS NOT NULL AND state.nextReviewAt <= :now', {
        now: new Date(),
      });
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
          ...this.toPublicWord(item.vocabulary),
          srsState: item.srsState,
          state: item.srsState,
          nextReviewAt: item.nextReviewAt,
          intervalDays: item.intervalDays,
          repetitionCount: item.repetitionCount,
          isSaved: item.isSaved,
          noteText: item.noteText || null,
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
    const topicMap = await this.loadTopicIds([id]);
    return {
      message: this.i18n.commonTranslate('find_success'),
      data: this.toPublicWord(word, { topicIds: topicMap.get(id) || [] }),
    };
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
    const rows = await this.taxonomyRepo.find({
      where: {
        isDeleted: false,
        kind: enumData.TAXONOMY_KIND.TOPIC.code,
      },
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

  private async saveTtsAsset(buffer: Buffer, headword: string, accent: 'uk' | 'us', user: UserDto) {
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

  private async resolveAudioUrl(url?: string, assetId?: string) {
    if (url) return url;
    if (!assetId) return undefined;
    const asset = await this.mediaAssetRepo.findOne({ where: { id: assetId, isDeleted: false } });
    return asset?.publicUrl || undefined;
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

  async syncAllWordsAudio(dto: SyncWordsAudioDto = {}, user: UserDto) {
    const force = Boolean(dto?.force);
    const words = await this.vocabularyRepo.find({
      where: { isDeleted: false },
      order: { createdAt: 'ASC' },
    });

    let syncedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors: { wordId: string; headword: string; error: string }[] = [];

    const targetWords = force ? words : words.filter(w => !w.audioUkUrl || !w.audioUsUrl);
    skippedCount = words.length - targetWords.length;

    const batchSize = 3;
    for (let i = 0; i < targetWords.length; i += batchSize) {
      const batch = targetWords.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async word => {
          try {
            let audioUkUrl = word.audioUkUrl;
            let audioUsUrl = word.audioUsUrl;

            if (force || !audioUkUrl) {
              const ukBuffer = await fetchTtsMp3(word.headword, 'uk');
              const ukAsset = await this.saveTtsAsset(ukBuffer, word.headword, 'uk', user);
              audioUkUrl = ukAsset.publicUrl;
            }

            if (force || !audioUsUrl) {
              const usBuffer = await fetchTtsMp3(word.headword, 'us');
              const usAsset = await this.saveTtsAsset(usBuffer, word.headword, 'us', user);
              audioUsUrl = usAsset.publicUrl;
            }

            word.audioUkUrl = audioUkUrl;
            word.audioUsUrl = audioUsUrl;
            word.updatedBy = user.id;
            await this.vocabularyRepo.save(word);
            syncedCount += 1;
          } catch (err: any) {
            failedCount += 1;
            errors.push({
              wordId: word.id as string,
              headword: word.headword,
              error: err?.message || 'TTS failed',
            });
          }
        }),
      );
    }

    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'VocabularyEntity',
      'bulk-tts-sync',
      `Đồng bộ audio cho ${syncedCount}/${words.length} từ vựng (Bỏ qua: ${skippedCount}, Lỗi: ${failedCount})`,
    );

    return {
      message: `Đã đồng bộ audio thành công cho ${syncedCount} từ vựng (Đã có sẵn: ${skippedCount}, Thất bại: ${failedCount})`,
      data: {
        total: words.length,
        synced: syncedCount,
        skipped: skippedCount,
        failed: failedCount,
        errors: errors.slice(0, 20),
      },
    };
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
        uk: existing.uk || generated.uk.publicUrl,
        us: existing.us || generated.us.publicUrl,
      };
    } catch (err) {
      console.error('Vocabulary TTS skipped:', err);
      return existing;
    }
  }

  @DefTransaction()
  async createWord(dto: CreateVocabularyDto, user: UserDto) {
    const normalizedWord = normalizeHeadword(dto.headword);
    const exist = await this.vocabularyRepo.findOne({
      where: { normalizedWord, partOfSpeech: dto.partOfSpeech, isDeleted: false },
    });
    if (exist) throw new BusinessException(this.i18n.commonTranslate('code_existing'));

    const resolvedUk = await this.resolveAudioUrl(dto.audioUkUrl, dto.audioUkAssetId);
    const resolvedUs = await this.resolveAudioUrl(dto.audioUsUrl, dto.audioUsAssetId);
    const audioUrls = dto.skipAudio
      ? { uk: resolvedUk, us: resolvedUs }
      : await this.attachTtsIfMissing(dto.headword, user, { uk: resolvedUk, us: resolvedUs });

    const word = this.vocabularyRepo.create({
      id: uuidv4(),
      headword: dto.headword.trim(),
      normalizedWord,
      partOfSpeech: dto.partOfSpeech.trim(),
      definitionVi: dto.definitionVi?.trim() || undefined,
      definitionEn: dto.definitionEn.trim(),
      meaningVi: dto.meaningVi.trim(),
      ipaUk: dto.ipaUk,
      ipaUs: dto.ipaUs,
      frequencyLevel: dto.frequencyLevel || 1,
      audioUkUrl: audioUrls.uk,
      audioUsUrl: audioUrls.us,
      imageUrl: dto.imageUrl?.trim() || undefined,
      examplesJson: this.mapExamplesJson(dto) || [],
      collocationsJson: this.mapCollocationsJson(dto) || [],
      cefrLevel: dto.cefrLevel || enumData.CEFR_LEVEL.B1.code,
      createdBy: user.id,
    });
    await this.vocabularyRepo.save(word);
    await this.persistNested(word.id as string, {
      ...dto,
      relations: dto.relations || [],
      topicIds: dto.topicIds || [],
    });
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'VocabularyEntity',
      word.id as string,
      `Tạo từ: ${word.headword}`,
    );
    return this.findWord(word.id as string);
  }

  @DefTransaction()
  async importWords(dto: ImportVocabularyDto, user: UserDto) {
    const items = dto.items || [];
    if (dto.deckId) {
      const deck = await this.vocabularyDeckRepo.findOne({
        where: { id: dto.deckId, isDeleted: false },
      });
      if (!deck) throw new NotFoundException('Không tìm thấy bộ từ');
    }

    const results: BulkImportRowResult[] = [];
    const pending: {
      rowIndex: number;
      item: ImportVocabularyItemDto;
      key: string;
      word: VocabularyEntity;
    }[] = [];
    const seen = new Map<string, number>();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowIndex = Number(item.rowIndex || i + 1);
      const headword = String(item.headword || '').trim();
      const partOfSpeech = String(item.partOfSpeech || '').trim();
      const meaningVi = String(item.meaningVi || '').trim();
      const definitionVi = String(item.definitionVi || '').trim();
      const definitionEn = String(item.definitionEn || '').trim();

      if (!headword || !partOfSpeech || !meaningVi || !definitionEn) {
        results.push(
          failImportRow(rowIndex, 'Thiếu Headword, Từ loại, Nghĩa tiếng Việt hoặc Nghĩa tiếng Anh'),
        );
        continue;
      }
      if (headword.length > 100) {
        results.push(failImportRow(rowIndex, 'Headword tối đa 100 ký tự'));
        continue;
      }

      const normalizedWord = normalizeHeadword(headword);
      const key = `${normalizedWord}::${partOfSpeech}`;
      if (seen.has(key)) {
        results.push(failImportRow(rowIndex, `Trùng với dòng ${seen.get(key)} trong file`));
        continue;
      }
      seen.set(key, rowIndex);

      const frequency = Number(item.frequencyLevel || 1);
      pending.push({
        rowIndex,
        item,
        key,
        word: this.vocabularyRepo.create({
          id: uuidv4(),
          headword,
          normalizedWord,
          partOfSpeech,
          definitionVi: definitionVi || undefined,
          definitionEn,
          meaningVi,
          ipaUk: item.ipaUk?.trim() || undefined,
          ipaUs: item.ipaUs?.trim() || undefined,
          frequencyLevel: Number.isFinite(frequency) ? Math.min(5, Math.max(1, frequency)) : 1,
          cefrLevel: item.cefrLevel?.trim() || enumData.CEFR_LEVEL.B1.code,
          imageUrl: item.imageUrl?.trim() || undefined,
          examplesJson: (item.examples || [])
            .filter(example => example?.sentence?.trim() && example?.translation?.trim())
            .map((example, index) => ({
              sentence: example.sentence.trim(),
              translation: example.translation.trim(),
              sortOrder: example.sortOrder ?? index,
            })),
          createdBy: user.id,
        }),
      });
    }

    if (pending.length) {
      const existing = await this.vocabularyRepo.find({
        where: {
          isDeleted: false,
          normalizedWord: In([...new Set(pending.map(row => row.word.normalizedWord))]),
        },
        select: { id: true, normalizedWord: true, partOfSpeech: true },
      });
      const existingKeys = new Set(
        existing.map(row => `${row.normalizedWord}::${row.partOfSpeech}`),
      );
      const toInsert = pending.filter(row => {
        if (existingKeys.has(row.key)) {
          results.push(failImportRow(row.rowIndex, 'Từ vựng với từ loại này đã tồn tại'));
          return false;
        }
        return true;
      });

      const topicIds = [
        ...new Set(toInsert.flatMap(row => (row.item.topicIds || []).filter(Boolean))),
      ];
      const validTopicIds = new Set(
        topicIds.length
          ? (await this.taxonomyRepo.find({ where: { id: In(topicIds), isDeleted: false } })).map(
              row => row.id,
            )
          : [],
      );

      if (toInsert.length) {
        await this.vocabularyRepo.save(
          toInsert.map(row => row.word),
          { chunk: 100 },
        );

        const taxonomies = toInsert.flatMap(row =>
          [...new Set(row.item.topicIds || [])]
            .filter(id => validTopicIds.has(id))
            .map(taxonomyId =>
              this.contentTaxonomyRepo.create({
                id: uuidv4(),
                taxonomyId,
                entityType: VOCAB_ENTITY_TYPE,
                entityId: row.word.id,
              }),
            ),
        );

        if (taxonomies.length) await this.contentTaxonomyRepo.save(taxonomies, { chunk: 200 });
        if (dto.deckId) {
          await this.appendDeckItems(
            dto.deckId,
            toInsert.map(row => row.word.id).filter((id): id is string => Boolean(id)),
            user,
          );
        }

        toInsert.forEach(row => {
          results.push(okImportRow(row.rowIndex, 'Tạo thành công', row.word.id));
        });
      }
    }

    const summary = summarizeImport(results);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.IMPORT.code,
      'VocabularyEntity',
      dto.deckId || user.id,
      `Nhập Excel ${summary.success}/${summary.total} từ`,
      {
        total: summary.total,
        success: summary.success,
        failed: summary.failed,
        deckId: dto.deckId,
      },
    );

    return {
      message: `Nhập xong: ${summary.success} thành công, ${summary.failed} thất bại`,
      data: summary,
    };
  }

  private async appendDeckItems(deckId: string, vocabularyIds: string[], user: UserDto) {
    const uniqueIds = [...new Set(vocabularyIds.filter((id): id is string => Boolean(id)))];
    if (!uniqueIds.length) return;

    const deck = await this.vocabularyDeckRepo.findOne({ where: { id: deckId, isDeleted: false } });
    if (!deck) return;

    const existing = await this.vocabularyDeckItemRepo.find({
      where: { deckId, isDeleted: false },
      select: { vocabularyId: true, sortOrder: true },
    });
    const have = new Set(existing.map(item => item.vocabularyId));
    const maxOrder = existing.reduce((max, item) => Math.max(max, item.sortOrder || 0), -1);
    const newItems = uniqueIds
      .filter(id => !have.has(id))
      .map((vocabularyId, index) =>
        this.vocabularyDeckItemRepo.create({
          id: uuidv4(),
          deckId,
          vocabularyId,
          sortOrder: maxOrder + 1 + index,
        }),
      );
    if (!newItems.length) return;

    await this.vocabularyDeckItemRepo.save(newItems, { chunk: 200 });
    deck.itemCount = have.size + newItems.length;
    deck.updatedBy = user.id;
    await this.vocabularyDeckRepo.save(deck);
  }

  @DefTransaction()
  async updateWord(id: string, dto: UpdateVocabularyDto, user: UserDto) {
    const word = await this.vocabularyRepo.findOne({ where: { id, isDeleted: false } });
    if (!word) throw new NotFoundException('Không tìm thấy từ vựng');

    const normalizedWord = normalizeHeadword(dto.headword);
    const duplicate = await this.vocabularyRepo.findOne({
      where: { normalizedWord, partOfSpeech: dto.partOfSpeech, isDeleted: false },
    });
    if (duplicate && duplicate.id !== id) {
      throw new BusinessException(this.i18n.commonTranslate('code_existing'));
    }

    const resolvedUk = await this.resolveAudioUrl(dto.audioUkUrl, dto.audioUkAssetId);
    const resolvedUs = await this.resolveAudioUrl(dto.audioUsUrl, dto.audioUsAssetId);
    const audioUrls = await this.attachTtsIfMissing(dto.headword, user, {
      uk: resolvedUk || word.audioUkUrl,
      us: resolvedUs || word.audioUsUrl,
    });
    const examplesJson = this.mapExamplesJson(dto);
    const collocationsJson = this.mapCollocationsJson(dto);
    Object.assign(word, {
      headword: dto.headword.trim(),
      normalizedWord,
      partOfSpeech: dto.partOfSpeech.trim(),
      definitionVi: dto.definitionVi !== undefined ? dto.definitionVi?.trim() : word.definitionVi,
      definitionEn: dto.definitionEn.trim(),
      meaningVi: dto.meaningVi.trim(),
      ipaUk: dto.ipaUk,
      ipaUs: dto.ipaUs,
      frequencyLevel: dto.frequencyLevel ?? word.frequencyLevel,
      audioUkUrl: audioUrls.uk,
      audioUsUrl: audioUrls.us,
      imageUrl: dto.imageUrl !== undefined ? dto.imageUrl?.trim() || null : word.imageUrl,
      cefrLevel: dto.cefrLevel || word.cefrLevel,
      updatedBy: user.id,
    });
    if (examplesJson) word.examplesJson = examplesJson;
    if (collocationsJson) word.collocationsJson = collocationsJson;
    await this.vocabularyRepo.save(word);
    await this.persistNested(word.id as string, dto);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'VocabularyEntity',
      word.id as string,
      `Cập nhật từ: ${word.headword}`,
    );
    return this.findWord(word.id as string);
  }

  @DefTransaction()
  async deactivateWord(id: string, user: UserDto) {
    const word = await this.vocabularyRepo.findOne({ where: { id, isDeleted: false } });
    if (!word) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.vocabulary'));
    }
    word.isDeleted = true;
    word.deletedAt = new Date();
    word.updatedBy = user.id;
    await this.vocabularyRepo.save(word);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.DEACTIVATE.code,
      'VocabularyEntity',
      word.id as string,
      `Ngưng từ: ${word.headword}`,
    );
    return { message: this.i18n.commonTranslate('update_success'), data: { id } };
  }

  @DefTransaction()
  async activateWord(id: string, user: UserDto) {
    const word = await this.vocabularyRepo.findOne({ where: { id } });
    if (!word) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.vocabulary'));
    }
    word.isDeleted = false;
    word.deletedAt = null;
    word.updatedBy = user.id;
    await this.vocabularyRepo.save(word);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.ACTIVATE.code,
      'VocabularyEntity',
      word.id as string,
      `Kích hoạt từ: ${word.headword}`,
    );
    return this.findWord(word.id as string);
  }

  async paginationDecks(body: PaginationDto<FilterDeckDto>, onlyPublic = false) {
    const { skip = 0, take = 20, where = {} as FilterDeckDto } = body;
    const qb = this.vocabularyDeckRepo
      .createQueryBuilder('deck')
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
    const cefrLevel = where.cefrLevel || where.level;
    if (cefrLevel) qb.andWhere('deck.cefrLevel = :cefrLevel', { cefrLevel });
    if (where.topicId) {
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM vocabulary_deck_items di
          INNER JOIN content_taxonomies ct
            ON ct."entityId" = di."vocabularyId"
           AND ct."entityType" = :vocabEntityType
           AND ct."taxonomyId" = :topicId
           AND ct."isDeleted" = false
          WHERE di."deckId" = deck.id AND di."isDeleted" = false
        )`,
        { vocabEntityType: VOCAB_ENTITY_TYPE, topicId: where.topicId },
      );
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
    });
    if (!deck) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.vocabulary_deck'));
    }

    const items = await this.vocabularyDeckItemRepo.find({
      where: { deckId: id, isDeleted: false },
      order: { sortOrder: 'ASC' },
    });
    const vocabIds = [...new Set(items.map(item => item.vocabularyId))];
    const vocabularies = vocabIds.length
      ? await this.vocabularyRepo.find({
          where: { id: In(vocabIds), isDeleted: false },
        })
      : [];
    const wordMap = new Map(vocabularies.map(item => [item.id, item]));
    const topicMap = await this.loadTopicIds(vocabIds);
    const wordTopicMap = await this.loadWordTopics(vocabIds);
    const words = items
      .map(item => {
        const vocabulary = wordMap.get(item.vocabularyId);
        return vocabulary
          ? this.toPublicWord(vocabulary, {
              sortOrder: item.sortOrder,
              topicIds: topicMap.get(item.vocabularyId) || [],
              topics: wordTopicMap.get(item.vocabularyId) || [],
            })
          : null;
      })
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

    const wordTopicMap = await this.loadWordTopics(words.map(item => item.id));

    return {
      message: this.i18n.commonTranslate('find_success'),
      data: {
        ...buildPublicDeck(deck, { progress }),
        words: words.map(item =>
          this.toPublicWord(item, {
            topics: wordTopicMap.get(item.id) || [],
          }),
        ),
      },
    };
  }

  @DefTransaction()
  async createDeck(dto: CreateDeckDto, user: UserDto) {
    const slug = await this.uniqueSlug(dto.slug || dto.title);
    const deck = this.vocabularyDeckRepo.create({
      id: uuidv4(),
      title: dto.title.trim(),
      titleEn: dto.titleEn?.trim() || dto.title.trim(),
      slug,
      description: dto.description,
      thumbnailUrl: dto.thumbnailUrl,
      visibility: dto.visibility || enumData.VISIBILITY.PUBLIC.code,
      ownerType: dto.ownerType || enumData.VOCAB_DECK_OWNER_TYPE.SYSTEM.code,
      cefrLevel: dto.cefrLevel || dto.level,
      itemCount: 0,
      createdBy: user.id,
    });
    await this.vocabularyDeckRepo.save(deck);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'VocabularyDeckEntity',
      deck.id as string,
      `Tạo deck: ${deck.title}`,
    );
    return this.findDeck(deck.id as string);
  }

  @DefTransaction()
  async updateDeck(id: string, dto: UpdateDeckDto, user: UserDto) {
    const deck = await this.vocabularyDeckRepo.findOne({ where: { id, isDeleted: false } });
    if (!deck) throw new NotFoundException('Không tìm thấy bộ từ');
    if (dto.slug && dto.slug !== deck.slug) {
      deck.slug = await this.uniqueSlug(dto.slug, deck.id);
    }
    Object.assign(deck, {
      title: dto.title?.trim() || deck.title,
      titleEn: dto.titleEn?.trim() || dto.title?.trim() || deck.titleEn,
      description: dto.description,
      thumbnailUrl: dto.thumbnailUrl,
      visibility: dto.visibility || deck.visibility,
      ownerType: dto.ownerType || deck.ownerType,
      cefrLevel: dto.cefrLevel || dto.level || deck.cefrLevel,
      updatedBy: user.id,
    });
    await this.vocabularyDeckRepo.save(deck);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'VocabularyDeckEntity',
      deck.id as string,
      `Cập nhật deck: ${deck.title}`,
    );
    return this.findDeck(deck.id as string);
  }

  @DefTransaction()
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
      deck.id as string,
      `Ngưng bộ thẻ: ${deck.title}`,
    );
    return { message: this.i18n.commonTranslate('update_success'), data: { id } };
  }

  @DefTransaction()
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
      deck.id as string,
      `Kích hoạt bộ thẻ: ${deck.title}`,
    );
    return this.findDeck(deck.id as string);
  }

  @DefTransaction()
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
      deck.id as string,
      `Cập nhật từ trong deck: ${deck.title}`,
      { itemCount: items.length },
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
    const sessions = await this.studySessionRepo.find({
      where: {
        userId,
        isDeleted: false,
        status: enumData.REVIEW_SESSION_STATUS.COMPLETED.code,
        sessionType: In([
          enumData.STUDY_SESSION_TYPE.VOCAB_REVIEW.code,
          enumData.STUDY_SESSION_TYPE.VOCAB_GAME.code,
        ]),
      },
    });
    const now = new Date();
    const dueTodayCount = states.filter(
      item => item.nextReviewAt && new Date(item.nextReviewAt).getTime() <= now.getTime(),
    ).length;
    const newCount = states.filter(
      item => item.srsState === enumData.VOCAB_SRS_STATE.NEW.code,
    ).length;
    const learningCount = states.filter(
      item => item.srsState === enumData.VOCAB_SRS_STATE.LEARNING.code,
    ).length;
    const reviewCount = states.filter(
      item => item.srsState === enumData.VOCAB_SRS_STATE.REVIEW.code,
    ).length;
    const masteredCount = states.filter(
      item => item.srsState === enumData.VOCAB_SRS_STATE.MASTERED.code,
    ).length;
    const totalCards = states.length;
    const totalReviewed = states.reduce((sum, item) => sum + (item.repetitionCount || 0), 0);
    const sessionAnswers = sessions.reduce((sum, item) => sum + (item.completedItems || 0), 0);
    const sessionCorrect = sessions.reduce((sum, item) => sum + (item.correctItems || 0), 0);
    const accuracy = sessionAnswers ? Math.round((sessionCorrect / sessionAnswers) * 100) : 0;

    return {
      message: this.i18n.commonTranslate('find_success'),
      data: {
        dueTodayCount,
        learningWords: states.filter(
          item => item.srsState !== enumData.VOCAB_SRS_STATE.MASTERED.code,
        ).length,
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

  @DefTransaction()
  async startSession(dto: StartSessionDto, user: UserDto) {
    const mode = (dto.mode || '').toUpperCase();
    const allowedModes: string[] = [
      enumData.VOCAB_STUDY_MODE.FLASHCARD.code,
      enumData.VOCAB_STUDY_MODE.QUIZ.code,
    ];
    if (!allowedModes.includes(mode)) {
      throw new BadRequestException('Chế độ học không hợp lệ');
    }

    let deck: VocabularyDeckEntity | null = null;
    let words: VocabularyEntity[] = [];

    if (dto.deckId) {
      deck = await this.vocabularyDeckRepo.findOne({
        where: { id: dto.deckId, isDeleted: false },
        relations: { items: { vocabulary: this.wordRelations() as any } },
      });
      if (!deck) {
        throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.vocabulary_deck'));
      }
      words = (deck.items || [])
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(item => item.vocabulary)
        .filter((item): item is VocabularyEntity => Boolean(item) && !item.isDeleted);
      if (!words.length) throw new BadRequestException('Bộ từ chưa có từ vựng');

      if (dto.topicId || dto.topic) {
        const wordTopicMap = await this.loadWordTopics(words.map(w => w.id));
        words = words.filter(w => {
          const tList = wordTopicMap.get(w.id) || [];
          if (dto.topicId) return tList.some(t => t.id === dto.topicId);
          if (dto.topic) return tList.some(t => t.name.toLowerCase() === dto.topic?.toLowerCase());
          return true;
        });
        if (!words.length) {
          throw new BadRequestException('Không tìm thấy từ vựng thuộc chủ đề này trong bộ thẻ');
        }
      }
    } else {
      words = await this.loadDueMixWords(user.id, dto.limit || 12);
      if (!words.length)
        throw new BadRequestException('Chưa có thẻ đến hạn. Hãy học một bộ từ trước.');
    }

    const limit = dto.limit && dto.limit > 0 ? dto.limit : words.length;

    const states = await this.userVocabularyStateRepo.find({
      where: { userId: user.id, vocabularyId: In(words.map(item => item.id)), isDeleted: false },
    });
    const queue = pickStudyQueue(words, states, limit);
    const sessionType =
      mode === enumData.VOCAB_STUDY_MODE.QUIZ.code
        ? enumData.STUDY_SESSION_TYPE.VOCAB_GAME.code
        : enumData.STUDY_SESSION_TYPE.VOCAB_REVIEW.code;

    const session = this.studySessionRepo.create({
      id: uuidv4(),
      userId: user.id,
      deckId: deck?.id,
      sessionType,
      studyMode: mode,
      status: enumData.REVIEW_SESSION_STATUS.IN_PROGRESS.code,
      totalItems: queue.length,
      completedItems: 0,
      correctItems: 0,
      startedAt: new Date(),
      createdBy: user.id,
    });
    await this.studySessionRepo.save(session);

    const cardTopicMap = await this.loadWordTopics(queue.map(w => w.id));
    const cards = queue.map(word => {
      const base = this.toPublicWord(word, { topics: cardTopicMap.get(word.id) || [] });
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
              cefrLevel: null,
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
      .innerJoin(
        'vocabulary_deck_items',
        'item',
        'item.vocabularyId = word.id AND item."isDeleted" = false',
      )
      .innerJoin(
        'vocabulary_decks',
        'deck',
        'deck.id = item.deckId AND deck."isDeleted" = false AND deck.visibility = :pub AND deck."ownerType" = :owner',
        {
          pub: enumData.VISIBILITY.PUBLIC.code,
          owner: enumData.VOCAB_DECK_OWNER_TYPE.SYSTEM.code,
        },
      )
      .leftJoinAndSelect('word.relations', 'relations')
      .leftJoinAndSelect('relations.relatedVocabulary', 'relatedVocabulary')
      .where('word.isDeleted = false')
      .andWhere(dueIds.length ? 'word.id NOT IN (:...dueIds)' : '1=1', {
        dueIds: dueIds.length ? dueIds : ['00000000-0000-0000-0000-000000000000'],
      })
      .orderBy('word.createdAt', 'DESC')
      .take(limit - words.length)
      .getMany();

    return [...words, ...extra];
  }

  @DefTransaction()
  async answerSession(sessionId: string, dto: AnswerSessionDto, user: UserDto) {
    const session = await this.studySessionRepo.findOne({
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
    const snapshot = applySm2Rating(state, rating);
    if (!state) {
      state = this.userVocabularyStateRepo.create({
        id: uuidv4(),
        userId: user.id,
        vocabularyId: word.id as string,
        srsState: snapshot.srsState,
        stability: snapshot.stability,
        difficulty: snapshot.difficulty,
        intervalDays: snapshot.intervalDays,
        repetitionCount: snapshot.repetitionCount,
        lapseCount: snapshot.lapseCount,
        lastReviewedAt: snapshot.lastReviewedAt,
        nextReviewAt: snapshot.nextReviewAt,
        correctCount: correct ? 1 : 0,
        incorrectCount: correct ? 0 : 1,
        isSaved: true,
        createdBy: user.id,
      });
    } else {
      Object.assign(state, {
        srsState: snapshot.srsState,
        stability: snapshot.stability,
        difficulty: snapshot.difficulty,
        intervalDays: snapshot.intervalDays,
        repetitionCount: snapshot.repetitionCount,
        lapseCount: snapshot.lapseCount,
        lastReviewedAt: snapshot.lastReviewedAt,
        nextReviewAt: snapshot.nextReviewAt,
        correctCount: (state.correctCount || 0) + (correct ? 1 : 0),
        incorrectCount: (state.incorrectCount || 0) + (correct ? 0 : 1),
        isSaved: true,
        updatedBy: user.id,
      });
    }
    await this.userVocabularyStateRepo.save(state);

    let sessionItem = await this.studySessionItemRepo.findOne({
      where: {
        studySessionId: session.id,
        targetType: SESSION_TARGET_VOCABULARY,
        targetId: word.id,
        isDeleted: false,
      },
    });
    const isNewItem = !sessionItem;
    if (!sessionItem) {
      sessionItem = this.studySessionItemRepo.create({
        id: uuidv4(),
        studySessionId: session.id as string,
        targetType: SESSION_TARGET_VOCABULARY,
        targetId: word.id as string,
        sortOrder: session.completedItems,
        createdBy: user.id,
      });
    }
    sessionItem.answerJson = {
      rating,
      optionId: dto.optionId || null,
      vocabularyId: word.id,
    };
    sessionItem.isCorrect = correct;
    sessionItem.rating = rating;
    sessionItem.responseTimeMs = dto.responseTimeMs || 0;
    await this.studySessionItemRepo.save(sessionItem);

    if (isNewItem) {
      session.completedItems += 1;
      if (correct) session.correctItems += 1;
      await this.studySessionRepo.save(session);
    }

    const examples = word.examplesJson || [];
    const firstExample = (examples[0] || {}) as { sentence?: string; translation?: string };
    const collocations = (word.collocationsJson || []) as {
      collocation?: string;
      meaningVi?: string;
    }[];

    return {
      message: correct ? 'Chính xác' : 'Cần ôn lại',
      data: {
        correct,
        rating,
        explanation: {
          headword: word.headword,
          meaningVi: word.meaningVi,
          definitionVi: word.definitionVi || null,
          definitionEn: word.definitionEn,
          exampleEn: firstExample.sentence || null,
          exampleVi: firstExample.translation || null,
          collocations: collocations.map(item => ({
            collocation: item.collocation,
            meaningVi: item.meaningVi,
          })),
        },
        nextReviewAt: snapshot.nextReviewAt,
        state: snapshot.srsState,
        srsState: snapshot.srsState,
        session: {
          cardsReviewed: session.completedItems,
          cardsCorrect: session.correctItems,
          cardsDue: session.totalItems,
        },
      },
    };
  }

  @DefTransaction()
  async completeSession(sessionId: string, user: UserDto) {
    const session = await this.studySessionRepo.findOne({
      where: { id: sessionId, userId: user.id, isDeleted: false },
    });
    if (!session) throw new NotFoundException('Không tìm thấy phiên học');
    const endedAt = new Date();
    session.status = enumData.REVIEW_SESSION_STATUS.COMPLETED.code;
    session.endedAt = endedAt;
    session.durationSeconds = Math.max(
      0,
      Math.round((endedAt.getTime() - new Date(session.startedAt).getTime()) / 1000),
    );
    session.score = session.completedItems
      ? Math.round((session.correctItems / session.completedItems) * 100)
      : 0;
    session.updatedBy = user.id;
    await this.studySessionRepo.save(session);

    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'StudySessionEntity',
      session.id as string,
      `Hoàn thành phiên học từ vựng (${session.sessionType})`,
      {
        completedItems: session.completedItems,
        correctItems: session.correctItems,
        totalItems: session.totalItems,
        score: session.score,
      },
    );

    return {
      message: 'Hoàn thành phiên học',
      data: {
        sessionId: session.id,
        cardsReviewed: session.completedItems,
        cardsCorrect: session.correctItems,
        cardsDue: session.totalItems,
        accuracy: session.completedItems
          ? Math.round((session.correctItems / session.completedItems) * 100)
          : 0,
      },
    };
  }

  async importDecks(dto: ExcelImportBatchDto, user: UserDto) {
    return runBulkImport(dto.items, async item => {
      const created = await this.createDeck(
        {
          title: requireText(item.title, 'Tên bộ thẻ'),
          titleEn: optionalText(item.titleEn),
          slug: optionalText(item.slug),
          description: optionalText(item.description),
          descriptionEn: optionalText(item.descriptionEn),
          thumbnailUrl: optionalText(item.thumbnailUrl),
          visibility: optionalText(item.visibility),
          level: optionalText(item.level) || optionalText(item.cefrLevel),
          cefrLevel: optionalText(item.cefrLevel) || optionalText(item.level),
        },
        user,
      );
      return { id: createdEntityId(created) };
    });
  }

  async exportDecks(body: PaginationDto<FilterDeckDto>) {
    const { data } = await this.paginationDecks({
      skip: body?.skip || 0,
      take: excelExportTake(body?.take),
      where: body?.where || {},
    });
    return { message: this.i18n.commonTranslate('find_success'), data };
  }
}
