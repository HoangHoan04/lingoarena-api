import { ExamStructureEntity, ExamTypeEntity } from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(ExamTypeEntity)
export class ExamTypeRepo extends PrimaryRepo<ExamTypeEntity> {}

@CustomRepository(ExamStructureEntity)
export class ExamStructureRepo extends PrimaryRepo<ExamStructureEntity> {}
