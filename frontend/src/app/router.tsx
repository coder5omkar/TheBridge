import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import ProtectedRoute from '../components/ProtectedRoute'
import RouteError from '../components/RouteError'
import LoginPage from '../features/auth/LoginPage'
import CalmPage from '../features/calm/CalmPage'
import ExercisePlayerPage from '../features/calm/ExercisePlayerPage'
import SosPage from '../features/calm/SosPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import DiaryPage from '../features/diary/DiaryPage'
import HealthPage from '../features/health/HealthPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'diary', element: <DiaryPage /> },
      { path: 'calm', element: <CalmPage /> },
      { path: 'calm/sos', element: <SosPage /> },
      { path: 'calm/:slug', element: <ExercisePlayerPage /> },
      { path: 'health', element: <HealthPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
