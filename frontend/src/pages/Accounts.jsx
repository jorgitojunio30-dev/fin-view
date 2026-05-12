import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/UI/Toast';
import { useConfirm } from '../components/UI/ConfirmDialog';
import { accountService } from '../services/accounts';
import Card, { CardIcone } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import AccountForm from '../components/Forms/AccountForm';
import { Landmark, Plus, Edit2, Trash2 } from 'lucide-react';

export default function Accounts() {
  const { usuario } = useAuth();
  const toast = useToast();
  const confirmar = useConfirm();
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // Controle do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [contaEditando, setContaEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarContas();
  }, [usuario]);

  async function carregarContas() {
    if (!usuario) return;
    try {
      setCarregando(true);
      const token = await usuario.getIdToken();
      const dados = await accountService.getAccounts(token);
      setContas(dados);
    } catch (erro) {
      console.error("Erro ao buscar contas:", erro);
    } finally {
      setCarregando(false);
    }
  }

  function abrirModal(conta = null) {
    setContaEditando(conta);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setContaEditando(null);
  }

  async function handleSubmit(dados) {
    try {
      setSalvando(true);
      const token = await usuario.getIdToken();
      if (contaEditando) {
        await accountService.updateAccount(token, contaEditando.id, dados);
        toast.sucesso("Carteira atualizada!");
      } else {
        await accountService.createAccount(token, dados);
        toast.sucesso("Carteira adicionada!");
      }
      await carregarContas();
      fecharModal();
    } catch (erro) {
      console.error("Erro ao salvar conta:", erro);
      toast.erro("Erro ao salvar carteira.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(id) {
    const ok = await confirmar("Tem certeza que deseja excluir esta carteira?");
    if (!ok) return;
    try {
      setCarregando(true);
      const token = await usuario.getIdToken();
      await accountService.deleteAccount(token, id);
      toast.sucesso("Carteira excluída.");
      await carregarContas();
    } catch (erro) {
      console.error("Erro ao excluir conta:", erro);
      toast.erro("Erro ao excluir carteira.");
      setCarregando(false);
    }
  }

  return (
    <div className="pagina-conteudo">
      <div className="pagina-titulo">
        <div>
          <h1>Carteiras / Perfis</h1>
          <p>Organize suas finanças em diferentes perfis (ex: Casa, Time)</p>
        </div>
        <Button onClick={() => abrirModal()}>
          <Plus size={18} /> Adicionar Carteira
        </Button>
      </div>

      {carregando && contas.length === 0 ? (
        <div className="spinner-pagina" style={{ minHeight: '200px' }}>
          <div className="spinner"></div>
        </div>
      ) : contas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--espacamento-2xl)', color: 'var(--cor-texto-terciario)' }}>
          <Landmark size={48} style={{ opacity: 0.5, marginBottom: 'var(--espacamento-md)' }} />
          <h3>Nenhuma carteira cadastrada</h3>
          <p>Adicione sua primeira carteira para começar a gerenciar suas receitas e despesas.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--espacamento-md)', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {contas.map((conta) => (
            <Card key={conta.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-md)' }}>
                <CardIcone icone={Landmark} cor="primario" />
                <div>
                  <h3 style={{ fontSize: 'var(--fonte-tamanho-base)', fontWeight: 600 }}>{conta.name}</h3>
                  <p style={{ fontSize: 'var(--fonte-tamanho-sm)', color: 'var(--cor-texto-secundario)' }}>
                    {conta.description || 'Sem descrição'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--espacamento-xs)' }}>
                <button 
                  onClick={() => abrirModal(conta)}
                  style={{ background: 'none', border: 'none', color: 'var(--cor-texto-secundario)', cursor: 'pointer', padding: '4px' }}
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleExcluir(conta.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--cor-erro)', cursor: 'pointer', padding: '4px' }}
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal 
        aberto={modalAberto} 
        aoFechar={fecharModal} 
        titulo={contaEditando ? "Editar Carteira" : "Nova Carteira"}
      >
        <AccountForm 
          initialData={contaEditando} 
          onSubmit={handleSubmit} 
          onCancel={fecharModal}
          isLoading={salvando}
        />
      </Modal>
    </div>
  );
}
