import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { CourseRepo, CourseVersionRepo, CourseInstructorRepo, CourseSectionRepo, LessonRepo, LessonBlockRepo, LessonBlockItemRepo, CourseEnrollmentRepo, CourseReviewRepo, LessonProgressRepo, LessonBlockProgressRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { CourseService } from './service';

@ChildModule({
  providers: [CourseService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([CourseRepo, CourseVersionRepo, CourseInstructorRepo, CourseSectionRepo, LessonRepo, LessonBlockRepo, LessonBlockItemRepo, CourseEnrollmentRepo, CourseReviewRepo, LessonProgressRepo, LessonBlockProgressRepo]),
    ActionLogModule,
  ],
  exports: [CourseService],
})
export class CourseModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
