import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, MoreThan } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { PaginationDto, UserDto } from '~/dto';
import { ArenaMatchEntity, ArenaMatchParticipantEntity, QuestionEntity } from '~/entities';
import {
  ArenaMatchAnswerRepo,
  ArenaMatchParticipantRepo,
  ArenaMatchQuestionRepo,
  ArenaMatchRepo,
  ArenaQueueTicketRepo,
  ArenaRatingRepo,
  QuestionOptionRepo,
  QuestionRepo,
  QuestionTypeRepo,
  QuestionVersionRepo,
  UserRepo,
} from '~/repositories';
import { ActionLogService } from '../../action-log/action-log.service';
import { GamificationService } from '../../gamification/service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import { AUTO_GRADE_TYPES, buildQuestionPayload, gradeAnswer } from '../../question/helpers/question.helper';
import { FilterArenaDto, PracticeMatchDto, QueueArenaDto, SubmitArenaAnswerDto } from '../dto';

@Injectable()
export class ArenaService {
  constructor(
    private readonly arenaRatingRepo: ArenaRatingRepo,
    private readonly arenaMatchRepo: ArenaMatchRepo,
    private readonly arenaMatchQuestionRepo: ArenaMatchQuestionRepo,
    private readonly arenaMatchParticipantRepo: ArenaMatchParticipantRepo,
    private readonly arenaMatchAnswerRepo: ArenaMatchAnswerRepo,
    private readonly arenaQueueTicketRepo: ArenaQueueTicketRepo,
    private readonly questionRepo: QuestionRepo,
    private readonly questionVersionRepo: QuestionVersionRepo,
    private readonly questionOptionRepo: QuestionOptionRepo,
    private readonly questionTypeRepo: QuestionTypeRepo,
    private readonly userRepo: UserRepo,
    private readonly gamificationService: GamificationService,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

  private actorName(user: UserDto) {
    return user.fullName || user.name || user.username || user.email || 'Admin';
  }

  private async writeLog(user: UserDto, actionType: string, entityType: string, entityId: string, description: string) {
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

  private async getOrCreateRating(userId: string, examSkillId: string) {
    let rating = await this.arenaRatingRepo.findOne({ where: { userId, examSkillId } });
    if (!rating) {
      rating = await this.arenaRatingRepo.save(
        this.arenaRatingRepo.create({
          id: uuidv4(),
          userId,
          examSkillId,
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

  async getMyRating(examSkillId: string, user: UserDto) {
    const rating = await this.getOrCreateRating(user.id, examSkillId);
    return { data: transformKeys(rating) };
  }

  async paginationMatches(body: PaginationDto<FilterArenaDto>) {
    const { skip = 0, take = 20, where = {} as FilterArenaDto } = body;
    const whereCon: FindOptionsWhere<ArenaMatchEntity> = { isDeleted: false };
    if (where.status) whereCon.status = where.status;
    if (where.examSkillId) whereCon.examSkillId = where.examSkillId;
    const [data, total] = await this.arenaMatchRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
      relations: { examSkill: true, topic: true, participants: { user: true } },
    });
    return { data: transformKeys(data), total };
  }

  async adminFindMatch(id: string, user: UserDto) {
    const result = await this.findMatch(id, user, true);
    await this.writeLog(user, enumData.ACTION_LOG.VIEW.code, 'ArenaMatchEntity', id, 'Xem trận Arena');
    return result;
  }

  async queue(dto: QueueArenaDto, user: UserDto) {
    const matchMode = dto.matchMode || enumData.ARENA_MATCH_MODE.RANKED.code;
    const rating = await this.getOrCreateRating(user.id, dto.examSkillId);
    const ticket = await this.arenaQueueTicketRepo.save(
      this.arenaQueueTicketRepo.create({
        id: uuidv4(),
        userId: user.id,
        examSkillId: dto.examSkillId,
        matchMode,
        eloAtEnqueue: rating.eloRating,
        status: enumData.ARENA_QUEUE_STATUS.WAITING.code,
        expiresAt: new Date(Date.now() + 60_000),
        createdBy: user.id,
      }),
    );
    const other = await this.arenaQueueTicketRepo.findOne({
      where: {
        examSkillId: dto.examSkillId,
        matchMode,
        status: enumData.ARENA_QUEUE_STATUS.WAITING.code,
        expiresAt: MoreThan(new Date()),
        isDeleted: false,
      },
      order: { createdAt: 'ASC' },
    });
    if (other && other.id !== ticket.id && other.userId !== user.id) {
      const match = await this.createMatch(dto.examSkillId, matchMode, [other.userId, user.id], 5, 2);
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
      relations: { matchedMatch: true },
    });
    if (!ticket) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.arena_match'));
    if (ticket.status === enumData.ARENA_QUEUE_STATUS.WAITING.code && ticket.expiresAt < new Date()) {
      ticket.status = enumData.ARENA_QUEUE_STATUS.EXPIRED.code;
      await this.arenaQueueTicketRepo.save(ticket);
    }
    return { data: transformKeys(ticket) };
  }

  async practiceMatch(dto: PracticeMatchDto, user: UserDto) {
    const bot = await this.userRepo.findOne({ where: { email: 'bot@lingoarena.com', isDeleted: false } });
    const users = bot ? [user.id, bot.id] : [user.id];
    const match = await this.createMatch(dto.examSkillId, enumData.ARENA_MATCH_MODE.QUICKPLAY.code, users, dto.questionCount || 5, users.length);
    if (bot) await this.answerAsBot(match.id, bot.id);
    return this.findMatch(match.id, user);
  }

  private async createMatch(examSkillId: string, matchMode: string, userIds: string[], questionCount: number, maxPlayers: number) {
    const questions = await this.pickQuestions(examSkillId, questionCount);
    const match = await this.arenaMatchRepo.save(
      this.arenaMatchRepo.create({
        id: uuidv4(),
        examSkillId,
        matchMode,
        maxPlayers,
        questionCount: questions.length,
        durationSeconds: 0,
        status: enumData.ARENA_MATCH_STATUS.IN_PROGRESS.code,
        startedAt: new Date(),
        matchConfigJson: { source: 'arena_service' },
      }),
    );
    await this.arenaMatchParticipantRepo.save(
      userIds.map((userId, index) =>
        this.arenaMatchParticipantRepo.create({
          id: uuidv4(),
          matchId: match.id,
          userId,
          seatNumber: index + 1,
          correctCount: 0,
          totalAnswered: 0,
          score: 0,
          timeTakenSeconds: 0,
          eloBefore: undefined,
          createdBy: userId,
        }),
      ),
    );
    await this.arenaMatchQuestionRepo.save(
      questions.map((question, index) =>
        this.arenaMatchQuestionRepo.create({
          id: uuidv4(),
          matchId: match.id,
          questionId: question.id,
          questionVersionId: question.currentVersionId,
          sortOrder: index + 1,
        }),
      ),
    );
    return match;
  }

  private async pickQuestions(examSkillId: string, take: number) {
    return this.questionRepo
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.questionType', 'questionType')
      .leftJoinAndSelect('question.currentVersion', 'currentVersion')
      .leftJoinAndSelect('currentVersion.options', 'options')
      .where('question.examSkillId = :examSkillId', { examSkillId })
      .andWhere('question.status = :status', { status: enumData.CONTENT_REVIEW_STATUS.APPROVED.code })
      .andWhere('question.isDeleted = false')
      .andWhere('(questionType.supportsAutoGrading = true OR questionType.code IN (:...types))', { types: AUTO_GRADE_TYPES })
      .andWhere('question.currentVersionId IS NOT NULL')
      .orderBy('RANDOM()')
      .take(take)
      .getMany();
  }

  async findMatch(id: string, user: UserDto, admin = false) {
    const match = await this.arenaMatchRepo.findOne({
      where: { id, isDeleted: false },
      relations: {
        participants: { user: true, answers: true },
        matchQuestions: { question: { questionType: true, currentVersion: { options: true } } },
      },
    });
    if (!match || (!admin && !(match.participants || []).some(item => item.userId === user.id))) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.arena_match'));
    }
    const publicOnly = !admin && match.status !== enumData.ARENA_MATCH_STATUS.FINISHED.code;
    const payload = {
      ...match,
      matchQuestions: (match.matchQuestions || [])
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(item => ({
          ...item,
          question: item.question ? buildQuestionPayload(item.question, publicOnly) : null,
        })),
    };
    return { data: transformKeys(payload) };
  }

  async submitAnswer(matchId: string, dto: SubmitArenaAnswerDto, user: UserDto) {
    const participant = await this.getParticipant(matchId, user.id);
    const matchQuestion = await this.arenaMatchQuestionRepo.findOne({
      where: { id: dto.arenaMatchQuestionId, matchId, isDeleted: false },
      relations: { question: { questionType: true, currentVersion: { options: true } } },
    });
    if (!matchQuestion?.question) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.arena_match'));
    const question = matchQuestion.question;
    const result = gradeAnswer({
      typeCode: question.questionType.code,
      options: question.currentVersion.options || [],
      correctAnswerJson: question.currentVersion.correctAnswerJson,
      answerJson: dto.answerJson,
    });
    let answer = await this.arenaMatchAnswerRepo.findOne({
      where: { matchParticipantId: participant.id, arenaMatchQuestionId: matchQuestion.id },
    });
    if (!answer) {
      answer = this.arenaMatchAnswerRepo.create({
        id: uuidv4(),
        matchParticipantId: participant.id,
        arenaMatchQuestionId: matchQuestion.id,
        createdBy: user.id,
      });
    }
    answer.answerJson = dto.answerJson || {};
    answer.isCorrect = result.isCorrect;
    answer.timeTakenMs = dto.timeTakenMs || 0;
    answer.answeredAt = new Date();
    await this.arenaMatchAnswerRepo.save(answer);
    await this.recountParticipant(participant.id);
    return { data: transformKeys({ ...answer, grading: result }) };
  }

  async finishMatch(matchId: string, user: UserDto) {
    const match = await this.arenaMatchRepo.findOne({
      where: { id: matchId, isDeleted: false },
      relations: { participants: { answers: true, user: true } },
    });
    if (!match || !(match.participants || []).some(item => item.userId === user.id)) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.arena_match'));
    }
    for (const participant of match.participants || []) {
      await this.recountParticipant(participant.id);
    }
    const participants = await this.arenaMatchParticipantRepo.find({
      where: { matchId },
      order: { score: 'DESC', timeTakenSeconds: 'ASC' },
    });
    await this.applyRanksAndElo(match, participants);
    match.status = enumData.ARENA_MATCH_STATUS.FINISHED.code;
    match.finishedAt = new Date();
    await this.arenaMatchRepo.save(match);
    await this.gamificationService.awardPoints(user.id, 15, enumData.POINT_REASON.ARENA_WIN.code, 'arena_match', match.id, 'Hoàn thành trận Arena');
    return this.findMatch(matchId, user);
  }

  private async getParticipant(matchId: string, userId: string) {
    const participant = await this.arenaMatchParticipantRepo.findOne({ where: { matchId, userId, isDeleted: false } });
    if (!participant) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.arena_match'));
    return participant;
  }

  private async recountParticipant(participantId: string) {
    const participant = await this.arenaMatchParticipantRepo.findOne({
      where: { id: participantId },
      relations: { answers: true },
    });
    if (!participant) return;
    const answers = participant.answers || [];
    participant.totalAnswered = answers.length;
    participant.correctCount = answers.filter(item => item.isCorrect).length;
    participant.timeTakenSeconds = Math.round(answers.reduce((sum, item) => sum + (item.timeTakenMs || 0), 0) / 1000);
    participant.score = participant.correctCount * 100;
    await this.arenaMatchParticipantRepo.save(participant);
  }

  private expectedScore(a: number, b: number) {
    return 1 / (1 + Math.pow(10, (b - a) / 400));
  }

  private async applyRanksAndElo(match: ArenaMatchEntity, participants: ArenaMatchParticipantEntity[]) {
    const ordered = [...participants].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    const opponentDefault = 1000;
    for (const participant of ordered) {
      const rating = await this.getOrCreateRating(participant.userId, match.examSkillId);
      const opponent = ordered.find(item => item.userId !== participant.userId);
      const opponentRating = opponent ? await this.getOrCreateRating(opponent.userId, match.examSkillId) : null;
      const resultScore = !opponent
        ? 1
        : Number(participant.score) > Number(opponent.score)
          ? 1
          : Number(participant.score) === Number(opponent.score)
            ? 0.5
            : 0;
      const expected = this.expectedScore(rating.eloRating, opponentRating?.eloRating || opponentDefault);
      const change = Math.round(32 * (resultScore - expected));
      participant.rank = ordered.findIndex(item => item.id === participant.id) + 1;
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
      rating.lastMatchAt = new Date();
      participant.eloAfter = rating.eloRating;
      participant.eloChange = change;
      await this.arenaRatingRepo.save(rating);
      await this.arenaMatchParticipantRepo.save(participant);
    }
  }

  private async answerAsBot(matchId: string, botUserId: string) {
    const participant = await this.getParticipant(matchId, botUserId);
    const match = await this.arenaMatchRepo.findOne({
      where: { id: matchId },
      relations: { matchQuestions: { question: { questionType: true, currentVersion: { options: true } } } },
    });
    const answers = (match?.matchQuestions || []).map(matchQuestion => {
      const question = matchQuestion.question as QuestionEntity;
      const options = question.currentVersion.options || [];
      const correct = options.find(item => item.isCorrect);
      const random = options[Math.floor(Math.random() * Math.max(options.length, 1))];
      const selected = Math.random() < 0.5 && correct ? correct : random;
      const answerJson = selected ? { optionKey: selected.optionKey } : {};
      const result = gradeAnswer({
        typeCode: question.questionType.code,
        options,
        correctAnswerJson: question.currentVersion.correctAnswerJson,
        answerJson,
      });
      return this.arenaMatchAnswerRepo.create({
        id: uuidv4(),
        matchParticipantId: participant.id,
        arenaMatchQuestionId: matchQuestion.id,
        answerJson,
        isCorrect: result.isCorrect,
        timeTakenMs: 1500 + Math.floor(Math.random() * 4000),
        answeredAt: new Date(),
        createdBy: botUserId,
      });
    });
    await this.arenaMatchAnswerRepo.save(answers);
    await this.recountParticipant(participant.id);
  }
}
