import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Login } from './pages/login';
import { Inicio } from './pages/inicio';
import { Perfil } from './pages/perfil';
import { Navegación } from './components/Navegación';
import { PrivateRoute } from './components/PrivateRoute';
import { AuthProvider, useAuth } from './components/Auth';
import { PersonasIndex } from './pages/gestionar_personas/index';
import { PersonaForm } from './pages/gestionar_personas/formulario';
import { PersonaDetail } from './pages/gestionar_personas/ver';

function AppContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const hideNavigationRoutes = ['/', '/login', '/registro'];
  const shouldShowNavigation = !hideNavigationRoutes.includes(location.pathname) && isAuthenticated;

  return (
    <div className="min-h-screen">
      {shouldShowNavigation && <Navegación />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/inicio" element={<PrivateRoute><Inicio /></PrivateRoute>} />
        <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
      
        <Route path="/personas" element={<PrivateRoute><PersonasIndex /></PrivateRoute>} />
        <Route path="/personas/crear" element={<PrivateRoute><PersonaForm /></PrivateRoute>} />
        <Route path="/personas/editar/:id" element={<PrivateRoute><PersonaForm /></PrivateRoute>} />
        <Route path="/personas/ver/:id" element={<PrivateRoute><PersonaDetail /></PrivateRoute>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;