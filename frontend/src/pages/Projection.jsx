import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { projectionService } from '../services/projections';
import Card from '../components/UI/Card';
import { Calculator, TrendingUp, Lock, CreditCard, ChevronRight, AlertCircle } from 'lucide-react';
import './Dashboard.css';

export default function Projection() {
  const { usuario } = useAuth();
  const [projecao, setProjecao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarProjecao() {
      if (!usuario) return;
      try {
        setCarregando(true);
        const token = await usuario.getIdToken();
        const dados = await projectionService.getNextMonth(token);
        setProjecao(dados);
      } catch (erro) {
        console.error("Erro ao carregar projeção:", erro);
      } finally {
        setCarregando(false);
      }
    }
    carregarProjecao();
  }, [usuario]);

  function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  }

  function formatarMes(mesAno) {
    if (!mesAno) return '';
    const [ano, mes] = mesAno.split('-');
    const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  if (carregando) {
    return (
      <div className="spinner-pagina">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="pagina-conteudo">
      <div className="pagina-titulo">
        <div>
          <h1>Projeção Financeira</h1>
          <p>Visão antecipada para o mês de <strong style={{ color: 'var(--cor-primaria)', textTransform: 'capitalize' }}>{formatarMes(projecao?.targetMonth)}</strong></p>
        </div>
      </div>

      <div className="dashboard-cards">
        <Card className="resumo-card">
          <TrendingUp color="var(--cor-sucesso)" size={24} />
          <span className="resumo-rotulo">Receita Esperada</span>
          <span className="resumo-valor resumo-sucesso">{formatarMoeda(projecao?.expectedRevenue)}</span>
          <p style={{ fontSize: '10px', color: 'var(--cor-texto-terciario)', marginTop: '4px' }}>Média dos últimos 3 meses</p>
        </Card>

        <Card className="resumo-card">
          <Lock color="var(--cor-erro)" size={24} />
          <span className="resumo-rotulo">Comprometido (Fixas)</span>
          <span className="resumo-valor resumo-erro">-{formatarMoeda(projecao?.fixedExpenses.total)}</span>
        </Card>

        <Card className="resumo-card">
          <CreditCard color="var(--cor-alerta)" size={24} />
          <span className="resumo-rotulo">Comprometido (Cartão)</span>
          <span className="resumo-valor resumo-alerta">-{formatarMoeda(projecao?.cardInstallments.total)}</span>
        </Card>

        <Card className="resumo-card" style={{ border: '2px solid var(--cor-primaria)' }}>
          <Calculator color="var(--cor-primaria)" size={24} />
          <span className="resumo-rotulo">Saldo Livre Projetado</span>
          <span className="resumo-valor resumo-primario">{formatarMoeda(projecao?.projectedBalance)}</span>
          <p style={{ fontSize: '10px', color: 'var(--cor-texto-terciario)', marginTop: '4px' }}>Disponível para gastos variáveis</p>
        </Card>
      </div>

      <div className="dashboard-secoes">
        <Card className="dashboard-secao">
          <h3>📌 Despesas Fixas Confirmadas</h3>
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: 'var(--espacamento-sm)' }}>
            {projecao?.fixedExpenses.items.length === 0 && <p style={{ color: 'var(--cor-texto-terciario)' }}>Nenhuma despesa fixa para o próximo mês.</p>}
            {projecao?.fixedExpenses.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--cor-fundo-input)', borderRadius: '8px' }}>
                <span>{item.description}</span>
                <span style={{ fontWeight: 600 }}>{formatarMoeda(item.amount)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="dashboard-secao">
          <h3>💳 Parcelas de Cartão</h3>
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: 'var(--espacamento-sm)' }}>
            {projecao?.cardInstallments.items.length === 0 && <p style={{ color: 'var(--cor-texto-terciario)' }}>Nenhuma parcela de cartão para o próximo mês.</p>}
            {projecao?.cardInstallments.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--cor-fundo-input)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '14px' }}>{item.description}</div>
                  <div style={{ fontSize: '12px', color: 'var(--cor-texto-terciario)' }}>Parcela {item.currentInstallment}/{item.installments}</div>
                </div>
                <span style={{ fontWeight: 600 }}>{formatarMoeda(item.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {projecao?.projectedBalance < 0 && (
        <div style={{ marginTop: 'var(--espacamento-lg)', padding: 'var(--espacamento-md)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--cor-erro)', borderRadius: 'var(--raio-md)', display: 'flex', alignItems: 'center', gap: 'var(--espacamento-md)' }}>
          <AlertCircle color="var(--cor-erro)" />
          <div>
            <h4 style={{ color: 'var(--cor-erro)' }}>Alerta de Orçamento</h4>
            <p style={{ fontSize: '14px' }}>Sua projeção indica um saldo negativo para o próximo mês. Considere revisar suas despesas fixas ou reduzir os gastos variáveis.</p>
          </div>
        </div>
      )}
    </div>
  );
}
