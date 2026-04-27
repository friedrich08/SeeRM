import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AccessRoute } from './components/auth/AccessRoute';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Kanban from './pages/Kanban';
import Clients from './pages/Clients';
import DevisList from './pages/DevisList';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import ActiveTasks from './pages/ActiveTasks';
import History from './pages/History';
import Notifications from './pages/Notifications';
import ClientPortal from './pages/ClientPortal';
import CalendarPage from './pages/CalendarPage';
import ClientProfile from './pages/ClientProfile';
import { useAuthStore } from './store/useAuthStore';

// Root redirect based on role
const RootRedirect = () => {
    const user = useAuthStore(state => state.user);
    if (!user) return <Navigate to="/auth" />;
    if (user.role === 'CLIENT') return <Navigate to="/portal" />;
    return <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />
        
        <Route
          element={
            <ProtectedRoute>
              <MainLayout>
                <Outlet />
              </MainLayout>
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<AccessRoute module="system"><Analytics /></AccessRoute>} />
          <Route path="/portal" element={<ClientPortal />} />
          <Route path="/clients" element={<AccessRoute module="clients"><Clients /></AccessRoute>} />
          <Route path="/clients/:id" element={<AccessRoute module="clients"><ClientProfile /></AccessRoute>} />
          <Route path="/pipeline" element={<AccessRoute module="pipeline"><Kanban /></AccessRoute>} />
          <Route path="/finance" element={<AccessRoute module="finance"><DevisList /></AccessRoute>} />
          <Route path="/chat" element={<AccessRoute module="chat"><Chat /></AccessRoute>} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/active" element={<AccessRoute module="pipeline"><ActiveTasks /></AccessRoute>} />
          <Route path="/past" element={<AccessRoute module="pipeline"><History /></AccessRoute>} />
          <Route path="/settings" element={<AccessRoute module="system"><Settings /></AccessRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
