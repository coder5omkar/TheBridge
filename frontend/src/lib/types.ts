export type UserView = {
  id: number
  email: string
  displayName: string
  timezone: string
  dayStartHour: number
  heightCm: number | null
}

export type AuthResponse = {
  token: string
  expiresAt: string
  user: UserView
}

export type AuthStatus = {
  registrationOpen: boolean
}

export type Rewards = {
  gemsAwarded: number
  balance: number
  earnedToday: number
}

export type DashboardToday = {
  date: string
  user: { id: number; displayName: string }
  gems: { balance: number; earnedToday: number }
  streak: { current: number; practicedToday: boolean }
  today: {
    diary: { done: boolean; mood: number | null }
    calm: { sessions: number; minutes: number }
    sleep: { logged: boolean; durationMinutes: number | null }
  }
  charts: {
    sleep: { date: string; minutes: number | null; quality: number | null }[]
    calm: { date: string; minutes: number; sessions: number }[]
  }
}

export type DiaryView = {
  id: number
  date: string
  mood: number | null
  energy: number | null
  morningIntent: string | null
  eveningReview: string | null
  body: string | null
  tags: string[]
  waterCups: number | null
  highlights: string | null
  drained: string | null
  gratitude: string | null
  moved: boolean | null
  sealedAt: string | null
  updatedAt: string
}

export type DiaryResponse = {
  entry: DiaryView
  rewards: Rewards
}

export type ExerciseKind = 'breathing' | 'grounding' | 'bodyscan' | 'pmr'

export type ExerciseView = {
  id: number
  slug: string
  name: string
  type: ExerciseKind
  pattern: number[] | Record<string, unknown> | null
  durationOptions: number[]
  description: string | null
  sos: boolean
}

export type CalmSessionResponse = {
  session: {
    id: number
    exerciseId: number
    kind: 'regular' | 'sos'
    startedAt: string
    durationSec: number
    completed: boolean
    gemsAwarded: number
  }
  rewards: Rewards
}

export type SleepView = {
  id: number
  sleepDate: string
  bedTime: string | null
  wakeTime: string | null
  durationMinutes: number | null
  quality: number | null
  delayNote: string | null
}

export type SleepResponse = {
  log: SleepView
  rewards: Rewards
}

export type HealthSummary = {
  heightCm: number | null
  latestWeightKg: number | null
  latestWeightAt: string | null
  change7dKg: number | null
  weights: { date: string; at: string; kg: number }[]
  mealsToday: number
  todayMeals: {
    id: number
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    description: string | null
    homeCooked: boolean | null
    eatenAt: string
  }[]
  mealsWeek: number
  homeCookedRatioWeek: number | null
  bmi: number | null
}

export type HealthSummaryResponse = {
  summary: HealthSummary
  rewards: Rewards
}

export type WeeklyInsights = {
  from: string
  to: string
  gemsEarnedWeek: number
  sleepAvgMinutes: number | null
  sleepNights: number | null
  calmMinutes: number
  calmSessions: number
  moodAvg: number | null
  sealedDays: number
  bullets: { icon: string; text: string }[]
}

export type DaySummary = {
  date: string
  sealed: boolean
  mood: number | null
  calmMinutes: number
  sleepMinutes: number | null
  meals: number
  gems: number
}

export type DayRecord = {
  date: string
  entry: DiaryView | null
  sleep: SleepView | null
  sessions: { exerciseName: string; kind: string; startedAt: string; minutes: number }[]
  meals: {
    id: number
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    description: string | null
    homeCooked: boolean | null
    eatenAt: string
  }[]
  weights: { at: string; kg: number }[]
  gemsEarned: number
}
