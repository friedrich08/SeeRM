import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Clients from './pages/Clients';
import DevisList from './pages/DevisList';
import Chat from './pages/Chat';

// Placeholder components for other pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
    <h1 className="text-3xl font-bold mb-4">{title}</h1>
    <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
      Cette section est en cours de développement.
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/pipeline" element={<Kanban />} />
          <Route path="/finance" element={<DevisList />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/calendar" element={<Placeholder title="Calendrier" />} />
          <Route path="/notifications" element={<Placeholder title="Notifications" />} />
          <Route path="/active" element={<Placeholder title="Métriques Actives" />} />
          <Route path="/past" element={<Placeholder title="Métriques Passées" />} />
          <Route path="/settings" element={<Placeholder title="Paramètres" />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
