import { Injectable } from '@nestjs/common';
import {
  ClassroomRepo,
  ClassroomMemberRepo,
  AssignmentRepo,
  AssignmentSubmissionRepo,
} from '~/repositories';
import { ActionLogService } from '../../action-log/action-log.service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';

@Injectable()
export class ClassroomService {
  constructor(
    private readonly classroomRepo: ClassroomRepo,
    private readonly classroomMemberRepo: ClassroomMemberRepo,
    private readonly assignmentRepo: AssignmentRepo,
    private readonly assignmentSubmissionRepo: AssignmentSubmissionRepo,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}
}
