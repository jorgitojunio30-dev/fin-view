import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, TrendingDown, CreditCard, BarChart3
} from 'lucide-react';
import './BottomNav.css';

const itens = [
  { caminho: '/', icone: LayoutDashboard, rotulo: 'Home' },
  { caminho: '/receitas', icone: TrendingUp, rotulo: 'Receitas' },
  { caminho: '/despesas', icone: TrendingDown, rotulo: 'Despesas' },
  { caminho: '/cartoes', icone: CreditCard, rotulo: 'Cartões' },
  { caminho: '/relatorios', icone: BarChart3, rotulo: 'Relatórios' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" id="bottom-nav">
      {itens.map((item) => (
        <NavLink
          key={item.caminho}
          to={item.caminho}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'ativo' : ''}`}
          end={item.caminho === '/'}
        >
          <item.icone size={20} />
          <span>{item.rotulo}</span>
        </NavLink>
      ))}
    </nav>
  );
}
