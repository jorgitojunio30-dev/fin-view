import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../contexts/WalletContext';
import { useTheme } from '../../contexts/ThemeContext';
import { alertService } from '../../services/alerts';
import { Bell, User, Landmark, X, ChevronRight, AlertCircle, AlertTriangle, Info, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const { usuario } = useAuth();
  const { carteiras, carteiraSelecionada, setCarteiraSelecionada } = useWallet();
  const { tema, alternarTema } = useTheme();
  const [alertas, setAlertas] = useState([]);
  const [painelAberto, setPainelAberto] = useState(false);

  useEffect(() => {
    async function carregarAlertas() {
      if (!usuario) return;
      try {
        const token = await usuario.getIdToken();
        const dados = await alertService.getAlerts(token);
        setAlertas(dados);
      } catch (erro) {
        console.error("Erro ao carregar alertas:", erro);
      }
    }
    
    carregarAlertas();
    const interval = setInterval(carregarAlertas, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [usuario]);

  const primeiroNome = usuario?.displayName?.split(' ')[0] || 'Usuário';

  function getIconeAlerta(severity) {
    switch (severity) {
      case 'danger': return <AlertCircle size={16} color="var(--cor-erro)" />;
      case 'warning': return <AlertTriangle size={16} color="var(--cor-alerta)" />;
      default: return <Info size={16} color="var(--cor-info)" />;
    }
  }

  return (
    <header className="header" id="header">
      <div className="header-esquerda">
        <h2 className="header-saudacao">
          Olá, <span>{primeiroNome}</span> 👋
        </h2>

        <div className="header-carteira-seletor">
          <Landmark size={16} className="cor-primaria" />
          <select 
            className="header-carteira-select"
            value={carteiraSelecionada}
            onChange={(e) => setCarteiraSelecionada(e.target.value)}
          >
            <option value="">Todas as Carteiras</option>
            {carteiras.map(carteira => (
              <option key={carteira.id} value={carteira.id}>
                {carteira.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="header-direita">
        <button 
          className="header-icone-btn" 
          title={tema === 'light' ? 'Modo escuro' : 'Modo claro'}
          onClick={alternarTema}
        >
          {tema === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div style={{ position: 'relative' }}>
          <button 
            className="header-icone-btn" 
            id="btn-notificacoes" 
            title="Notificações"
            onClick={() => setPainelAberto(!painelAberto)}
          >
            <Bell size={20} />
            {alertas.length > 0 && <span className="header-badge">{alertas.length}</span>}
          </button>

          {painelAberto && (
            <>
              <div className="header-backdrop" onClick={() => setPainelAberto(false)} />
              <div className="header-alerta-painel">
                <div className="alerta-painel-header">
                  <h3>Notificações</h3>
                  <button onClick={() => setPainelAberto(false)}><X size={16} /></button>
                </div>
                <div className="alerta-painel-lista">
                  {alertas.length === 0 ? (
                    <p className="alerta-vazio">Nenhuma notificação importante.</p>
                  ) : (
                    alertas.map(alerta => (
                      <Link 
                        key={alerta.id} 
                        to={alerta.link || '/'} 
                        className={`alerta-item-link alerta-sev-${alerta.severity}`}
                        onClick={() => setPainelAberto(false)}
                      >
                        {getIconeAlerta(alerta.severity)}
                        <div className="alerta-item-content">
                          <p>{alerta.message}</p>
                        </div>
                        <ChevronRight size={14} className="alerta-chevron" />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        <Link to="/configuracoes" className="header-avatar" title="Configurações">
          {usuario?.displayName ? usuario.displayName[0].toUpperCase() : <User size={18} />}
        </Link>
      </div>
    </header>
  );
}
