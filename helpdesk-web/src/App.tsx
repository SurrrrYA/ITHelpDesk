import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { RealtimeProvider } from './contexts/RealtimeContext'
import { RequireAuth } from './components/auth/RequireAuth'
import { RoleGuard } from './components/auth/RoleGuard'
import { AppLayout } from './components/layout/AppLayout'
import { ArticlesPage } from './pages/ArticlesPage'
import { CreateTicketPage } from './pages/CreateTicketPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { TicketDetailPage } from './pages/TicketDetailPage'
import { TicketsPage } from './pages/TicketsPage'
import { AssetsPage } from './pages/admin/AssetsPage'
import { CategoriesPage } from './pages/admin/CategoriesPage'
import { SlaPoliciesPage } from './pages/admin/SlaPoliciesPage'
import { UsersPage } from './pages/admin/UsersPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="tickets" element={<TicketsPage />} />
                <Route path="tickets/new" element={<CreateTicketPage />} />
                <Route path="tickets/:id" element={<TicketDetailPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="articles" element={<ArticlesPage />} />

                <Route element={<RoleGuard roles={['admin']} />}>
                  <Route path="admin/categories" element={<CategoriesPage />} />
                  <Route path="admin/sla" element={<SlaPoliciesPage />} />
                  <Route path="admin/users" element={<UsersPage />} />
                  <Route path="admin/assets" element={<AssetsPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
