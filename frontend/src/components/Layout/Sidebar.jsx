import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, TrendingUp, TrendingDown, CreditCard,
  Landmark, BarChart3, Settings, LogOut, Wallet, Tag
} from 'lucide-react';
import './Sidebar.css';

const itensMenu = [
  { caminho: '/', icone: LayoutDashboard, rotulo: 'Dashboard' },
  { caminho: '/receitas', icone: TrendingUp, rotulo: 'Receitas' },
  { caminho: '/despesas', icone: TrendingDown, rotulo: 'Despesas' },
  { caminho: '/cartoes', icone: CreditCard, rotulo: 'Cartões' },
  { caminho: '/carteiras', icone: Landmark, rotulo: 'Carteiras' },
  { caminho: '/categorias', icone: Tag, rotulo: 'Categorias' },
  { caminho: '/relatorios', icone: BarChart3, rotulo: 'Relatórios' },
  { caminho: '/configuracoes', icone: Settings, rotulo: 'Configurações' },
];

export default function Sidebar() {
  const { sair } = useAuth();
  const navegar = useNavigate();

  async function handleSair() {
    await sair();
    navegar('/login');
  }

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-logo">
        <Wallet size={28} />
        <span>FinView</span>
      </div>

      <nav className="sidebar-nav">
        {itensMenu.map((item) => (
          <NavLink
            key={item.caminho}
            to={item.caminho}
            className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}
            end={item.caminho === '/'}
          >
            <item.icone size={20} />
            <span>{item.rotulo}</span>
          </NavLink>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={handleSair} id="btn-sair">
        <LogOut size={20} />
        <span>Sair</span>
      </button>
    </aside>
  );
}
