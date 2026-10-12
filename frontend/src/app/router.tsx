import { createBrowserRouter } from 'react-router-dom'
import AppShell from '../components/AppShell'
import PlaceholderPage from '../components/PlaceholderPage'
import ProtectedRoute from '../components/ProtectedRoute'
import LoginPage from '../features/auth/LoginPage'
import CalmPage from '../features/calm/CalmPage'
import ExercisePlayerPage from '../features/calm/ExercisePlayerPage'
import SosPage from '../features/calm/SosPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import DiaryPage from '../features/diary/DiaryPage'
import SleepPage from '../features/sleep/SleepPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'diary', element: <DiaryPage /> },
      { path: 'calm', element: <CalmPage /> },
      { path: 'calm/sos', element: <SosPage /> },
      { path: 'calm/:slug', element: <ExercisePlayerPage /> },
      { path: 'sleep', element: <SleepPage /> },
      {
        path: 'thoughts',
        element: (
          <PlaceholderPage icon="💭" title="Thoughts" phase={2}>
            A mental inbox: capture the thought, tag it, reframe it when you are ready,
            then release it.
          </PlaceholderPage>
        ),
      },
      {
        path: 'meals',
        element: (
          <PlaceholderPage icon="🍽️" title="Meals" phase={2}>
            Quick logging with habit-first metrics: meal-time regularity, home-cooked
            ratio and hunger — never calorie numerology.
          </PlaceholderPage>
        ),
      },
      {
        path: 'weight',
        element: (
          <PlaceholderPage icon="⚖️" title="Weight" phase={2}>
            Periodic weigh-ins with a 7-day moving average and a goal band, charted next
            to mood and sleep for context.
          </PlaceholderPage>
        ),
      },
      {
        path: 'garden',
        element: (
          <PlaceholderPage icon="🪴" title="Garden" phase={2}>
            Where gems bloom: plants grow with care, and calm themes unlock with what you
            have earned.
          </PlaceholderPage>
        ),
      },
    ],
  },
])
