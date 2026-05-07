import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="spinner-pagina">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
