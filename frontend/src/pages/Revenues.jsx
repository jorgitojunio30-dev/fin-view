import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/UI/Toast';
import { useConfirm } from '../components/UI/ConfirmDialog';
import { revenueService } from '../services/revenues';
import { accountService } from '../services/accounts';
import Card, { CardIcone } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import RevenueForm from '../components/Forms/RevenueForm';
import { ArrowDownCircle, Plus, Edit2, Trash2, Calendar, ChevronLeft, ChevronRight, Repeat, CheckCircle2, Clock } from 'lucide-react';

export default function Revenues() {
  const { usuario } = useAuth();
  const toast = useToast();
  const confirmar = useConfirm();
  const [receitas, setReceitas] = useState([]);
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // Controle de Mês
  const dataAtual = new Date();
  const [mesAtual, setMesAtual] = useState(`${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}`);
  
  // Controle do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [receitaEditando, setReceitaEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [usuario, mesAtual]);

  async function carregarDados() {
    if (!usuario) return;
    try {
      setCarregando(true);
      const token = await usuario.getIdToken();
      
      // Carregar contas e receitas em paralelo
      const [dadosContas, dadosReceitas] = await Promise.all([
        accountService.getAccounts(token),
        revenueService.getRevenues(token, mesAtual)
      ]);
      
      setContas(dadosContas);
      setReceitas(dadosReceitas);
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
    // Handling timezone issues by using substring
    const dataOnly = dataString.split('T')[0];
    const [ano, mes, dia] = dataOnly.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function getNomeConta(accountId) {
    const conta = contas.find(c => c.id === accountId);
    return conta ? conta.name : 'Carteira desconhecida';
  }

  function abrirModal(receita = null) {
    setReceitaEditando(receita);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setReceitaEditando(null);
  }

  async function handleSubmit(dados) {
    try {
      setSalvando(true);
      const token = await usuario.getIdToken();

      if (receitaEditando) {
        let scope = 'single';
        if (receitaEditando.recurringId) {
          const futuras = await confirmar("Aplicar alterações a todas as ocorrências futuras?");
          if (futuras) scope = 'future';
        }
        await revenueService.updateRevenue(token, receitaEditando.id, dados, scope);
        toast.sucesso("Receita atualizada!");
      } else {
        await revenueService.createRevenue(token, dados);
        toast.sucesso("Receita adicionada!");
      }

      await carregarDados();
      fecharModal();
    } catch (erro) {
      console.error("Erro ao salvar receita:", erro);
      toast.erro("Erro ao salvar receita.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(receita) {
    let scope = 'single';

    if (receita.recurringId) {
      const futuras = await confirmar("Excluir todas as ocorrências futuras desta receita fixa?");
      if (futuras) {
        scope = 'future';
      } else {
        const apenas = await confirmar("Excluir apenas esta ocorrência?");
        if (!apenas) return;
      }
    } else {
      const ok = await confirmar("Excluir esta receita?");
      if (!ok) return;
    }

    try {
      setCarregando(true);
      const token = await usuario.getIdToken();
      await revenueService.deleteRevenue(token, receita.id, scope);
      toast.sucesso("Receita excluída.");
      await carregarDados();
    } catch (erro) {
      console.error("Erro ao excluir receita:", erro);
      toast.erro("Erro ao excluir receita.");
      setCarregando(false);
    }
  }

  const totalReceitas = receitas.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);

  async function handleToggleStatus(receita) {
    try {
      const token = await usuario.getIdToken();
      const { status } = await revenueService.toggleStatus(token, receita.id);
      setReceitas(prev => prev.map(r => r.id === receita.id ? { ...r, status } : r));
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);
    }
  }

  return (
    <div className="pagina-conteudo">
      <div className="pagina-titulo">
        <div>
          <h1>Receitas</h1>
          <p>Gerencie todas as suas entradas de dinheiro</p>
        </div>
        <Button onClick={() => abrirModal()}>
          <Plus size={18} /> Adicionar Receita
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
          <div style={{ color: 'var(--cor-sucesso)', fontSize: 'var(--fonte-tamanho-lg)', fontWeight: 700 }}>
            {formatarMoeda(totalReceitas)}
          </div>
        </div>
      </div>

      {carregando && receitas.length === 0 ? (
        <div className="spinner-pagina" style={{ minHeight: '200px' }}>
          <div className="spinner"></div>
        </div>
      ) : receitas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--espacamento-2xl)', color: 'var(--cor-texto-terciario)' }}>
          <ArrowDownCircle size={48} style={{ opacity: 0.5, marginBottom: 'var(--espacamento-md)', color: 'var(--cor-sucesso)' }} />
          <h3>Nenhuma receita neste mês</h3>
          <p>Você ainda não registrou nenhuma entrada para este período.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacamento-sm)' }}>
          {receitas.map((receita) => (
            <Card key={receita.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--espacamento-md)', opacity: receita.status === 'pendente' ? 0.75 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-md)' }}>
                <button
                  onClick={() => handleToggleStatus(receita)}
                  title={receita.status === 'realizado' ? 'Marcar como pendente' : 'Marcar como recebido'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
                >
                  {receita.status === 'realizado'
                    ? <CheckCircle2 size={22} color="var(--cor-sucesso)" />
                    : <Clock size={22} color="var(--cor-alerta)" />
                  }
                </button>
                <div>
                  <h3 style={{ fontSize: 'var(--fonte-tamanho-base)', fontWeight: 600 }}>{receita.description}</h3>
                  <p style={{ fontSize: 'var(--fonte-tamanho-sm)', color: 'var(--cor-texto-secundario)' }}>
                    {formatarData(receita.date)} • {receita.category} • {getNomeConta(receita.accountId)}
                    {receita.isFixed && (
                      <span style={{ marginLeft: '8px', padding: '2px 6px', background: 'rgba(16,185,129,0.12)', color: 'var(--cor-sucesso)', borderRadius: '4px', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Repeat size={9} /> FIXA
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-lg)' }}>
                <span style={{ fontWeight: 600, color: 'var(--cor-sucesso)' }}>
                  {formatarMoeda(receita.amount)}
                </span>
                <div style={{ display: 'flex', gap: 'var(--espacamento-xs)' }}>
                  <button 
                    onClick={() => abrirModal(receita)}
                    style={{ background: 'none', border: 'none', color: 'var(--cor-texto-secundario)', cursor: 'pointer', padding: '4px' }}
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleExcluir(receita)}
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
        titulo={receitaEditando ? "Editar Receita" : "Nova Receita"}
      >
        <RevenueForm 
          initialData={receitaEditando} 
          accounts={contas}
          onSubmit={handleSubmit} 
          onCancel={fecharModal}
          isLoading={salvando}
        />
      </Modal>
    </div>
  );
}
