import {
  CourseEnrollmentEntity,
  CourseEntity,
  CourseReviewEntity,
  CourseSectionEntity,
  LessonBlockEntity,
  LessonEntity,
  LessonProgressEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(CourseEntity)
export class CourseRepo extends PrimaryRepo<CourseEntity> {}

@CustomRepository(CourseSectionEntity)
export class CourseSectionRepo extends PrimaryRepo<CourseSectionEntity> {}

@CustomRepository(LessonEntity)
export class LessonRepo extends PrimaryRepo<LessonEntity> {}

@CustomRepository(LessonBlockEntity)
export class LessonBlockRepo extends PrimaryRepo<LessonBlockEntity> {}

@CustomRepository(CourseEnrollmentEntity)
export class CourseEnrollmentRepo extends PrimaryRepo<CourseEnrollmentEntity> {}

@CustomRepository(LessonProgressEntity)
export class LessonProgressRepo extends PrimaryRepo<LessonProgressEntity> {}

@CustomRepository(CourseReviewEntity)
export class CourseReviewRepo extends PrimaryRepo<CourseReviewEntity> {}
