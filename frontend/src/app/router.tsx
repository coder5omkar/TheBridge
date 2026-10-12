import { createBrowserRouter } from 'react-router-dom'
import AppShell from '../components/AppShell'
import PlaceholderPage from '../components/PlaceholderPage'
import ProtectedRoute from '../components/ProtectedRoute'
import LoginPage from '../features/auth/LoginPage'
import DashboardPage from '../features/dashboard/DashboardPage'

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
      {
        path: 'diary',
        element: (
          <PlaceholderPage icon="✍️" title="Diary" phase={1}>
            One entry per day: morning intention, mood, energy, tags and the evening
            review that seals the day.
          </PlaceholderPage>
        ),
      },
      {
        path: 'calm',
        element: (
          <PlaceholderPage icon="🧘" title="Calm" phase={1}>
            Box breathing, 4-7-8, coherent breathing, grounding and body scans — with the
            60-second SOS reset always one tap away.
          </PlaceholderPage>
        ),
      },
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
        path: 'sleep',
        element: (
          <PlaceholderPage icon="🌙" title="Sleep" phase={1}>
            Bed and wake times, quality, and the graphs that show duration, consistency
            and your sleep midpoint.
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
