import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/UI/Toast';
import { useConfirm } from '../components/UI/ConfirmDialog';
import { expenseService } from '../services/expenses';
import { accountService } from '../services/accounts';
import Card, { CardIcone } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import ExpenseForm from '../components/Forms/ExpenseForm';
import { ArrowUpCircle, Plus, Edit2, Trash2, Calendar, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

export default function Expenses() {
  const { usuario } = useAuth();
  const toast = useToast();
  const confirmar = useConfirm();
  const [despesas, setDespesas] = useState([]);
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // Controle de Mês
  const dataAtual = new Date();
  const [mesAtual, setMesAtual] = useState(`${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}`);
  
  // Controle do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [despesaEditando, setDespesaEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [usuario, mesAtual]);

  async function carregarDados() {
    if (!usuario) return;
    try {
      setCarregando(true);
      const token = await usuario.getIdToken();
      
      const [dadosContas, dadosDespesas] = await Promise.all([
        accountService.getAccounts(token),
        expenseService.getExpenses(token, mesAtual)
      ]);
      
      setContas(dadosContas);
      setDespesas(dadosDespesas);
    } catch (erro) {
      console.error("Erro ao buscar dados:", erro);
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
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  function formatarData(dataString) {
    const dataOnly = dataString.split('T')[0];
    const [ano, mes, dia] = dataOnly.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function getNomeConta(accountId) {
    const conta = contas.find(c => c.id === accountId);
    return conta ? conta.name : 'Carteira desconhecida';
  }

  function abrirModal(despesa = null) {
    setDespesaEditando(despesa);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setDespesaEditando(null);
  }

  async function handleSubmit(dados) {
    try {
      setSalvando(true);
      const token = await usuario.getIdToken();
      
      if (despesaEditando) {
        let scope = 'single';
        if (despesaEditando.recurringId) {
          const futuras = await confirmar("Aplicar alterações a todas as parcelas futuras?");
          if (futuras) scope = 'future';
        }
        await expenseService.updateExpense(token, despesaEditando.id, dados, scope);
        toast.sucesso("Despesa atualizada!");
      } else {
        await expenseService.createExpense(token, dados);
        toast.sucesso("Despesa adicionada!");
      }
      
      await carregarDados();
      fecharModal();
    } catch (erro) {
      console.error("Erro ao salvar despesa:", erro);
      toast.erro("Erro ao salvar despesa.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(despesa) {
    let scope = 'single';
    
    if (despesa.recurringId) {
      const futuras = await confirmar("Excluir todas as parcelas futuras desta despesa fixa?");
      if (futuras) {
        scope = 'future';
      } else {
        const apenas = await confirmar("Excluir apenas esta parcela?");
        if (!apenas) return;
      }
    } else {
      const ok = await confirmar("Excluir esta despesa?");
      if (!ok) return;
    }
    
    try {
      setCarregando(true);
      const token = await usuario.getIdToken();
      await expenseService.deleteExpense(token, despesa.id, scope);
      toast.sucesso("Despesa excluída.");
      await carregarDados();
    } catch (erro) {
      console.error("Erro ao excluir despesa:", erro);
      toast.erro("Erro ao excluir despesa.");
      setCarregando(false);
    }
  }

  const totalDespesas = despesas.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);

  async function handleToggleStatus(despesa) {
    try {
      const token = await usuario.getIdToken();
      const { status } = await expenseService.toggleStatus(token, despesa.id);
      setDespesas(prev => prev.map(d => d.id === despesa.id ? { ...d, status } : d));
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);
    }
  }

  async function handleRenovarSerie(despesa) {
    const meses = window.prompt("Renovar por quantos meses?", "12");
    if (!meses) return;
    const num = parseInt(meses);
    if (isNaN(num) || num < 1) {
      toast.aviso("Informe um número válido.");
      return;
    }
    try {
      const token = await usuario.getIdToken();
      await expenseService.renewSeries(token, despesa.id, num);
      toast.sucesso(`Série renovada com mais ${num} meses!`);
      await carregarDados();
    } catch (erro) {
      console.error("Erro ao renovar série:", erro);
      toast.erro("Erro ao renovar a série.");
    }
  }

  // Detecta despesas fixas que estão no último mês da série
  function isUltimaOcorrencia(despesa) {
    if (!despesa.recurringId || despesa.type !== 'fixa') return false;
    // Se temos os campos de série, usamos eles diretamente
    if (despesa.recurringIndex && despesa.recurringMonths) {
      return despesa.recurringIndex === despesa.recurringMonths;
    }
    return false;
  }

  return (
    <div className="pagina-conteudo">
      <div className="pagina-titulo">
        <div>
          <h1>Despesas</h1>
          <p>Gerencie todas as suas saídas de dinheiro</p>
        </div>
        <Button onClick={() => abrirModal()} estilo={{ background: 'var(--cor-erro)', borderColor: 'var(--cor-erro)' }}>
          <Plus size={18} /> Adicionar Despesa
        </Button>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--espacamento-lg)',
        padding: 'var(--espacamento-md)',
        background: 'var(--cor-fundo-card)',
        borderRadius: 'var(--raio-borda-md)',
        border: '1px solid var(--cor-borda)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-sm)' }}>
          <button 
            onClick={() => mudarMes(-1)}
            style={{ background: 'none', border: 'none', color: 'var(--cor-texto-secundario)', cursor: 'pointer' }}
          >
            <ChevronLeft size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px', justifyContent: 'center' }}>
            <Calendar size={18} color="var(--cor-texto-secundario)" />
            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{formatarMes(mesAtual)}</span>
          </div>
          <button 
            onClick={() => mudarMes(1)}
            style={{ background: 'none', border: 'none', color: 'var(--cor-texto-secundario)', cursor: 'pointer' }}
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: 'var(--cor-texto-secundario)', fontSize: 'var(--fonte-tamanho-sm)' }}>Total no Mês</span>
          <div style={{ color: 'var(--cor-erro)', fontSize: 'var(--fonte-tamanho-lg)', fontWeight: 700 }}>
            {formatarMoeda(totalDespesas)}
          </div>
        </div>
      </div>

      {carregando && despesas.length === 0 ? (
        <div className="spinner-pagina" style={{ minHeight: '200px' }}>
          <div className="spinner"></div>
        </div>
      ) : despesas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--espacamento-2xl)', color: 'var(--cor-texto-terciario)' }}>
          <ArrowUpCircle size={48} style={{ opacity: 0.5, marginBottom: 'var(--espacamento-md)', color: 'var(--cor-erro)' }} />
          <h3>Nenhuma despesa neste mês</h3>
          <p>Você ainda não registrou nenhuma saída para este período.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacamento-sm)' }}>
          {despesas.map((despesa) => (
            <Card key={despesa.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--espacamento-md)', opacity: despesa.status === 'pendente' ? 0.75 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-md)' }}>
                <button
                  onClick={() => handleToggleStatus(despesa)}
                  title={despesa.status === 'realizado' ? 'Marcar como pendente' : 'Marcar como pago'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
                >
                  {despesa.status === 'realizado'
                    ? <CheckCircle2 size={22} color="var(--cor-sucesso)" />
                    : <Clock size={22} color="var(--cor-alerta)" />
                  }
                </button>
                <div>
                  <h3 style={{ fontSize: 'var(--fonte-tamanho-base)', fontWeight: 600, textDecoration: despesa.status === 'pendente' ? 'none' : 'none' }}>{despesa.description}</h3>
                  <p style={{ fontSize: 'var(--fonte-tamanho-sm)', color: 'var(--cor-texto-secundario)' }}>
                    {formatarData(despesa.date)} • {despesa.category} • {getNomeConta(despesa.accountId)}
                    {despesa.type === 'fixa' && (
                      <span style={{ marginLeft: '8px', padding: '2px 6px', background: 'var(--cor-primaria-transparente)', color: 'var(--cor-primaria)', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                        {despesa.recurringIndex && despesa.recurringMonths
                          ? `${despesa.recurringIndex}/${despesa.recurringMonths}`
                          : 'FIXA'}
                      </span>
                    )}
                    {isUltimaOcorrencia(despesa) && (
                      <span title="Última ocorrência desta despesa fixa." style={{ marginLeft: '6px', padding: '2px 6px', background: 'rgba(245,158,11,0.15)', color: 'var(--cor-alerta)', borderRadius: '4px', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <AlertTriangle size={10} /> ÚLTIMO MÊS
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-lg)' }}>
                <span style={{ fontWeight: 600, color: 'var(--cor-erro)' }}>
                  -{formatarMoeda(despesa.amount)}
                </span>
                <div style={{ display: 'flex', gap: 'var(--espacamento-xs)' }}>
                  {isUltimaOcorrencia(despesa) && (
                    <button
                      onClick={() => handleRenovarSerie(despesa)}
                      style={{ background: 'none', border: 'none', color: 'var(--cor-primaria)', cursor: 'pointer', padding: '4px' }}
                      title="Renovar série"
                    >
                      <RefreshCw size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => abrirModal(despesa)}
                    style={{ background: 'none', border: 'none', color: 'var(--cor-texto-secundario)', cursor: 'pointer', padding: '4px' }}
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleExcluir(despesa)}
                    style={{ background: 'none', border: 'none', color: 'var(--cor-erro)', cursor: 'pointer', padding: '4px' }}
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal 
        aberto={modalAberto} 
        aoFechar={fecharModal} 
        titulo={despesaEditando ? "Editar Despesa" : "Nova Despesa"}
      >
        <ExpenseForm 
          initialData={despesaEditando} 
          accounts={contas}
          onSubmit={handleSubmit} 
          onCancel={fecharModal}
          isLoading={salvando}
        />
      </Modal>
    </div>
  );
}
