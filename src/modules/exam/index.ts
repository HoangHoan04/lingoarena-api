import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { ExamStructureRepo, ExamTypeRepo, AssessmentRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { ExamService } from './service';

@ChildModule({
  providers: [ExamService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([ExamTypeRepo, ExamStructureRepo, AssessmentRepo]),
    ActionLogModule,
  ],
  exports: [ExamService],
})
export class ExamModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
