import { enumData } from '~/common/enums/base.enum';
import { UserVocabularyStateEntity } from '~/entities';

export type SrsSnapshot = {
  state: string;
  stability: number;
  difficulty: number;
  intervalDays: number;
  repetitionCount: number;
  lapseCount: number;
  lastReviewedAt: Date;
  nextReviewAt: Date;
};

const RATING = enumData.FLASHCARD_RATING;
const STATE = enumData.VOCAB_SRS_STATE;

export function normalizeRating(raw?: string): string {
  const value = (raw || '').toUpperCase();
  if (value === RATING.AGAIN.code) return RATING.AGAIN.code;
  if (value === RATING.HARD.code) return RATING.HARD.code;
  if (value === RATING.EASY.code) return RATING.EASY.code;
  return RATING.GOOD.code;
}

export function isCorrectRating(rating: string): boolean {
  return rating === RATING.GOOD.code || rating === RATING.EASY.code;
}

export function applySm2Rating(
  current: Partial<UserVocabularyStateEntity> | null | undefined,
  ratingRaw: string,
  now = new Date(),
): SrsSnapshot {
  const rating = normalizeRating(ratingRaw);
  const oldInterval = current?.intervalDays || 0;
  const repetition = current?.repetitionCount || 0;
  const lapse = current?.lapseCount || 0;
  let difficulty = Number(current?.difficulty ?? 5);

  let intervalDays = oldInterval;
  let repetitionCount = repetition;
  let lapseCount = lapse;
  let state: string = STATE.LEARNING.code;

  if (rating === RATING.AGAIN.code) {
    intervalDays = 0;
    repetitionCount = 0;
    lapseCount = lapse + 1;
    difficulty = Math.min(10, difficulty + 0.8);
    state = lapseCount > 0 ? STATE.LAPSED.code : STATE.LEARNING.code;
  } else if (rating === RATING.HARD.code) {
    intervalDays = Math.max(1, Math.round(oldInterval * 1.2) || 1);
    repetitionCount = repetition + 1;
    difficulty = Math.min(10, difficulty + 0.3);
    state = STATE.LEARNING.code;
  } else if (rating === RATING.EASY.code) {
    intervalDays = oldInterval === 0 ? 4 : Math.round(oldInterval * 3.5);
    repetitionCount = repetition + 1;
    difficulty = Math.max(1, difficulty - 0.3);
    state = intervalDays >= 21 ? STATE.MASTERED.code : STATE.REVIEW.code;
  } else {
    intervalDays = oldInterval === 0 ? 1 : Math.round(oldInterval * 2.5);
    repetitionCount = repetition + 1;
    difficulty = Math.max(1, difficulty - 0.15);
    state = intervalDays >= 21 ? STATE.MASTERED.code : STATE.REVIEW.code;
  }

  const nextReviewAt = new Date(now);
  if (intervalDays <= 0) {
    nextReviewAt.setMinutes(nextReviewAt.getMinutes() + 10);
  } else {
    nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);
  }

  return {
    state,
    stability: intervalDays,
    difficulty: Number(difficulty.toFixed(2)),
    intervalDays,
    repetitionCount,
    lapseCount,
    lastReviewedAt: now,
    nextReviewAt,
  };
}

export function isDue(
  state?: Pick<UserVocabularyStateEntity, 'nextReviewAt'> | null,
  now = new Date(),
) {
  if (!state?.nextReviewAt) return true;
  return new Date(state.nextReviewAt).getTime() <= now.getTime();
}
