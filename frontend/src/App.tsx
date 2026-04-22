import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AccessRoute } from './components/auth/AccessRoute';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Clients from './pages/Clients';
import DevisList from './pages/DevisList';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import ActiveTasks from './pages/ActiveTasks';
import History from './pages/History';

const Placeholder = ({ title }: { title: string }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
    <h1 className="text-3xl font-bold mb-4">{title}</h1>
    <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
      Cette section est en cours de developpement.
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout>
                <Outlet />
              </MainLayout>
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<AccessRoute module="clients"><Clients /></AccessRoute>} />
          <Route path="/pipeline" element={<AccessRoute module="pipeline"><Kanban /></AccessRoute>} />
          <Route path="/finance" element={<AccessRoute module="finance"><DevisList /></AccessRoute>} />
          <Route path="/chat" element={<AccessRoute module="chat"><Chat /></AccessRoute>} />
          <Route path="/calendar" element={<Placeholder title="Calendrier" />} />
          <Route path="/notifications" element={<Placeholder title="Notifications" />} />
          <Route path="/active" element={<AccessRoute module="pipeline"><ActiveTasks /></AccessRoute>} />
          <Route path="/past" element={<AccessRoute module="pipeline"><History /></AccessRoute>} />
          <Route path="/settings" element={<AccessRoute module="system"><Settings /></AccessRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
