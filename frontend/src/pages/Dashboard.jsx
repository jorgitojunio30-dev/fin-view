import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../contexts/WalletContext';
import { dashboardService } from '../services/dashboard';
import { revenueService } from '../services/revenues';
import { expenseService } from '../services/expenses';
import { cardService } from '../services/cards';
import Card, { CardIcone } from '../components/UI/Card';
import Modal from '../components/UI/Modal';
import RevenueForm from '../components/Forms/RevenueForm';
import ExpenseForm from '../components/Forms/ExpenseForm';
import { accountService } from '../services/accounts';
import {
  Wallet, TrendingUp, TrendingDown, CreditCard,
  Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Edit2, Trash2, ArrowDownCircle, ArrowUpCircle, ArrowRight
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { usuario } = useAuth();
  const { carteiraSelecionada } = useWallet();
  const [resumo, setResumo] = useState(null);
  const [receitas, setReceitas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Modal
  const [modalReceitaAberto, setModalReceitaAberto] = useState(false);
  const [modalDespesaAberto, setModalDespesaAberto] = useState(false);
  const [receitaEditando, setReceitaEditando] = useState(null);
  const [despesaEditando, setDespesaEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Seções colapsáveis
  const [receitasExpandido, setReceitasExpandido] = useState(true);
  const [despesasExpandido, setDespesasExpandido] = useState(true);
  const [cartoesExpandido, setCartoesExpandido] = useState(true);

  // Compras expandidas por cartão
  const [cartaoExpandido, setCartaoExpandido] = useState(null);
  const [comprasCartao, setComprasCartao] = useState([]);
  const [carregandoCompras, setCarregandoCompras] = useState(false);

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

      const [dadosResumo, dadosReceitas, dadosDespesas, dadosCartoes, dadosContas] = await Promise.all([
        dashboardService.getSummary(token, mesAtual, carteiraSelecionada),
        revenueService.getRevenues(token, mesAtual),
        expenseService.getExpenses(token, mesAtual),
        cardService.getCards(token),
        accountService.getAccounts(token)
      ]);

      // Para cada cartão, buscar o total de compras do mês
      const cartoesComTotal = await Promise.all(
        dadosCartoes.map(async (cartao) => {
          const compras = await cardService.getPurchases(token, mesAtual, cartao.id);
          const total = compras.reduce((acc, c) => acc + (c.amount || 0), 0);
          return { ...cartao, totalMes: total, qtdCompras: compras.length };
        })
      );

      setResumo(dadosResumo);
      setReceitas(dadosReceitas);
      setDespesas(dadosDespesas);
      setCartoes(cartoesComTotal);
      setContas(dadosContas);
    } catch (erro) {
      console.error("Erro ao carregar dashboard:", erro);
    } finally {
      setCarregando(false);
    }
  }

  // Helpers
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

  function formatarData(dataString) {
    if (!dataString) return '';
    const dataOnly = dataString.split('T')[0];
    const [ano, mes, dia] = dataOnly.split('-');
    return `${dia}/${mes}`;
  }

  // Toggle status
  async function handleToggleReceita(receita) {
    try {
      const token = await usuario.getIdToken();
      const { status } = await revenueService.toggleStatus(token, receita.id);
      setReceitas(prev => prev.map(r => r.id === receita.id ? { ...r, status } : r));
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);
    }
  }

  async function handleToggleDespesa(despesa) {
    try {
      const token = await usuario.getIdToken();
      const { status } = await expenseService.toggleStatus(token, despesa.id);
      setDespesas(prev => prev.map(d => d.id === despesa.id ? { ...d, status } : d));
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);
    }
  }

  // Editar
  function abrirEditarReceita(receita) {
    setReceitaEditando(receita);
    setModalReceitaAberto(true);
  }

  function abrirEditarDespesa(despesa) {
    setDespesaEditando(despesa);
    setModalDespesaAberto(true);
  }

  async function handleSalvarReceita(dados) {
    try {
      setSalvando(true);
      const token = await usuario.getIdToken();
      let scope = 'single';
      if (receitaEditando?.recurringId) {
        if (window.confirm("Aplicar alterações a todas as ocorrências futuras?")) scope = 'future';
      }
      await revenueService.updateRevenue(token, receitaEditando.id, dados, scope);
      await carregarDados();
      setModalReceitaAberto(false);
      setReceitaEditando(null);
    } catch (erro) {
      console.error("Erro ao salvar receita:", erro);
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarDespesa(dados) {
    try {
      setSalvando(true);
      const token = await usuario.getIdToken();
      let scope = 'single';
      if (despesaEditando?.recurringId) {
        if (window.confirm("Aplicar alterações a todas as parcelas futuras?")) scope = 'future';
      }
      await expenseService.updateExpense(token, despesaEditando.id, dados, scope);
      await carregarDados();
      setModalDespesaAberto(false);
      setDespesaEditando(null);
    } catch (erro) {
      console.error("Erro ao salvar despesa:", erro);
    } finally {
      setSalvando(false);
    }
  }

  // Excluir
  async function handleExcluirReceita(receita) {
    let scope = 'single';
    if (receita.recurringId) {
      if (window.confirm("Excluir todas as ocorrências futuras?")) scope = 'future';
      else if (!window.confirm("Excluir apenas esta ocorrência?")) return;
    } else {
      if (!window.confirm("Excluir esta receita?")) return;
    }
    try {
      const token = await usuario.getIdToken();
      await revenueService.deleteRevenue(token, receita.id, scope);
      await carregarDados();
    } catch (erro) {
      console.error("Erro ao excluir receita:", erro);
    }
  }

  async function handleExcluirDespesa(despesa) {
    let scope = 'single';
    if (despesa.recurringId) {
      if (window.confirm("Excluir todas as parcelas futuras?")) scope = 'future';
      else if (!window.confirm("Excluir apenas esta parcela?")) return;
    } else {
      if (!window.confirm("Excluir esta despesa?")) return;
    }
    try {
      const token = await usuario.getIdToken();
      await expenseService.deleteExpense(token, despesa.id, scope);
      await carregarDados();
    } catch (erro) {
      console.error("Erro ao excluir despesa:", erro);
    }
  }

  // Determina a urgência visual de uma despesa pendente
  function getUrgenciaDespesa(despesa) {
    if (despesa.status === 'realizado') return 'pago';
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const dateStr = despesa.date || '';
    if (!dateStr) return 'pendente';
    const expDate = new Date(dateStr.split('T')[0]);

    if (expDate <= hoje) return 'vencido';      // venceu hoje ou antes
    if (expDate <= amanha) return 'vence-amanha'; // vence amanhã
    return 'pendente';
  }

  function getBordaUrgencia(urgencia) {
    switch (urgencia) {
      case 'vencido': return '3px solid var(--cor-erro)';
      case 'vence-amanha': return '3px solid var(--cor-alerta)';
      case 'pendente': return '3px solid var(--cor-borda-hover)';
      default: return '3px solid var(--cor-sucesso)';  // pago
    }
  }

  async function handleExpandirCartao(cartao) {
    if (cartaoExpandido === cartao.id) {
      setCartaoExpandido(null);
      setComprasCartao([]);
      return;
    }
    try {
      setCarregandoCompras(true);
      setCartaoExpandido(cartao.id);
      const token = await usuario.getIdToken();
      const compras = await cardService.getPurchases(token, mesAtual, cartao.id);
      setComprasCartao(compras);
    } catch (erro) {
      console.error("Erro ao carregar compras:", erro);
      setComprasCartao([]);
    } finally {
      setCarregandoCompras(false);
    }
  }

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
          {/* Cards de resumo — Saldo por último */}
          <div className="dashboard-cards">
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
              <span className="resumo-rotulo">Faturas do Mês</span>
              <span className="resumo-valor resumo-alerta">{formatarMoeda(cartoes.reduce((acc, c) => acc + (c.totalMes || 0), 0))}</span>
            </Card>

            <Card className="resumo-card">
              <CardIcone icone={Wallet} cor="primario" />
              <span className="resumo-rotulo">Saldo do Mês</span>
              {(() => {
                const totalReceitas = receitas.reduce((acc, r) => acc + (r.amount || 0), 0);
                const totalDespesas = despesas.reduce((acc, d) => acc + (d.amount || 0), 0);
                const totalCartoes = cartoes.reduce((acc, c) => acc + (c.totalMes || 0), 0);
                const saldo = totalReceitas - totalDespesas - totalCartoes;
                return (
                  <span className={`resumo-valor ${saldo >= 0 ? 'resumo-sucesso' : 'resumo-erro'}`}>
                    {formatarMoeda(saldo)}
                  </span>
                );
              })()}
            </Card>
          </div>

          {/* Lista de Receitas */}
          <div style={{ marginTop: 'var(--espacamento-lg)' }}>
            <button onClick={() => setReceitasExpandido(!receitasExpandido)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-sm)', marginBottom: receitasExpandido ? 'var(--espacamento-md)' : 0, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
              <ArrowDownCircle size={20} color="var(--cor-sucesso)" />
              <h3 style={{ fontSize: 'var(--fonte-tamanho-lg)', fontWeight: 600, color: 'var(--cor-texto)' }}>Receitas</h3>
              <span style={{ fontSize: 'var(--fonte-tamanho-xs)', color: 'var(--cor-texto-terciario)', marginLeft: '4px' }}>({receitas.length})</span>
              <span style={{ marginLeft: 'auto', fontSize: 'var(--fonte-tamanho-sm)', color: 'var(--cor-sucesso)', fontWeight: 600 }}>
                {formatarMoeda(receitas.reduce((acc, r) => acc + (r.amount || 0), 0))}
              </span>
              {receitasExpandido ? <ChevronUp size={18} color="var(--cor-texto-secundario)" /> : <ChevronDown size={18} color="var(--cor-texto-secundario)" />}
            </button>

            {receitasExpandido && (receitas.length === 0 ? (
              <p style={{ color: 'var(--cor-texto-terciario)', fontSize: 'var(--fonte-tamanho-sm)', paddingLeft: '28px' }}>Nenhuma receita neste mês.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {receitas.map(receita => {
                  const isPendente = receita.status === 'pendente';
                  const hoje = new Date(); hoje.setHours(0,0,0,0);
                  const recDate = receita.date ? new Date(receita.date.split('T')[0]) : null;
                  const venceHoje = isPendente && recDate && recDate <= hoje;
                  const borderLeft = isPendente ? (venceHoje ? '3px solid var(--cor-alerta)' : '3px solid var(--cor-borda-hover)') : '3px solid var(--cor-sucesso)';

                  return (
                    <div key={receita.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-sm)', padding: '10px 12px', background: 'var(--cor-fundo-card)', borderRadius: 'var(--raio-borda-md)', border: '1px solid var(--cor-borda)', borderLeft, opacity: receita.status === 'realizado' ? 0.6 : 1 }}>
                      <button onClick={() => handleToggleReceita(receita)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }} title={receita.status === 'realizado' ? 'Marcar como pendente' : 'Marcar como recebido'}>
                        {receita.status === 'realizado' ? <CheckCircle2 size={18} color="var(--cor-sucesso)" /> : <Clock size={18} color="var(--cor-alerta)" />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{receita.description}</span>
                        <span style={{ fontSize: '11px', color: 'var(--cor-texto-terciario)', marginLeft: '8px' }}>{formatarData(receita.date)}</span>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--cor-sucesso)', fontSize: '14px', whiteSpace: 'nowrap' }}>{formatarMoeda(receita.amount)}</span>
                      <button onClick={() => abrirEditarReceita(receita)} style={{ background: 'none', border: 'none', color: 'var(--cor-texto-secundario)', cursor: 'pointer', padding: '4px' }}><Edit2 size={14} /></button>
                      <button onClick={() => handleExcluirReceita(receita)} style={{ background: 'none', border: 'none', color: 'var(--cor-erro)', cursor: 'pointer', padding: '4px' }}><Trash2 size={14} /></button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Lista de Despesas */}
          <div style={{ marginTop: 'var(--espacamento-xl)' }}>
            <button onClick={() => setDespesasExpandido(!despesasExpandido)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-sm)', marginBottom: despesasExpandido ? 'var(--espacamento-md)' : 0, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
              <ArrowUpCircle size={20} color="var(--cor-erro)" />
              <h3 style={{ fontSize: 'var(--fonte-tamanho-lg)', fontWeight: 600, color: 'var(--cor-texto)' }}>Despesas</h3>
              <span style={{ fontSize: 'var(--fonte-tamanho-xs)', color: 'var(--cor-texto-terciario)', marginLeft: '4px' }}>({despesas.length})</span>
              <span style={{ marginLeft: 'auto', fontSize: 'var(--fonte-tamanho-sm)', color: 'var(--cor-erro)', fontWeight: 600 }}>
                {formatarMoeda(despesas.reduce((acc, d) => acc + (d.amount || 0), 0))}
              </span>
              {despesasExpandido ? <ChevronUp size={18} color="var(--cor-texto-secundario)" /> : <ChevronDown size={18} color="var(--cor-texto-secundario)" />}
            </button>

            {despesasExpandido && (despesas.length === 0 ? (
              <p style={{ color: 'var(--cor-texto-terciario)', fontSize: 'var(--fonte-tamanho-sm)', paddingLeft: '28px' }}>Nenhuma despesa neste mês.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {despesas.map(despesa => {
                  const urgencia = getUrgenciaDespesa(despesa);
                  return (
                    <div key={despesa.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-sm)', padding: '10px 12px', background: 'var(--cor-fundo-card)', borderRadius: 'var(--raio-borda-md)', border: '1px solid var(--cor-borda)', borderLeft: getBordaUrgencia(urgencia), opacity: despesa.status === 'realizado' ? 0.6 : 1 }}>
                      <button onClick={() => handleToggleDespesa(despesa)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }} title={despesa.status === 'realizado' ? 'Marcar como pendente' : 'Marcar como pago'}>
                        {despesa.status === 'realizado' ? <CheckCircle2 size={18} color="var(--cor-sucesso)" /> : <Clock size={18} color="var(--cor-alerta)" />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{despesa.description}</span>
                        {despesa.type === 'fixa' && despesa.recurringIndex && despesa.recurringMonths && (
                          <span style={{ marginLeft: '6px', padding: '1px 5px', background: 'var(--cor-primaria-transparente)', color: 'var(--cor-primaria)', borderRadius: '3px', fontSize: '10px', fontWeight: 700 }}>
                            {despesa.recurringIndex}/{despesa.recurringMonths}
                          </span>
                        )}
                        <span style={{ fontSize: '11px', color: 'var(--cor-texto-terciario)', marginLeft: '8px' }}>{formatarData(despesa.date)}</span>
                        {urgencia === 'vencido' && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--cor-erro)', fontWeight: 700 }}>VENCIDA</span>}
                        {urgencia === 'vence-amanha' && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--cor-alerta)', fontWeight: 700 }}>VENCE AMANHÃ</span>}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--cor-erro)', fontSize: '14px', whiteSpace: 'nowrap' }}>-{formatarMoeda(despesa.amount)}</span>
                      <button onClick={() => abrirEditarDespesa(despesa)} style={{ background: 'none', border: 'none', color: 'var(--cor-texto-secundario)', cursor: 'pointer', padding: '4px' }}><Edit2 size={14} /></button>
                      <button onClick={() => handleExcluirDespesa(despesa)} style={{ background: 'none', border: 'none', color: 'var(--cor-erro)', cursor: 'pointer', padding: '4px' }}><Trash2 size={14} /></button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Lista de Cartões */}
          <div style={{ marginTop: 'var(--espacamento-xl)' }}>
            <button onClick={() => setCartoesExpandido(!cartoesExpandido)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-sm)', marginBottom: cartoesExpandido ? 'var(--espacamento-md)' : 0, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
              <CreditCard size={20} color="var(--cor-alerta)" />
              <h3 style={{ fontSize: 'var(--fonte-tamanho-lg)', fontWeight: 600, color: 'var(--cor-texto)' }}>Cartões</h3>
              <span style={{ fontSize: 'var(--fonte-tamanho-xs)', color: 'var(--cor-texto-terciario)', marginLeft: '4px' }}>({cartoes.length})</span>
              <span style={{ marginLeft: 'auto', fontSize: 'var(--fonte-tamanho-sm)', color: 'var(--cor-alerta)', fontWeight: 600 }}>
                {formatarMoeda(cartoes.reduce((acc, c) => acc + (c.totalMes || 0), 0))}
              </span>
              {cartoesExpandido ? <ChevronUp size={18} color="var(--cor-texto-secundario)" /> : <ChevronDown size={18} color="var(--cor-texto-secundario)" />}
            </button>

            {cartoesExpandido && (cartoes.length === 0 ? (
              <p style={{ color: 'var(--cor-texto-terciario)', fontSize: 'var(--fonte-tamanho-sm)', paddingLeft: '28px' }}>Nenhum cartão cadastrado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {cartoes.map(cartao => {
                  const isExpanded = cartaoExpandido === cartao.id;
                  return (
                    <div key={cartao.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-sm)', padding: '10px 12px', background: 'var(--cor-fundo-card)', borderRadius: isExpanded ? 'var(--raio-borda-md) var(--raio-borda-md) 0 0' : 'var(--raio-borda-md)', border: '1px solid var(--cor-borda)' }}>
                        <CreditCard size={18} color="var(--cor-alerta)" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '14px', fontWeight: 500 }}>{cartao.name}</span>
                          <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--cor-texto-terciario)' }}>•••• {cartao.lastDigits}</span>
                          {cartao.qtdCompras > 0 && (
                            <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--cor-texto-terciario)' }}>({cartao.qtdCompras} {cartao.qtdCompras === 1 ? 'compra' : 'compras'})</span>
                          )}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--cor-alerta)', fontSize: '14px', whiteSpace: 'nowrap' }}>{formatarMoeda(cartao.totalMes)}</span>
                        <button onClick={() => handleExpandirCartao(cartao)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--cor-texto-secundario)', display: 'flex' }} title="Ver compras">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {isExpanded && (
                        <div style={{ padding: '8px 12px 12px', background: 'var(--cor-fundo-input)', borderRadius: '0 0 var(--raio-borda-md) var(--raio-borda-md)', border: '1px solid var(--cor-borda)', borderTop: 'none' }}>
                          {carregandoCompras ? (
                            <p style={{ fontSize: '12px', color: 'var(--cor-texto-terciario)', padding: '8px 0' }}>Carregando...</p>
                          ) : comprasCartao.length === 0 ? (
                            <p style={{ fontSize: '12px', color: 'var(--cor-texto-terciario)', padding: '8px 0' }}>Nenhuma compra neste mês.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {comprasCartao.map(compra => (
                                <div key={compra.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', fontSize: '13px' }}>
                                  <div>
                                    <span style={{ fontWeight: 500 }}>{compra.description}</span>
                                    <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--cor-texto-terciario)' }}>{compra.currentInstallment}/{compra.installments}</span>
                                    <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--cor-texto-terciario)' }}>• {compra.category}</span>
                                  </div>
                                  <span style={{ fontWeight: 600, color: 'var(--cor-alerta)' }}>{formatarMoeda(compra.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modais de edição */}
      <Modal aberto={modalReceitaAberto} aoFechar={() => { setModalReceitaAberto(false); setReceitaEditando(null); }} titulo="Editar Receita">
        <RevenueForm initialData={receitaEditando} accounts={contas} onSubmit={handleSalvarReceita} onCancel={() => { setModalReceitaAberto(false); setReceitaEditando(null); }} isLoading={salvando} />
      </Modal>

      <Modal aberto={modalDespesaAberto} aoFechar={() => { setModalDespesaAberto(false); setDespesaEditando(null); }} titulo="Editar Despesa">
        <ExpenseForm initialData={despesaEditando} accounts={contas} onSubmit={handleSalvarDespesa} onCancel={() => { setModalDespesaAberto(false); setDespesaEditando(null); }} isLoading={salvando} />
      </Modal>
    </div>
  );
}
