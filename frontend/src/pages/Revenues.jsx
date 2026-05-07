import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { revenueService } from '../services/revenues';
import { accountService } from '../services/accounts';
import Card, { CardIcone } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import RevenueForm from '../components/Forms/RevenueForm';
import { ArrowDownCircle, Plus, Edit2, Trash2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Revenues() {
  const { usuario } = useAuth();
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
        await revenueService.updateRevenue(receitaEditando.id, dados, token);
      } else {
        await revenueService.createRevenue(dados, token);
      }
      
      await carregarDados();
      fecharModal();
    } catch (erro) {
      console.error("Erro ao salvar receita:", erro);
      alert("Houve um erro ao salvar a receita. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(id) {
    if (!window.confirm("Tem certeza que deseja excluir esta receita?")) return;
    
    try {
      setCarregando(true);
      const token = await usuario.getIdToken();
      await revenueService.deleteRevenue(id, token);
      await carregarDados();
    } catch (erro) {
      console.error("Erro ao excluir receita:", erro);
      alert("Houve um erro ao excluir. Tente novamente.");
      setCarregando(false);
    }
  }

  const totalReceitas = receitas.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);

  return (
    <div className="pagina-conteudo">
      <div className="pagina-titulo">
        <div>
          <h1>Receitas</h1>
          <p>Gerencie todas as suas entradas de dinheiro</p>
        </div>
        <Button onClick={() => abrirModal()} icone={Plus}>
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
            <Card key={receita.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--espacamento-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-md)' }}>
                <CardIcone icone={ArrowDownCircle} cor="sucesso" />
                <div>
                  <h3 style={{ fontSize: 'var(--fonte-tamanho-base)', fontWeight: 600 }}>{receita.description}</h3>
                  <p style={{ fontSize: 'var(--fonte-tamanho-sm)', color: 'var(--cor-texto-secundario)' }}>
                    {formatarData(receita.date)} • {receita.category} • {getNomeConta(receita.accountId)}
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
                    onClick={() => handleExcluir(receita.id)}
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
