import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import {
  CourseEnrollmentRepo,
  CourseRepo,
  ExamTypeRepo,
  CourseReviewRepo,
  CourseSectionRepo,
  LessonBlockRepo,
  LessonProgressRepo,
  LessonRepo,
} from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { CourseService } from './service';

@ChildModule({
  providers: [CourseService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([
      CourseRepo,
      ExamTypeRepo,
      CourseSectionRepo,
      LessonRepo,
      LessonBlockRepo,
      CourseEnrollmentRepo,
      CourseReviewRepo,
      LessonProgressRepo,
    ]),
    ActionLogModule,
  ],
  exports: [CourseService],
})
export class CourseModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
