import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RotaProtegida from './components/Layout/ProtectedRoute';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import BottomNav from './components/Layout/BottomNav';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Revenues from './pages/Revenues';
import Expenses from './pages/Expenses';
import Categories from './pages/Categories';
import Cards from './pages/Cards';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { useAuth } from './hooks/useAuth';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="conteudo-principal">
        <Header />
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

function AppRoutes() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="spinner-pagina">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={!usuario ? <Login /> : <Navigate to="/" />} />
      <Route path="/cadastro" element={!usuario ? <Register /> : <Navigate to="/" />} />
      <Route path="/recuperar-senha" element={!usuario ? <ForgotPassword /> : <Navigate to="/" />} />

      {/* Rotas Protegidas */}
      <Route path="/" element={
        <RotaProtegida>
          <AppLayout><Dashboard /></AppLayout>
        </RotaProtegida>
      } />
      <Route path="/receitas" element={
        <RotaProtegida>
          <AppLayout><Revenues /></AppLayout>
        </RotaProtegida>
      } />
      <Route path="/despesas" element={
        <RotaProtegida>
          <AppLayout><Expenses /></AppLayout>
        </RotaProtegida>
      } />
      <Route path="/cartoes" element={
        <RotaProtegida>
          <AppLayout><Cards /></AppLayout>
        </RotaProtegida>
      } />
      <Route path="/carteiras" element={
        <RotaProtegida>
          <AppLayout><Accounts /></AppLayout>
        </RotaProtegida>
      } />
      <Route path="/categorias" element={
        <RotaProtegida>
          <AppLayout><Categories /></AppLayout>
        </RotaProtegida>
      } />
      <Route path="/relatorios" element={
        <RotaProtegida>
          <AppLayout><Reports /></AppLayout>
        </RotaProtegida>
      } />
      <Route path="/configuracoes" element={
        <RotaProtegida>
          <AppLayout><Settings /></AppLayout>
        </RotaProtegida>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <WalletProvider>
            <AppRoutes />
          </WalletProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
