import type { DiaryView } from './types'

export const MOOD_EMOJIS = ['😞', '😕', '😐', '🙂', '😄']

export function moodEmoji(mood: number | null | undefined): string {
  return mood != null && mood >= 1 && mood <= 5 ? MOOD_EMOJIS[mood - 1] : '—'
}

/** How many of the 11 check-in questions have an answer. */
export function answeredCount(entry: DiaryView | null | undefined): number {
  if (!entry) return 0
  let count = 0
  if (entry.mood) count++
  if (entry.energy) count++
  if ((entry.waterCups ?? 0) > 0) count++
  if (entry.moved !== null && entry.moved !== undefined) count++
  if (entry.tags?.length) count++
  if (entry.morningIntent) count++
  if (entry.highlights) count++
  if (entry.drained) count++
  if (entry.gratitude) count++
  if (entry.eveningReview) count++
  if (entry.body) count++
  return count
}

export const TOTAL_QUESTIONS = 11
