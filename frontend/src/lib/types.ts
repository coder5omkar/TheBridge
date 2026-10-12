export type UserView = {
  id: number
  email: string
  displayName: string
  timezone: string
  dayStartHour: number
}

export type AuthResponse = {
  token: string
  expiresAt: string
  user: UserView
}

export type AuthStatus = {
  registrationOpen: boolean
}

export type DashboardToday = {
  date: string
  user: { id: number; displayName: string }
  gems: { balance: number; earnedToday: number }
  streak: { current: number; practicedToday: boolean }
}
