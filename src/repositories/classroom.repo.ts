import {
  AssignmentEntity,
  AssignmentSubmissionEntity,
  ClassroomEntity,
  ClassroomMemberEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(ClassroomEntity)
export class ClassroomRepo extends PrimaryRepo<ClassroomEntity> {}

@CustomRepository(ClassroomMemberEntity)
export class ClassroomMemberRepo extends PrimaryRepo<ClassroomMemberEntity> {}

@CustomRepository(AssignmentEntity)
export class AssignmentRepo extends PrimaryRepo<AssignmentEntity> {}

@CustomRepository(AssignmentSubmissionEntity)
export class AssignmentSubmissionRepo extends PrimaryRepo<AssignmentSubmissionEntity> {}
