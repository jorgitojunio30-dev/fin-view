import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../contexts/WalletContext';
import { dashboardService } from '../services/dashboard';
import { alertService } from '../services/alerts';
import Card, { CardIcone } from '../components/UI/Card';
import {
  Wallet, TrendingUp, TrendingDown, CreditCard, AlertTriangle,
  Calendar, ChevronLeft, ChevronRight, Info, XCircle, ArrowRight
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const { usuario } = useAuth();
  const { carteiraSelecionada } = useWallet();
  const [resumo, setResumo] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  const dataAtual = new Date();
  const [mesAtual, setMesAtual] = useState(`${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}`);

  useEffect(() => {
    carregarDados();
  }, [usuario, mesAtual, carteiraSelecionada]);

  async function carregarDados() {
    if (!usuario) return;
    try {
      setCarregando(true);
      const token = await usuario.getIdToken();
      
      const [dadosResumo, dadosAlertas] = await Promise.all([
        dashboardService.getSummary(token, mesAtual, carteiraSelecionada),
        alertService.getAlerts(token)
      ]);
      
      setResumo(dadosResumo);
      setAlertas(dadosAlertas);
    } catch (erro) {
      console.error("Erro ao carregar dashboard:", erro);
    } finally {
      setCarregando(false);
    }
  }

  function getIconeAlerta(severity) {
    switch (severity) {
      case 'danger': return <XCircle size={18} color="var(--cor-erro)" />;
      case 'warning': return <AlertTriangle size={18} color="var(--cor-alerta)" />;
      default: return <Info size={18} color="var(--cor-info)" />;
    }
  }

  function mudarMes(direcao) {
    const [ano, mes] = mesAtual.split('-');
    let novaData = new Date(parseInt(ano), parseInt(mes) - 1 + direcao, 1);
    setMesAtual(`${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, '0')}`);
  }

  function formatarMes(mesAno) {
    const [ano, mes] = mesAno.split('-');
    const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  }

  const CORES_GRAFICO = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  const dadosBarra = resumo ? [
    { name: 'Receitas', valor: resumo.totalRevenues, color: '#10b981' },
    { name: 'Despesas', valor: resumo.totalExpenses, color: '#ef4444' }
  ] : [];

  return (
    <div className="pagina-conteudo">
      <div className="pagina-titulo">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral das suas finanças</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-sm)', background: 'var(--cor-fundo-card)', padding: '8px 16px', borderRadius: 'var(--raio-borda-md)', border: '1px solid var(--cor-borda)' }}>
          <button onClick={() => mudarMes(-1)} style={{ background: 'none', border: 'none', color: 'var(--cor-texto-secundario)', cursor: 'pointer' }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px', justifyContent: 'center' }}>
            <Calendar size={16} color="var(--cor-texto-secundario)" />
            <span style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '14px' }}>{formatarMes(mesAtual)}</span>
          </div>
          <button onClick={() => mudarMes(1)} style={{ background: 'none', border: 'none', color: 'var(--cor-texto-secundario)', cursor: 'pointer' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {carregando && !resumo ? (
        <div className="spinner-pagina" style={{ minHeight: '300px' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div className="dashboard-cards">
            <Card className="resumo-card">
              <CardIcone icone={Wallet} cor="primario" />
              <span className="resumo-rotulo">Saldo do Mês</span>
              <span className={`resumo-valor ${resumo?.balance >= 0 ? 'resumo-sucesso' : 'resumo-erro'}`}>
                {formatarMoeda(resumo?.balance)}
              </span>
            </Card>

            <Card className="resumo-card">
              <CardIcone icone={TrendingUp} cor="sucesso" />
              <span className="resumo-rotulo">Receitas</span>
              <span className="resumo-valor resumo-sucesso">{formatarMoeda(resumo?.totalRevenues)}</span>
            </Card>

            <Card className="resumo-card">
              <CardIcone icone={TrendingDown} cor="erro" />
              <span className="resumo-rotulo">Despesas</span>
              <span className="resumo-valor resumo-erro">{formatarMoeda(resumo?.totalExpenses)}</span>
            </Card>

            <Card className="resumo-card">
              <CardIcone icone={CreditCard} cor="alerta" />
              <span className="resumo-rotulo">Faturas Abertas</span>
              <span className="resumo-valor resumo-alerta">{formatarMoeda(resumo?.totalOpenInvoices)}</span>
            </Card>
          </div>

          {alertas.length > 0 && (
            <div className="dashboard-alertas">
              {alertas.map(alerta => (
                <div key={alerta.id} className={`alerta-item alerta-${alerta.severity}`}>
                  <div className="alerta-corpo">
                    {getIconeAlerta(alerta.severity)}
                    <span>{alerta.message}</span>
                  </div>
                  {alerta.link && (
                    <Link to={alerta.link} className="alerta-link">
                      Ver detalhes <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="dashboard-secoes">
            <Card className="dashboard-secao">
              <h3>📊 Comparativo</h3>
              <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosBarra}>
                    <XAxis dataKey="name" stroke="var(--cor-texto-terciario)" />
                    <YAxis stroke="var(--cor-texto-terciario)" />
                    <Tooltip 
                      contentStyle={{ background: 'var(--cor-fundo-card)', border: '1px solid var(--cor-borda)', borderRadius: '8px' }}
                      itemStyle={{ fontWeight: 600 }}
                    />
                    <Bar dataKey="valor">
                      {dadosBarra.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="dashboard-secao">
              <h3>🍕 Gastos por Categoria</h3>
              <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
                {resumo?.categorySummary.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resumo.categorySummary}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {resumo.categorySummary.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--cor-fundo-card)', border: '1px solid var(--cor-borda)', borderRadius: '8px' }}
                        formatter={(value) => formatarMoeda(value)}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="dashboard-placeholder">
                    <p>Sem despesas para exibir o gráfico.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
