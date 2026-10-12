import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import PlaceholderPage from '../components/PlaceholderPage'
import ProtectedRoute from '../components/ProtectedRoute'
import LoginPage from '../features/auth/LoginPage'
import CalmPage from '../features/calm/CalmPage'
import ExercisePlayerPage from '../features/calm/ExercisePlayerPage'
import SosPage from '../features/calm/SosPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import DiaryPage from '../features/diary/DiaryPage'
import HealthPage from '../features/health/HealthPage'

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
      { path: 'health', element: <HealthPage /> },
      {
        path: 'garden',
        element: (
          <PlaceholderPage icon="🪴" title="Garden" phase={2}>
            Where gems bloom: plants grow with care, and calm themes unlock with what you
            have earned.
          </PlaceholderPage>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
