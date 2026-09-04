import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { PaginationDto, UserDto } from '~/dto';
import { UserDailyActivityEntity, UserErrorItemEntity } from '~/entities';
import {
  AssessmentRepo,
  ExamTypeRepo,
  GrammarStructureRepo,
  LearningPathItemRepo,
  LearningPathRepo,
  LessonRepo,
  UserDailyActivityRepo,
  UserErrorItemRepo,
  UserLearningGoalRepo,
  UserMasteryRepo,
  VocabularyDeckRepo,
} from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { GamificationService } from '../../gamification/service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import {
  CompleteLearningPathItemDto,
  CreateLearningGoalDto,
  FilterUserErrorItemsDto,
} from '../dto';

@Injectable()
export class LearningService {
  constructor(
    private readonly userLearningGoalRepo: UserLearningGoalRepo,
    private readonly examTypeRepo: ExamTypeRepo,
    private readonly vocabularyDeckRepo: VocabularyDeckRepo,
    private readonly grammarStructureRepo: GrammarStructureRepo,
    private readonly lessonRepo: LessonRepo,
    private readonly assessmentRepo: AssessmentRepo,
    private readonly learningPathRepo: LearningPathRepo,
    private readonly learningPathItemRepo: LearningPathItemRepo,
    private readonly userMasteryRepo: UserMasteryRepo,
    private readonly userErrorItemRepo: UserErrorItemRepo,
    private readonly userDailyActivityRepo: UserDailyActivityRepo,
    private readonly gamificationService: GamificationService,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  private addDays(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private actorName(user: UserDto) {
    return user.fullName || user.name || user.username || user.email || 'User';
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

  async createGoal(dto: CreateLearningGoalDto, user: UserDto) {
    const examType = await this.examTypeRepo.findOne({
      where: { id: dto.examTypeId, isDeleted: false },
    });
    if (!examType)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.exam_type'));

    await this.userLearningGoalRepo.update(
      { userId: user.id, isCurrent: true },
      { isCurrent: false },
    );
    const goal = await this.userLearningGoalRepo.save(
      this.userLearningGoalRepo.create({
        id: uuidv4(),
        userId: user.id,
        examTypeId: dto.examTypeId,
        currentScore: dto.currentScore,
        targetScore: dto.targetScore,
        examDate: dto.examDate,
        minutesPerDay: dto.minutesPerDay ?? 30,
        daysPerWeek: dto.daysPerWeek ?? 5,
        isCurrent: true,
        startedAt: new Date(),
        createdBy: user.id,
      }),
    );
    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'UserLearningGoalEntity',
      goal.id,
      'Tạo mục tiêu học tập',
    );
    return this.findGoal(goal.id, user);
  }

  async getGoals(user: UserDto) {
    const data = await this.userLearningGoalRepo.find({
      where: { userId: user.id, isDeleted: false },
      order: { isCurrent: 'DESC', createdAt: 'DESC' },
      relations: { examType: true },
    });
    return { data: transformKeys(data) };
  }

  async getCurrentGoal(user: UserDto) {
    const goal = await this.userLearningGoalRepo.findOne({
      where: { userId: user.id, isCurrent: true, isDeleted: false },
      relations: { examType: true },
    });
    if (!goal)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.learning_goal'));
    return { data: transformKeys(goal) };
  }

  private async findGoal(id: string, user: UserDto) {
    const goal = await this.userLearningGoalRepo.findOne({
      where: { id, userId: user.id, isDeleted: false },
      relations: { examType: true },
    });
    if (!goal)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.learning_goal'));
    return { data: transformKeys(goal) };
  }

  private async getRequiredCurrentGoal(user: UserDto) {
    const goal = await this.userLearningGoalRepo.findOne({
      where: { userId: user.id, isCurrent: true, isDeleted: false },
    });
    if (!goal)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.learning_goal'));
    return goal;
  }

  async generatePath(user: UserDto) {
    const goal = await this.getRequiredCurrentGoal(user);
    const activePath = await this.learningPathRepo.findOne({
      where: {
        userId: user.id,
        goalId: goal.id,
        status: enumData.LEARNING_PATH_STATUS.ACTIVE.code,
        isDeleted: false,
      },
    });
    if (activePath) {
      activePath.status = enumData.LEARNING_PATH_STATUS.SUPERSEDED.code;
      activePath.updatedBy = user.id;
      await this.learningPathRepo.save(activePath);
    }

    const path = await this.learningPathRepo.save(
      this.learningPathRepo.create({
        id: uuidv4(),
        userId: user.id,
        goalId: goal.id,
        version: (activePath?.version || 0) + 1,
        status: enumData.LEARNING_PATH_STATUS.ACTIVE.code,
        generatedBy: enumData.LEARNING_PATH_GENERATOR.RULE_ENGINE.code,
        generatedAt: new Date(),
        createdBy: user.id,
      }),
    );

    const [deck, assessment, lesson, grammar] = await Promise.all([
      this.vocabularyDeckRepo.findOne({
        where: { isDeleted: false },
        order: { createdAt: 'DESC' },
      }),
      this.assessmentRepo.findOne({
        where: { isDeleted: false },
        order: { createdAt: 'DESC' },
      }),
      this.lessonRepo.findOne({
        where: { isDeleted: false },
        order: { createdAt: 'DESC' },
      }),
      this.grammarStructureRepo.findOne({
        where: { isDeleted: false },
        order: { createdAt: 'DESC' },
      }),
    ]);

    const resources = [
      deck && {
        itemType: enumData.LEARNING_PATH_ITEM_TYPE.FLASHCARD_REVIEW.code,
        itemId: deck.id,
        title: deck.title,
        href: `/vocabulary/${deck.slug}`,
      },
      assessment && {
        itemType: enumData.LEARNING_PATH_ITEM_TYPE.MOCK_EXAM.code,
        itemId: assessment.id,
        title: assessment.title,
        href: `/questions/practice?assessmentId=${assessment.id}`,
      },
      lesson && {
        itemType: enumData.LEARNING_PATH_ITEM_TYPE.LESSON.code,
        itemId: lesson.id,
        title: lesson.title,
        href: `/courses/lesson/${lesson.id}`,
      },
      grammar && {
        itemType: enumData.LEARNING_PATH_ITEM_TYPE.PRACTICE_SET.code,
        itemId: grammar.id,
        title: grammar.title,
        href: `/grammar/${grammar.id}`,
      },
    ].filter(Boolean) as Array<{ itemType: string; itemId: string; title: string; href: string }>;

    await this.learningPathItemRepo.save(
      resources.map((item, index) =>
        this.learningPathItemRepo.create({
          id: uuidv4(),
          learningPathId: path.id,
          itemType: item.itemType,
          itemId: item.itemId,
          scheduledDate: this.addDays(index),
          sortOrder: index + 1,
          status: enumData.PROGRESS_STATUS.NOT_STARTED.code,
          reasonJson: { title: item.title, href: item.href },
          createdBy: user.id,
        }),
      ),
    );

    await this.writeLog(
      user,
      enumData.ACTION_LOG.CREATE.code,
      'LearningPathEntity',
      path.id,
      'Tạo lộ trình học tập',
    );
    return this.getCurrentPath(user);
  }

  async getCurrentPath(user: UserDto) {
    const path = await this.learningPathRepo.findOne({
      where: {
        userId: user.id,
        status: enumData.LEARNING_PATH_STATUS.ACTIVE.code,
        isDeleted: false,
      },
      relations: { goal: { examType: true }, items: true },
      order: { createdAt: 'DESC' },
    });
    if (!path)
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.learning_path'));
    path.items = (path.items || []).sort((a, b) => {
      const day = String(a.scheduledDate).localeCompare(String(b.scheduledDate));
      return day || (a.sortOrder || 0) - (b.sortOrder || 0);
    });
    return { data: transformKeys(path) };
  }

  async completePathItem(id: string, dto: CompleteLearningPathItemDto, user: UserDto) {
    const item = await this.learningPathItemRepo.findOne({
      where: { id, isDeleted: false },
      relations: { learningPath: true },
    });
    if (!item || item.learningPath?.userId !== user.id) {
      throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.learning_path'));
    }

    item.status = enumData.PROGRESS_STATUS.COMPLETED.code;
    item.completedAt = new Date();
    item.updatedBy = user.id;
    await this.learningPathItemRepo.save(item);

    const questionsAnswered =
      dto.questionsAnswered ??
      (item.itemType === enumData.LEARNING_PATH_ITEM_TYPE.PRACTICE_SET.code ? 1 : 0);
    await this.bumpDailyActivity(user.id, {
      lessonsCompleted: item.itemType === enumData.LEARNING_PATH_ITEM_TYPE.LESSON.code ? 1 : 0,
      questionsAnswered,
      vocabReviewed:
        item.itemType === enumData.LEARNING_PATH_ITEM_TYPE.FLASHCARD_REVIEW.code ? 1 : 0,
    });

    if (item.itemType === enumData.LEARNING_PATH_ITEM_TYPE.PRACTICE_SET.code) {
      await this.upsertMastery(user.id, enumData.MASTERY_ENTITY_TYPE.GRAMMAR.code, item.itemId);
    }
    if (item.itemType === enumData.LEARNING_PATH_ITEM_TYPE.FLASHCARD_REVIEW.code) {
      await this.upsertMastery(user.id, enumData.MASTERY_ENTITY_TYPE.TOPIC.code, item.itemId);
    }

    const pointReason =
      item.itemType === enumData.LEARNING_PATH_ITEM_TYPE.LESSON.code
        ? enumData.POINT_REASON.LESSON.code
        : item.itemType === enumData.LEARNING_PATH_ITEM_TYPE.MOCK_EXAM.code
          ? enumData.POINT_REASON.ASSESSMENT.code
          : enumData.POINT_REASON.REVIEW.code;
    await this.gamificationService.awardPoints(
      user.id,
      10,
      pointReason,
      'learning_path_item',
      item.id,
    );

    return { data: transformKeys(item) };
  }

  async getErrors(body: PaginationDto<FilterUserErrorItemsDto>, user: UserDto) {
    const { skip = 0, take = 20, where = {} as FilterUserErrorItemsDto } = body;
    const whereCon: FindOptionsWhere<UserErrorItemEntity>[] = [
      {
        userId: user.id,
        isDeleted: false,
        ...(where.isResolved !== undefined && where.isResolved !== null
          ? { isResolved: Boolean(where.isResolved) }
          : {}),
      },
    ];
    if (where.keyword) {
      whereCon[0].description = UnaccentILike(`%${where.keyword}%`);
      whereCon.push({
        userId: user.id,
        isDeleted: false,
        ...(where.isResolved !== undefined && where.isResolved !== null
          ? { isResolved: Boolean(where.isResolved) }
          : {}),
        wrongText: UnaccentILike(`%${where.keyword}%`),
      });
    }
    const [data, total] = await this.userErrorItemRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { lastOccurredAt: 'DESC' },
    });
    return { data: transformKeys(data), total };
  }

  async getTodayActivity(user: UserDto) {
    const activity = await this.getOrCreateDailyActivity(user.id);
    return { data: transformKeys(activity) };
  }

  async bumpDailyActivity(userId: string, inc: Partial<UserDailyActivityEntity>) {
    const activity = await this.getOrCreateDailyActivity(userId);
    activity.studyMinutes += inc.studyMinutes || 0;
    activity.lessonsCompleted += inc.lessonsCompleted || 0;
    activity.questionsAnswered += inc.questionsAnswered || 0;
    activity.vocabReviewed += inc.vocabReviewed || 0;
    activity.arenaMatches += inc.arenaMatches || 0;
    activity.pointsEarned += inc.pointsEarned || 0;
    return this.userDailyActivityRepo.save(activity);
  }

  private async getOrCreateDailyActivity(userId: string) {
    const today = this.today();
    let activity = await this.userDailyActivityRepo.findOne({
      where: { userId, activityDate: today },
    });
    if (!activity) {
      activity = await this.userDailyActivityRepo.save(
        this.userDailyActivityRepo.create({
          id: uuidv4(),
          userId,
          activityDate: today,
          studyMinutes: 0,
          lessonsCompleted: 0,
          questionsAnswered: 0,
          vocabReviewed: 0,
          arenaMatches: 0,
          pointsEarned: 0,
          streakCount: 0,
          goalMet: false,
          createdBy: userId,
        }),
      );
    }
    return activity;
  }

  private async upsertMastery(userId: string, entityType: string, entityId: string) {
    const found = await this.userMasteryRepo.findOne({
      where: { userId, targetType: entityType, targetId: entityId },
    });
    if (found) {
      found.practiceCount += 1;
      found.correctCount += 1;
      found.masteryScore = Math.min(100, Number(found.masteryScore || 0) + 5);
      found.lastPracticedAt = new Date();
      return this.userMasteryRepo.save(found);
    }
    return this.userMasteryRepo.save(
      this.userMasteryRepo.create({
        id: uuidv4(),
        userId,
        targetType: entityType,
        targetId: entityId,
        masteryScore: 10,
        practiceCount: 1,
        correctCount: 1,
        incorrectCount: 0,
        lastPracticedAt: new Date(),
        createdBy: userId,
      }),
    );
  }
}
