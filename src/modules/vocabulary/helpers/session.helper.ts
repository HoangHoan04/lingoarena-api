import { enumData } from '~/common/enums/base.enum';
import { UserVocabularyStateEntity, VocabularyEntity } from '~/entities';
import { isDue } from './srs.helper';

const DEFAULT_QUEUE_SIZE = 12;

export function pickStudyQueue(
  words: VocabularyEntity[],
  states: UserVocabularyStateEntity[],
  limit = DEFAULT_QUEUE_SIZE,
): VocabularyEntity[] {
  const stateByVocab = new Map(states.map(item => [item.vocabularyId, item]));
  const now = new Date();

  const due: VocabularyEntity[] = [];
  const fresh: VocabularyEntity[] = [];
  const later: VocabularyEntity[] = [];

  for (const word of words) {
    const state = stateByVocab.get(word.id);
    if (!state) {
      fresh.push(word);
      continue;
    }
    if (isDue(state, now)) due.push(word);
    else later.push(word);
  }

  return [...due, ...fresh, ...later].slice(0, Math.max(1, limit));
}

export function summarizeProgress(total: number, states: UserVocabularyStateEntity[]) {
  const now = new Date();
  let dueCount = 0;
  let learningCount = 0;
  let masteredCount = 0;
  let newCount = total;

  for (const state of states) {
    newCount -= 1;
    if (state.srsState === enumData.VOCAB_SRS_STATE.MASTERED.code) masteredCount += 1;
    else learningCount += 1;
    if (isDue(state, now)) dueCount += 1;
  }

  return {
    total,
    newCount: Math.max(0, newCount),
    dueCount: dueCount + Math.max(0, newCount),
    learningCount,
    masteredCount,
    percentMastered: total ? Math.round((masteredCount / total) * 100) : 0,
  };
}
