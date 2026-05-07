import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { cardService } from '../services/cards';
import { invoiceService } from '../services/invoices';
import { accountService } from '../services/accounts';
import Card, { CardIcone } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import CardForm from '../components/Forms/CardForm';
import PurchaseForm from '../components/Forms/PurchaseForm';
import InvoicePaymentForm from '../components/Forms/InvoicePaymentForm';
import { 
  CreditCard, Plus, Edit2, Trash2, Calendar, ShoppingCart, 
  ChevronLeft, ChevronRight, CheckCircle2, Lock, Unlock 
} from 'lucide-react';
import './Cards.css';

export default function Cards() {
  const { usuario } = useAuth();
  const [cartoes, setCartoes] = useState([]);
  const [compras, setCompras] = useState([]);
  const [contas, setContas] = useState([]);
  const [fatura, setFatura] = useState(null);
  const [carregando, setCarregando] = useState(true);
  
  const dataAtual = new Date();
  const [mesAtual, setMesAtual] = useState(`${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}`);
  const [cartaoSelecionado, setCartaoSelecionado] = useState(null);

  // Controle de Modais
  const [modalCartaoAberto, setModalCartaoAberto] = useState(false);
  const [modalCompraAberto, setModalCompraAberto] = useState(false);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [cartaoEditando, setCartaoEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarDadosBase();
  }, [usuario]);

  useEffect(() => {
    carregarComprasEFatura();
  }, [usuario, mesAtual, cartaoSelecionado]);

  async function carregarDadosBase() {
    if (!usuario) return;
    try {
      const token = await usuario.getIdToken();
      const [dadosCartoes, dadosContas] = await Promise.all([
        cardService.getCards(token),
        accountService.getAccounts(token)
      ]);
      setCartoes(dadosCartoes);
      setContas(dadosContas);
      if (dadosCartoes.length > 0 && !cartaoSelecionado) {
        setCartaoSelecionado(dadosCartoes[0].id);
      }
    } catch (erro) {
      console.error("Erro ao buscar dados base:", erro);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarComprasEFatura() {
    if (!usuario || !cartaoSelecionado) {
      setCompras([]);
      setFatura(null);
      return;
    }
    try {
      const token = await usuario.getIdToken();
      const [dadosCompras, dadosFaturas] = await Promise.all([
        cardService.getPurchases(token, mesAtual, cartaoSelecionado),
        invoiceService.getInvoices(token, cartaoSelecionado, mesAtual)
      ]);
      
      setCompras(dadosCompras);
      setFatura(dadosFaturas.length > 0 ? dadosFaturas[0] : null);
    } catch (erro) {
      console.error("Erro ao buscar compras/fatura:", erro);
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
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }

  async function handleSalvarCartao(dados) {
    try {
      setSalvando(true);
      const token = await usuario.getIdToken();
      if (cartaoEditando) {
        await cardService.updateCard(token, cartaoEditando.id, dados);
      } else {
        await cardService.createCard(token, dados);
      }
      await carregarDadosBase();
      setModalCartaoAberto(false);
      setCartaoEditando(null);
    } catch (erro) {
      console.error("Erro ao salvar cartão:", erro);
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirCartao(id) {
    if (!window.confirm("Excluir este cartão? Isso não apagará as compras já registradas.")) return;
    try {
      const token = await usuario.getIdToken();
      await cardService.deleteCard(token, id);
      await carregarDadosBase();
      if (cartaoSelecionado === id) {
        setCartaoSelecionado(cartoes.find(c => c.id !== id)?.id || null);
      }
    } catch (erro) {
      console.error("Erro ao excluir cartão:", erro);
    }
  }

  async function handleSalvarCompra(dados) {
    try {
      setSalvando(true);
      const token = await usuario.getIdToken();
      await cardService.createPurchase(token, dados);
      await carregarComprasEFatura();
      setModalCompraAberto(false);
    } catch (erro) {
      console.error("Erro ao salvar compra:", erro);
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirCompra(id) {
    if (fatura && fatura.status !== 'aberta') {
      alert("Não é possível excluir compras de uma fatura fechada ou paga.");
      return;
    }
    if (!window.confirm("Excluir esta parcela?")) return;
    try {
      const token = await usuario.getIdToken();
      await cardService.deletePurchase(token, id);
      await carregarComprasEFatura();
    } catch (erro) {
      console.error("Erro ao excluir compra:", erro);
    }
  }

  async function handleFecharFatura() {
    if (!cartaoSelecionado || totalFatura === 0) return;
    try {
      setSalvando(true);
      const token = await usuario.getIdToken();
      const cartao = cartoes.find(c => c.id === cartaoSelecionado);
      
      const [ano, mes] = mesAtual.split('-');
      const vencimento = new Date(parseInt(ano), parseInt(mes) - 1, cartao.dueDay);

      await invoiceService.saveInvoice(token, {
        cardId: cartaoSelecionado,
        month: mesAtual,
        status: 'fechada',
        totalAmount: totalFatura,
        dueDate: vencimento.toISOString()
      });
      
      await carregarComprasEFatura();
    } catch (erro) {
      console.error("Erro ao fechar fatura:", erro);
    } finally {
      setSalvando(false);
    }
  }

  async function handlePagarFatura(dadosPagamento) {
    if (!fatura) return;
    try {
      setSalvando(true);
      const token = await usuario.getIdToken();
      await invoiceService.payInvoice(token, fatura.id, dadosPagamento);
      await carregarComprasEFatura();
      setModalPagamentoAberto(false);
    } catch (erro) {
      console.error("Erro ao pagar fatura:", erro);
    } finally {
      setSalvando(false);
    }
  }

  const cartaoAtual = cartoes.find(c => c.id === cartaoSelecionado);
  const totalFatura = compras.reduce((acc, c) => acc + c.amount, 0);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paga': return { label: 'PAGA', color: 'var(--cor-sucesso)' };
      case 'fechada': return { label: 'FECHADA', color: 'var(--cor-erro)' };
      default: return { label: 'ABERTA', color: 'var(--cor-primaria)' };
    }
  };

  const statusInfo = getStatusBadge(fatura?.status || 'aberta');

  return (
    <div className="pagina-conteudo cards-page">
      <div className="pagina-titulo">
        <div>
          <h1>Cartões de Crédito</h1>
          <p>Gerencie seus cartões e acompanhe suas faturas</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--espacamento-sm)' }}>
          <Button variante="secundario" onClick={() => setModalCartaoAberto(true)} icone={Plus}>
            Novo Cartão
          </Button>
          <Button 
            onClick={() => setModalCompraAberto(true)} 
            icone={ShoppingCart} 
            disabled={!cartaoSelecionado || (fatura && fatura.status !== 'aberta')}
          >
            Lançar Compra
          </Button>
        </div>
      </div>

      {/* Seletor de Cartões */}
      <div className="cards-selector" style={{ display: 'flex', gap: 'var(--espacamento-md)', overflowX: 'auto', paddingBottom: 'var(--espacamento-md)', marginBottom: 'var(--espacamento-lg)' }}>
        {cartoes.map(cartao => (
          <div 
            key={cartao.id}
            onClick={() => setCartaoSelecionado(cartao.id)}
            style={{
              minWidth: '240px',
              padding: 'var(--espacamento-md)',
              background: cartaoSelecionado === cartao.id ? 'var(--gradiente-primario)' : 'var(--cor-fundo-card)',
              borderRadius: 'var(--raio-borda-lg)',
              border: '1px solid var(--cor-borda)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: cartaoSelecionado === cartao.id ? 'white' : 'inherit'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--espacamento-lg)' }}>
              <CreditCard size={24} opacity={0.8} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <Edit2 size={14} onClick={(e) => { e.stopPropagation(); setCartaoEditando(cartao); setModalCartaoAberto(true); }} />
                <Trash2 size={14} onClick={(e) => { e.stopPropagation(); handleExcluirCartao(cartao.id); }} />
              </div>
            </div>
            <h3 style={{ fontSize: 'var(--fonte-tamanho-base)', fontWeight: 600, marginBottom: '4px' }}>{cartao.name}</h3>
            <p style={{ fontSize: 'var(--fonte-tamanho-xs)', opacity: 0.7 }}>**** **** **** {cartao.lastDigits}</p>
          </div>
        ))}
      </div>

      {cartaoSelecionado ? (
        <>
          <div className="cards-month-bar" style={{ 
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
              <button onClick={() => mudarMes(-1)} style={{ background: 'none', border: 'none', color: 'var(--cor-texto-secundario)', cursor: 'pointer' }}>
                <ChevronLeft size={24} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px', justifyContent: 'center' }}>
                <Calendar size={18} color="var(--cor-texto-secundario)" />
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{formatarMes(mesAtual)}</span>
              </div>
              <button onClick={() => mudarMes(1)} style={{ background: 'none', border: 'none', color: 'var(--cor-texto-secundario)', cursor: 'pointer' }}>
                <ChevronRight size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-xl)' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: statusInfo.color, fontSize: '10px', fontWeight: 800, letterSpacing: '1px' }}>{statusInfo.label}</span>
                <div style={{ color: 'var(--cor-texto)', fontSize: 'var(--fonte-tamanho-lg)', fontWeight: 700 }}>
                  {formatarMoeda(totalFatura)}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--espacamento-sm)' }}>
                {(!fatura || fatura.status === 'aberta') && totalFatura > 0 && (
                  <Button onClick={handleFecharFatura} variante="secundario" estilo={{ fontSize: '12px', padding: '6px 12px' }} carregando={salvando}>
                    <Lock size={14} style={{ marginRight: '6px' }} /> Fechar Fatura
                  </Button>
                )}
                {fatura && fatura.status === 'fechada' && (
                  <Button onClick={() => setModalPagamentoAberto(true)} variante="primario" estilo={{ fontSize: '12px', padding: '6px 12px', background: 'var(--cor-sucesso)', borderColor: 'var(--cor-sucesso)' }}>
                    <CheckCircle2 size={14} style={{ marginRight: '6px' }} /> Pagar Fatura
                  </Button>
                )}
                {fatura && fatura.status === 'paga' && (
                  <div style={{ color: 'var(--cor-sucesso)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                    <CheckCircle2 size={16} /> Pago
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacamento-sm)' }}>
            {compras.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 'var(--espacamento-xl)', color: 'var(--cor-texto-terciario)' }}>Nenhuma compra nesta fatura.</p>
            ) : (
              compras.map(compra => (
                <Card key={compra.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--espacamento-md)', opacity: fatura?.status !== 'aberta' ? 0.7 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-md)' }}>
                    <CardIcone icone={ShoppingCart} cor={fatura?.status === 'paga' ? 'sucesso' : 'alerta'} />
                    <div>
                      <h3 style={{ fontSize: 'var(--fonte-tamanho-base)', fontWeight: 600 }}>{compra.description}</h3>
                      <p style={{ fontSize: 'var(--fonte-tamanho-sm)', color: 'var(--cor-texto-secundario)' }}>
                        {compra.category} • {compra.currentInstallment}/{compra.installments}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-lg)' }}>
                    <span style={{ fontWeight: 600, color: fatura?.status === 'paga' ? 'var(--cor-sucesso)' : 'var(--cor-alerta)' }}>
                      {formatarMoeda(compra.amount)}
                    </span>
                    {(!fatura || fatura.status === 'aberta') && (
                      <button 
                        onClick={() => handleExcluirCompra(compra.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--cor-erro)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 'var(--espacamento-2xl)', color: 'var(--cor-texto-terciario)' }}>
          <CreditCard size={48} style={{ opacity: 0.5, marginBottom: 'var(--espacamento-md)' }} />
          <h3>Nenhum cartão cadastrado</h3>
          <p>Adicione seu primeiro cartão de crédito para começar.</p>
        </div>
      )}

      {/* Modais */}
      <Modal 
        aberto={modalCartaoAberto} 
        aoFechar={() => { setModalCartaoAberto(false); setCartaoEditando(null); }} 
        titulo={cartaoEditando ? "Editar Cartão" : "Novo Cartão"}
      >
        <CardForm 
          initialData={cartaoEditando} 
          onSubmit={handleSalvarCartao} 
          onCancel={() => { setModalCartaoAberto(false); setCartaoEditando(null); }}
          isLoading={salvando}
        />
      </Modal>

      <Modal 
        aberto={modalCompraAberto} 
        aoFechar={() => setModalCompraAberto(false)} 
        titulo="Lançar Compra"
      >
        <PurchaseForm 
          cardId={cartaoSelecionado}
          onSubmit={handleSalvarCompra} 
          onCancel={() => setModalCompraAberto(false)}
          isLoading={salvando}
        />
      </Modal>

      <Modal
        aberto={modalPagamentoAberto}
        aoFechar={() => setModalPagamentoAberto(false)}
        titulo="Pagar Fatura"
      >
        <InvoicePaymentForm
          amount={totalFatura}
          accounts={contas}
          onSubmit={handlePagarFatura}
          onCancel={() => setModalPagamentoAberto(false)}
          isLoading={salvando}
        />
      </Modal>
    </div>
  );
}
