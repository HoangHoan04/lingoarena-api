import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { ArenaModule } from '../arena';
import { UserArenaController } from '../arena/controllers/user-arena.controller';
import { AssessmentModule } from '../assessment';
import { UserAssessmentController } from '../assessment/controllers/user-assessment.controller';
import { AuthModule } from '../auth';
import { UserAuthController } from '../auth/controllers/user-auth.controller';
import { ClassroomModule } from '../classroom';
import { UserClassroomController } from '../classroom/controllers/user-classroom.controller';
import { CommerceModule } from '../commerce';
import { UserCommerceController } from '../commerce/controllers/user-commerce.controller';
import { PREFIX_MODULE } from '../config-module';
import { CourseModule } from '../course';
import { UserCourseController } from '../course/controllers/user-course.controller';
import { ExamModule } from '../exam';
import { UserExamController } from '../exam/controllers/user-exam.controller';
import { GamificationModule } from '../gamification';
import { UserGamificationController } from '../gamification/controllers/user-gamification.controller';
import { GrammarModule } from '../grammar';
import { UserGrammarController } from '../grammar/controllers/user-grammar.controller';
import { LearningModule } from '../learning';
import { UserLearningController } from '../learning/controllers/user-learning.controller';
import { LeaderboardModule } from '../leaderboard';
import { UserLeaderboardController } from '../leaderboard/controllers/user-leaderboard.controller';
import { MediaModule } from '../media';
import { UserMediaController } from '../media/controllers/user-media.controller';
import { NotificationModule } from '../notification';
import { UserNotificationController } from '../notification/controllers/user-notification.controller';
import { NotifyModule } from '../notify';
import { QuestionModule } from '../question';
import { UserQuestionController } from '../question/controllers/user-question.controller';
import { TranslateModule } from '../translate';
import { UserTranslateController } from '../translate/controllers/user-translate.controller';
import { SupportModule } from '../support';
import { UserSupportController } from '../support/controllers/user-support.controller';
import { VietQrModule } from '../vietQr';
import { VietQrController } from '../vietQr/vietQr.controller';
import { VocabularyModule } from '../vocabulary';
import { UserVocabularyController } from '../vocabulary/controllers/user-vocabulary.controller';
import { ZaloModule } from '../zalo';
import { ZaloController } from '../zalo/zalo.controller';

@ChildModule({
  prefix: PREFIX_MODULE.user,
  controllers: [
    UserAuthController,
    ZaloController,
    VietQrController,
    UserExamController,
    UserCourseController,
    UserQuestionController,
    UserTranslateController,
    UserAssessmentController,
    UserVocabularyController,
    UserGrammarController,
    UserCommerceController,
    UserClassroomController,
    UserNotificationController,
    UserSupportController,
    UserMediaController,
    UserGamificationController,
    UserArenaController,
    UserLeaderboardController,
    UserLearningController,
  ],
  imports: [
    AuthModule,
    ZaloModule,
    NotifyModule,
    VietQrModule,
    ExamModule,
    CourseModule,
    QuestionModule,
    TranslateModule,
    AssessmentModule,
    VocabularyModule,
    GrammarModule,
    LearningModule,
    CommerceModule,
    ClassroomModule,
    NotificationModule,
    SupportModule,
    MediaModule,
    GamificationModule,
    ArenaModule,
    LeaderboardModule,
  ],
  exports: [],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
