import {
  CourseEnrollmentEntity,
  CourseEntity,
  CourseInstructorEntity,
  CourseReviewEntity,
  CourseSectionEntity,
  CourseVersionEntity,
  LessonBlockEntity,
  LessonBlockItemEntity,
  LessonBlockProgressEntity,
  LessonEntity,
  LessonProgressEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(CourseEntity)
export class CourseRepo extends PrimaryRepo<CourseEntity> {}

@CustomRepository(CourseVersionEntity)
export class CourseVersionRepo extends PrimaryRepo<CourseVersionEntity> {}

@CustomRepository(CourseInstructorEntity)
export class CourseInstructorRepo extends PrimaryRepo<CourseInstructorEntity> {}

@CustomRepository(CourseSectionEntity)
export class CourseSectionRepo extends PrimaryRepo<CourseSectionEntity> {}

@CustomRepository(LessonEntity)
export class LessonRepo extends PrimaryRepo<LessonEntity> {}

@CustomRepository(LessonBlockEntity)
export class LessonBlockRepo extends PrimaryRepo<LessonBlockEntity> {}

@CustomRepository(LessonBlockItemEntity)
export class LessonBlockItemRepo extends PrimaryRepo<LessonBlockItemEntity> {}

@CustomRepository(CourseEnrollmentEntity)
export class CourseEnrollmentRepo extends PrimaryRepo<CourseEnrollmentEntity> {}

@CustomRepository(CourseReviewEntity)
export class CourseReviewRepo extends PrimaryRepo<CourseReviewEntity> {}

@CustomRepository(LessonProgressEntity)
export class LessonProgressRepo extends PrimaryRepo<LessonProgressEntity> {}

@CustomRepository(LessonBlockProgressEntity)
export class LessonBlockProgressRepo extends PrimaryRepo<LessonBlockProgressEntity> {}
