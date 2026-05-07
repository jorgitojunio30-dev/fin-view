import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { reportService } from '../services/reports';
import Card from '../components/UI/Card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Calendar, ChevronLeft, ChevronRight, BarChart3, PieChart as PieIcon, Activity, CreditCard } from 'lucide-react';
import './Dashboard.css';

export default function Reports() {
  const { usuario } = useAuth();
  const [evolucao, setEvolucao] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [crescimentoFatura, setCrescimentoFatura] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  const dataAtual = new Date();
  const [mesAtual, setMesAtual] = useState(`${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}`);

  useEffect(() => {
    carregarRelatorios();
  }, [usuario, mesAtual]);

  async function carregarRelatorios() {
    if (!usuario) return;
    try {
      setCarregando(true);
      const token = await usuario.getIdToken();
      
      const [dadosEvolucao, dadosCategorias, dadosCrescimento] = await Promise.all([
        reportService.getEvolution(token, 6),
        reportService.getCategories(token, mesAtual),
        reportService.getInvoiceGrowth(token, mesAtual)
      ]);
      
      setEvolucao(dadosEvolucao);
      setCategorias(dadosCategorias);
      setCrescimentoFatura(dadosCrescimento);
    } catch (erro) {
      console.error("Erro ao carregar relatórios:", erro);
    } finally {
      setCarregando(false);
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

  return (
    <div className="pagina-conteudo">
      <div className="pagina-titulo">
        <div>
          <h1>Relatórios e Gráficos</h1>
          <p>Análise detalhada do seu desempenho financeiro</p>
        </div>
      </div>

      <div className="dashboard-secoes" style={{ gridTemplateColumns: '1fr' }}>
        <Card className="dashboard-secao">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-sm)', marginBottom: '20px' }}>
            <Activity size={20} className="cor-primaria" />
            <h3>Evolução Mensal (Últimos 6 meses)</h3>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                <XAxis dataKey="label" stroke="var(--cor-texto-terciario)" />
                <YAxis stroke="var(--cor-texto-terciario)" />
                <Tooltip 
                  contentStyle={{ background: 'var(--cor-fundo-card)', border: '1px solid var(--cor-borda)', borderRadius: '8px' }}
                  formatter={(value) => formatarMoeda(value)}
                />
                <Legend />
                <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="dashboard-secoes" style={{ marginTop: 'var(--espacamento-lg)' }}>
        <Card className="dashboard-secao">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-sm)', marginBottom: '20px' }}>
            <CreditCard size={20} className="cor-primaria" />
            <h3>Crescimento da Fatura ({formatarMes(mesAtual)})</h3>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            {crescimentoFatura.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={crescimentoFatura}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--cor-primaria)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--cor-primaria)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                  <XAxis dataKey="label" stroke="var(--cor-texto-terciario)" />
                  <YAxis stroke="var(--cor-texto-terciario)" />
                  <Tooltip 
                    contentStyle={{ background: 'var(--cor-fundo-card)', border: '1px solid var(--cor-borda)', borderRadius: '8px' }}
                    formatter={(value) => formatarMoeda(value)}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--cor-primaria)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="dashboard-placeholder">
                <p>Nenhum gasto no cartão para este período.</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="dashboard-secao">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-sm)' }}>
              <PieIcon size={20} className="cor-primaria" />
              <h3>Gastos por Categoria</h3>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--cor-fundo-input)', padding: '4px 12px', borderRadius: 'var(--raio-md)', border: '1px solid var(--cor-borda)' }}>
              <button onClick={() => mudarMes(-1)} style={{ background: 'none', border: 'none', color: 'var(--cor-texto-secundario)', cursor: 'pointer' }}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize', minWidth: '100px', textAlign: 'center' }}>
                {formatarMes(mesAtual)}
              </span>
              <button onClick={() => mudarMes(1)} style={{ background: 'none', border: 'none', color: 'var(--cor-texto-secundario)', cursor: 'pointer' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          <div style={{ width: '100%', height: 350 }}>
            {categorias.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorias}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categorias.map((entry, index) => (
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
                <p>Nenhuma despesa registrada neste mês.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="dashboard-secoes" style={{ marginTop: 'var(--espacamento-lg)', gridTemplateColumns: '1fr' }}>
        <Card className="dashboard-secao">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-sm)', marginBottom: '20px' }}>
            <BarChart3 size={20} className="cor-primaria" />
            <h3>Ranking de Gastos ({formatarMes(mesAtual)})</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--espacamento-xl)' }}>
            {categorias.length === 0 && <p style={{ textAlign: 'center', color: 'var(--cor-texto-terciario)', padding: '40px' }}>Sem dados.</p>}
            {categorias.map((cat, index) => {
              const maxVal = categorias[0].value;
              const percent = (cat.value / maxVal) * 100;
              
              return (
                <div key={cat.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                    <span style={{ fontWeight: 500 }}>{cat.name}</span>
                    <span style={{ fontWeight: 600 }}>{formatarMoeda(cat.value)}</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: 'var(--cor-fundo-input)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: CORES_GRAFICO[index % CORES_GRAFICO.length], borderRadius: '5px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
