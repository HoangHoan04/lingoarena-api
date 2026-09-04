import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, In, MoreThan, Not } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DefTransaction } from '~/common/core/decorator';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { BusinessException } from '~/common/systems/exceptions';
import { PaginationDto, UserDto } from '~/dto';
import { ArenaMatchEntity, ArenaMatchParticipantEntity, QuestionEntity } from '~/entities';
import {
  ArenaChallengeRepo,
  ArenaMatchAnswerRepo,
  ArenaMatchParticipantRepo,
  ArenaMatchQuestionRepo,
  ArenaMatchRepo,
  ArenaQueueTicketRepo,
  ArenaRatingRepo,
  QuestionRepo,
  UserRepo,
} from '~/repositories';
import { ActionLogService } from '../../action-log/action-log.service';
import { GamificationService } from '../../gamification/service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import { AUTO_GRADE_TYPES, gradeAnswer } from '../../question/helpers/question.helper';
import {
  CreateArenaChallengeDto,
  FilterArenaDto,
  PracticeMatchDto,
  QueueArenaDto,
  SubmitArenaAnswerDto,
} from '../dto';

type QuestionSnapshot = {
  questionId: string;
  questionType: string;
  prompt: string;
  instructions?: string;
  contentJson?: Record<string, unknown>;
  correctAnswerJson?: Record<string, unknown>;
  options: Array<{
    optionKey: string;
    content: string;
    isCorrect?: boolean;
    feedback?: string;
    sortOrder?: number;
  }>;
};

type StructureIdInput = { examStructureId?: string; examSkillId?: string };

@Injectable()
export class ArenaService {
  constructor(
    private readonly arenaRatingRepo: ArenaRatingRepo,
    private readonly arenaMatchRepo: ArenaMatchRepo,
    private readonly arenaMatchQuestionRepo: ArenaMatchQuestionRepo,
    private readonly arenaMatchParticipantRepo: ArenaMatchParticipantRepo,
    private readonly arenaMatchAnswerRepo: ArenaMatchAnswerRepo,
    private readonly arenaQueueTicketRepo: ArenaQueueTicketRepo,
    private readonly arenaChallengeRepo: ArenaChallengeRepo,
    private readonly questionRepo: QuestionRepo,
    private readonly userRepo: UserRepo,
    private readonly gamificationService: GamificationService,
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

  private resolveExamStructureId(input?: string | StructureIdInput) {
    const id = typeof input === 'string' ? input : input?.examStructureId || input?.examSkillId;
    if (!id) throw new BusinessException('examStructureId is required');
    return id;
  }

  private snapshotQuestion(question: QuestionEntity): QuestionSnapshot {
    const options = (question.options || [])
      .slice()
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(item => ({
        optionKey: item.optionKey,
        content: item.content,
        isCorrect: Boolean(item.isCorrect),
        feedback: item.feedback,
        sortOrder: item.sortOrder || 0,
      }));
    return {
      questionId: question.id,
      questionType: question.questionType,
      prompt: question.prompt || '',
      instructions: question.instructions,
      contentJson: question.contentJson,
      correctAnswerJson: question.correctAnswerJson,
      options,
    };
  }

  private publicSnapshot(snapshot: QuestionSnapshot, publicOnly: boolean) {
    if (!publicOnly) return snapshot;
    return {
      ...snapshot,
      correctAnswerJson: undefined,
      options: (snapshot.options || []).map(item => ({
        optionKey: item.optionKey,
        content: item.content,
        sortOrder: item.sortOrder,
      })),
    };
  }

  private async attachUsers<T extends { userId: string }>(rows: T[]) {
    const ids = [...new Set(rows.map(item => item.userId).filter(Boolean))];
    if (!ids.length) return rows.map(item => ({ ...item, user: null }));
    const users = await this.userRepo.find({
      where: { id: In(ids) },
      relations: { profile: true },
    });
    const map = new Map(users.map(item => [item.id, item]));
    return rows.map(item => {
      const user = map.get(item.userId);
      return {
        ...item,
        user: user
          ? {
              id: user.id,
              email: user.email,
              username: user.username,
              fullName: user.profile?.fullName,
              displayName: user.profile?.displayName || user.profile?.fullName || user.username,
              avatarUrl: user.profile?.avatarUrl,
            }
          : null,
      };
    });
  }

  private async getOrCreateRating(userId: string, examStructureId: string) {
    let rating = await this.arenaRatingRepo.findOne({ where: { userId, examStructureId } });
    if (!rating) {
      rating = await this.arenaRatingRepo.save(
        this.arenaRatingRepo.create({
          id: uuidv4(),
          userId,
          examStructureId,
          eloRating: 1000,
          peakElo: 1000,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          createdBy: userId,
        }),
      );
    }
    return rating;
  }

  async getMyRating(examStructureId: string, user: UserDto) {
    const structureId = this.resolveExamStructureId(examStructureId);
    const rating = await this.getOrCreateRating(user.id, structureId);
    return { data: transformKeys(rating) };
  }

  async paginationMatches(body: PaginationDto<FilterArenaDto>) {
    const { skip = 0, take = 20, where = {} as FilterArenaDto } = body;
    const whereCon: FindOptionsWhere<ArenaMatchEntity> = { isDeleted: false };
    if (where.status) whereCon.status = where.status;
    const examStructureId = where.examStructureId || where.examSkillId;
    if (examStructureId) whereCon.examStructureId = examStructureId;
    const [data, total] = await this.arenaMatchRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
      relations: { examStructure: true, participants: true },
    });
    const withUsers = await Promise.all(
      data.map(async item => ({
        ...item,
        participants: await this.attachUsers(item.participants || []),
      })),
    );
    return { data: transformKeys(withUsers), total };
  }

  async adminFindMatch(id: string, user: UserDto) {
    const result = await this.findMatch(id, user, true);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.VIEW.code,
      'ArenaMatchEntity',
      id,
      'Xem trận Arena',
    );
    return result;
  }

  async queue(dto: QueueArenaDto, user: UserDto) {
    const examStructureId = this.resolveExamStructureId(dto);
    const matchMode = dto.matchMode || enumData.ARENA_MATCH_MODE.RANKED.code;
    await this.getOrCreateRating(user.id, examStructureId);
    const ticket = await this.arenaQueueTicketRepo.save(
      this.arenaQueueTicketRepo.create({
        id: uuidv4(),
        userId: user.id,
        examStructureId,
        matchMode,
        status: enumData.ARENA_QUEUE_STATUS.WAITING.code,
        enqueuedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        createdBy: user.id,
      }),
    );
    const other = await this.arenaQueueTicketRepo.findOne({
      where: {
        examStructureId,
        matchMode,
        status: enumData.ARENA_QUEUE_STATUS.WAITING.code,
        expiresAt: MoreThan(new Date()),
        isDeleted: false,
        userId: Not(user.id),
        id: Not(ticket.id),
      },
      order: { createdAt: 'ASC' },
    });
    if (other) {
      const match = await this.createMatch(
        examStructureId,
        matchMode,
        [
          { userId: other.userId, isBot: false },
          { userId: user.id, isBot: false },
        ],
        5,
        dto.taxonomyId,
      );
      other.status = enumData.ARENA_QUEUE_STATUS.MATCHED.code;
      other.matchedMatchId = match.id;
      ticket.status = enumData.ARENA_QUEUE_STATUS.MATCHED.code;
      ticket.matchedMatchId = match.id;
      await this.arenaQueueTicketRepo.save([other, ticket]);
    }
    return { data: transformKeys(ticket) };
  }

  async getQueueTicket(id: string, user: UserDto) {
    const ticket = await this.arenaQueueTicketRepo.findOne({
      where: { id, userId: user.id, isDeleted: false },
    });
    if (!ticket)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.arena_queue'));
    if (
      ticket.status === enumData.ARENA_QUEUE_STATUS.WAITING.code &&
      ticket.expiresAt < new Date()
    ) {
      ticket.status = enumData.ARENA_QUEUE_STATUS.EXPIRED.code;
      await this.arenaQueueTicketRepo.save(ticket);
    }
    let matchedMatch = null;
    if (ticket.matchedMatchId) {
      matchedMatch = await this.arenaMatchRepo.findOne({ where: { id: ticket.matchedMatchId } });
    }
    return { data: transformKeys({ ...ticket, matchedMatch }) };
  }

  async practiceMatch(dto: PracticeMatchDto, user: UserDto) {
    const examStructureId = this.resolveExamStructureId(dto);
    const bot = await this.userRepo.findOne({
      where: { email: 'bot@lingoarena.com', isDeleted: false },
    });
    const players = bot
      ? [
          { userId: user.id, isBot: false },
          { userId: bot.id, isBot: true },
        ]
      : [{ userId: user.id, isBot: false }];
    const match = await this.createMatch(
      examStructureId,
      enumData.ARENA_MATCH_MODE.QUICKPLAY.code,
      players,
      dto.questionCount || 5,
      dto.taxonomyId,
    );
    if (bot) await this.answerAsBot(match.id, bot.id);
    return this.findMatch(match.id, user);
  }

  private async createMatch(
    examStructureId: string,
    matchMode: string,
    players: Array<{ userId: string; isBot?: boolean }>,
    questionCount: number,
    taxonomyId?: string,
  ) {
    const questions = await this.pickQuestions(examStructureId, questionCount);
    if (!questions.length)
      throw new BusinessException(this.i18n.commonTranslate('entity_not_found.question'));
    const match = await this.arenaMatchRepo.save(
      this.arenaMatchRepo.create({
        id: uuidv4(),
        examStructureId,
        taxonomyId,
        matchMode,
        maxPlayers: players.length,
        questionCount: questions.length,
        durationSeconds: Math.max(questions.length * 30, 300),
        status: enumData.ARENA_MATCH_STATUS.IN_PROGRESS.code,
        startedAt: new Date(),
        matchConfigJson: { source: 'arena_service' },
      }),
    );
    for (const player of players) {
      const rating = await this.getOrCreateRating(player.userId, examStructureId);
      await this.arenaMatchParticipantRepo.save(
        this.arenaMatchParticipantRepo.create({
          id: uuidv4(),
          arenaMatchId: match.id,
          userId: player.userId,
          isBot: Boolean(player.isBot),
          correctCount: 0,
          totalAnswered: 0,
          score: 0,
          eloBefore: rating.eloRating,
          eloChange: 0,
          joinedAt: new Date(),
          createdBy: player.userId,
        }),
      );
    }
    await this.arenaMatchQuestionRepo.save(
      questions.map((question, index) =>
        this.arenaMatchQuestionRepo.create({
          id: uuidv4(),
          arenaMatchId: match.id,
          questionId: question.id,
          questionSnapshotJson: this.snapshotQuestion(question),
          sortOrder: index + 1,
          timeLimitSeconds: 30,
        }),
      ),
    );
    return match;
  }

  private async pickQuestions(examStructureId: string, take: number) {
    return this.questionRepo
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.options', 'options')
      .where('question.examStructureId = :examStructureId', { examStructureId })
      .andWhere('question.isDeleted = false')
      .andWhere('question.questionType IN (:...types)', { types: AUTO_GRADE_TYPES })
      .orderBy('RANDOM()')
      .take(take)
      .getMany();
  }

  async findMatch(id: string, user: UserDto, admin = false) {
    const match = await this.arenaMatchRepo.findOne({
      where: { id, isDeleted: false },
      relations: { participants: true, questions: true, examStructure: true },
    });
    if (!match || (!admin && !(match.participants || []).some(item => item.userId === user.id))) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.arena_match'));
    }
    const publicOnly = !admin && match.status !== enumData.ARENA_MATCH_STATUS.FINISHED.code;
    const matchQuestions = (match.questions || [])
      .slice()
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(item => ({
        ...item,
        question: this.publicSnapshot(
          (item.questionSnapshotJson || {}) as QuestionSnapshot,
          publicOnly,
        ),
      }));
    const participants = await this.attachUsers(match.participants || []);
    const payload = {
      ...match,
      questions: matchQuestions,
      matchQuestions,
      participants,
    };
    return { data: transformKeys(payload) };
  }

  async submitAnswer(matchId: string, dto: SubmitArenaAnswerDto, user: UserDto) {
    const participant = await this.getParticipant(matchId, user.id);
    const matchQuestion = await this.arenaMatchQuestionRepo.findOne({
      where: { id: dto.arenaMatchQuestionId, arenaMatchId: matchId, isDeleted: false },
    });
    if (!matchQuestion)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.arena_match'));
    const snapshot = (matchQuestion.questionSnapshotJson || {}) as QuestionSnapshot;
    const result = gradeAnswer({
      typeCode: snapshot.questionType,
      options: snapshot.options || [],
      correctAnswerJson: snapshot.correctAnswerJson,
      answerJson: dto.answerJson,
    });
    let answer = await this.arenaMatchAnswerRepo.findOne({
      where: { userId: user.id, arenaMatchQuestionId: matchQuestion.id },
    });
    if (!answer) {
      answer = this.arenaMatchAnswerRepo.create({
        id: uuidv4(),
        userId: user.id,
        arenaMatchQuestionId: matchQuestion.id,
        createdBy: user.id,
      });
    }
    answer.answerJson = dto.answerJson || {};
    answer.isCorrect = result.isCorrect;
    answer.timeTakenMs = dto.timeTakenMs || 0;
    answer.pointsAwarded = result.isCorrect ? 100 : 0;
    await this.arenaMatchAnswerRepo.save(answer);
    await this.recountParticipant(participant);
    return { data: transformKeys({ ...answer, grading: result }) };
  }

  async finishMatch(matchId: string, user: UserDto) {
    const match = await this.arenaMatchRepo.findOne({
      where: { id: matchId, isDeleted: false },
      relations: { participants: true },
    });
    if (!match || !(match.participants || []).some(item => item.userId === user.id)) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.arena_match'));
    }
    for (const participant of match.participants || []) {
      await this.recountParticipant(participant);
    }
    const participants = await this.arenaMatchParticipantRepo.find({
      where: { arenaMatchId: matchId },
      order: { score: 'DESC' },
    });
    await this.applyRanksAndElo(match, participants);
    match.status = enumData.ARENA_MATCH_STATUS.FINISHED.code;
    match.finishedAt = new Date();
    await this.arenaMatchRepo.save(match);
    await this.writeLog(
      user,
      enumData.ACTION_LOG.UPDATE.code,
      'ArenaMatchEntity',
      match.id,
      'Kết thúc trận Arena',
    );
    await this.gamificationService.awardPoints(
      user.id,
      15,
      enumData.POINT_REASON.ARENA_WIN.code,
      'arena_match',
      match.id,
      'Hoàn thành trận Arena',
    );
    return this.findMatch(matchId, user);
  }

  private async getParticipant(matchId: string, userId: string) {
    const participant = await this.arenaMatchParticipantRepo.findOne({
      where: { arenaMatchId: matchId, userId, isDeleted: false },
    });
    if (!participant)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.arena_match'));
    return participant;
  }

  private async recountParticipant(participant: ArenaMatchParticipantEntity) {
    const matchQuestions = await this.arenaMatchQuestionRepo.find({
      where: { arenaMatchId: participant.arenaMatchId, isDeleted: false },
    });
    const questionIds = matchQuestions.map(item => item.id);
    const answers = questionIds.length
      ? await this.arenaMatchAnswerRepo.find({
          where: { userId: participant.userId, arenaMatchQuestionId: In(questionIds) },
        })
      : [];
    participant.totalAnswered = answers.length;
    participant.correctCount = answers.filter(item => item.isCorrect).length;
    participant.score = answers.reduce((sum, item) => sum + (item.pointsAwarded || 0), 0);
    await this.arenaMatchParticipantRepo.save(participant);
  }

  private expectedScore(a: number, b: number) {
    return 1 / (1 + Math.pow(10, (b - a) / 400));
  }

  private async applyRanksAndElo(
    match: ArenaMatchEntity,
    participants: ArenaMatchParticipantEntity[],
  ) {
    const ordered = [...participants].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    const opponentDefault = 1000;
    for (const participant of ordered) {
      const rating = await this.getOrCreateRating(participant.userId, match.examStructureId);
      const opponent = ordered.find(item => item.userId !== participant.userId);
      const opponentRating = opponent
        ? await this.getOrCreateRating(opponent.userId, match.examStructureId)
        : null;
      const resultScore = !opponent
        ? 1
        : Number(participant.score) > Number(opponent.score)
          ? 1
          : Number(participant.score) === Number(opponent.score)
            ? 0.5
            : 0;
      const expected = this.expectedScore(
        rating.eloRating,
        opponentRating?.eloRating || opponentDefault,
      );
      const change = Math.round(32 * (resultScore - expected));
      participant.result =
        resultScore === 1
          ? enumData.ARENA_PARTICIPANT_RESULT.WIN.code
          : resultScore === 0.5
            ? enumData.ARENA_PARTICIPANT_RESULT.DRAW.code
            : enumData.ARENA_PARTICIPANT_RESULT.LOSS.code;
      participant.eloBefore = rating.eloRating;
      rating.eloRating += change;
      rating.peakElo = Math.max(rating.peakElo || 1000, rating.eloRating);
      rating.matchesPlayed += 1;
      rating.wins += resultScore === 1 ? 1 : 0;
      rating.draws += resultScore === 0.5 ? 1 : 0;
      rating.losses += resultScore === 0 ? 1 : 0;
      participant.eloChange = change;
      await this.arenaRatingRepo.save(rating);
      await this.arenaMatchParticipantRepo.save(participant);
    }
  }

  private async answerAsBot(matchId: string, botUserId: string) {
    const participant = await this.getParticipant(matchId, botUserId);
    const matchQuestions = await this.arenaMatchQuestionRepo.find({
      where: { arenaMatchId: matchId, isDeleted: false },
    });
    const answers = matchQuestions.map(matchQuestion => {
      const snapshot = (matchQuestion.questionSnapshotJson || {}) as QuestionSnapshot;
      const options = snapshot.options || [];
      const correct = options.find(item => item.isCorrect);
      const random = options[Math.floor(Math.random() * Math.max(options.length, 1))];
      const selected = Math.random() < 0.5 && correct ? correct : random;
      const answerJson = selected ? { optionKey: selected.optionKey } : {};
      const result = gradeAnswer({
        typeCode: snapshot.questionType,
        options,
        correctAnswerJson: snapshot.correctAnswerJson,
        answerJson,
      });
      return this.arenaMatchAnswerRepo.create({
        id: uuidv4(),
        userId: botUserId,
        arenaMatchQuestionId: matchQuestion.id,
        answerJson,
        isCorrect: result.isCorrect,
        timeTakenMs: 1500 + Math.floor(Math.random() * 4000),
        pointsAwarded: result.isCorrect ? 100 : 0,
        createdBy: botUserId,
      });
    });
    await this.arenaMatchAnswerRepo.save(answers);
    await this.recountParticipant(participant);
  }

  @DefTransaction()
  async createChallenge(dto: CreateArenaChallengeDto, user: UserDto) {
    if (dto.opponentUserId === user.id)
      throw new BusinessException('Không thể thách đấu chính mình');
    const examStructureId = this.resolveExamStructureId(dto);
    const opponent = await this.userRepo.findOne({
      where: { id: dto.opponentUserId, isDeleted: false },
    });
    if (!opponent) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.user'));
    const item = await this.arenaChallengeRepo.save(
      this.arenaChallengeRepo.create({
        id: uuidv4(),
        challengerUserId: user.id,
        opponentUserId: dto.opponentUserId,
        examStructureId,
        status: enumData.ARENA_CHALLENGE_STATUS.PENDING.code,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        message: dto.message,
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'ArenaChallengeEntity',
      item.id,
      'Gửi lời thách đấu',
    );
    return { message: this.i18n.commonTranslate('save_success'), data: transformKeys(item) };
  }

  async paginationMyMatches(body: PaginationDto<FilterArenaDto>, user: UserDto) {
    const parts = await this.arenaMatchParticipantRepo.find({
      where: { userId: user.id, isDeleted: false },
    });
    const matchIds = parts.map(item => item.arenaMatchId);
    if (!matchIds.length) return { data: [], total: 0 };
    const { skip = 0, take = 20, where = {} as FilterArenaDto } = body || {};
    const whereCon: FindOptionsWhere<ArenaMatchEntity> = { id: In(matchIds), isDeleted: false };
    if (where.status) whereCon.status = where.status;
    const examStructureId = where.examStructureId || where.examSkillId;
    if (examStructureId) whereCon.examStructureId = examStructureId;
    const [data, total] = await this.arenaMatchRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
      relations: { examStructure: true, participants: true },
    });
    const withUsers = await Promise.all(
      data.map(async item => ({
        ...item,
        participants: await this.attachUsers(item.participants || []),
      })),
    );
    return { data: transformKeys(withUsers), total };
  }
}
