import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { PermissionModule } from '~/common/guards';
import { ActionLogModule } from '../action-log';
import { AdminActionLogController } from '../action-log/action-log.controller';
import { ArenaModule } from '../arena';
import { AdminArenaController } from '../arena/controllers/admin-arena.controller';
import { AssessmentModule } from '../assessment';
import { AdminAssessmentController } from '../assessment/controllers/admin-assessment.controller';
import { AuthModule } from '../auth';
import { AdminAuthController } from '../auth/controllers/admin-auth.controller';
import { CacheCustomModule } from '../cache';
import { CacheController } from '../cache/cache.controller';
import { ClassroomModule } from '../classroom';
import { AdminClassroomController } from '../classroom/controllers/admin-classroom.controller';
import { PREFIX_MODULE } from '../config-module';
import { ConversationModule } from '../conversation';
import { AdminConversationController } from '../conversation/controllers/admin-conversation.controller';
import { CourseModule } from '../course';
import { AdminCourseController } from '../course/controllers/admin-course.controller';
import { EmailModule } from '../email';
import { EmailController } from '../email/email.controller';
import { ExamModule } from '../exam';
import { AdminExamController } from '../exam/controllers/admin-exam.controller';
import { GamificationModule } from '../gamification';
import { AdminGamificationController } from '../gamification/controllers/admin-gamification.controller';
import { GrammarModule } from '../grammar';
import { AdminGrammarController } from '../grammar/controllers/admin-grammar.controller';
import { LeaderboardModule } from '../leaderboard';
import { AdminLeaderboardController } from '../leaderboard/controllers/admin-leaderboard.controller';
import { LearningModule } from '../learning';
import { MediaModule } from '../media';
import { AdminMediaController } from '../media/controllers/admin-media.controller';
import { NotificationModule } from '../notification';
import { AdminNotificationController } from '../notification/controllers/admin-notification.controller';
import { NotifyModule } from '../notify';
import { NotifyAdminController } from '../notify/controllers/notify.admin.controller';
import { OrganizationModule } from '../organization';
import { AdminOrganizationController } from '../organization/controllers/admin-organization.controller';
import { QuestionModule } from '../question';
import { AdminQuestionController } from '../question/controllers/admin-question.controller';
import { RoleModule } from '../role';
import { AdminRoleController } from '../role/controllers/admin-role.controller';
import { SupportModule } from '../support';
import { AdminSupportController } from '../support/controllers/admin-support.controller';
import { VocabularyModule } from '../vocabulary';
import { AdminVocabularyController } from '../vocabulary/controllers/admin-vocabulary.controller';

@ChildModule({
  prefix: PREFIX_MODULE.admin,
  controllers: [
    AdminAuthController,
    AdminActionLogController,
    EmailController,
    NotifyAdminController,
    CacheController,
    AdminRoleController,
    AdminExamController,
    AdminCourseController,
    AdminQuestionController,
    AdminAssessmentController,
    AdminVocabularyController,
    AdminGrammarController,
    AdminConversationController,
    AdminClassroomController,
    AdminNotificationController,
    AdminOrganizationController,
    AdminSupportController,
    AdminMediaController,
    AdminGamificationController,
    AdminArenaController,
    AdminLeaderboardController,
  ],
  imports: [
    PermissionModule,
    AuthModule,
    ActionLogModule,
    EmailModule,
    NotifyModule,
    CacheCustomModule,
    RoleModule,
    ExamModule,
    CourseModule,
    QuestionModule,
    AssessmentModule,
    VocabularyModule,
    GrammarModule,
    LearningModule,
    ConversationModule,
    ClassroomModule,
    NotificationModule,
    OrganizationModule,
    SupportModule,
    MediaModule,
    GamificationModule,
    ArenaModule,
    LeaderboardModule,
  ],
  exports: [],
})
export class AdminModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
