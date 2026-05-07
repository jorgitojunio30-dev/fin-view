import { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../hooks/useAuth';
import { categoryService } from '../../services/categories';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { FileText, DollarSign, Tag, Landmark, Calendar, Repeat, Hash } from 'lucide-react';

export default function RevenueForm({ initialData, accounts, onSubmit, onCancel, isLoading }) {
  const { carteiraSelecionada } = useWallet();
  const { usuario } = useAuth();
  const dataHoje = new Date().toISOString().split('T')[0];

  const [categorias, setCategorias] = useState([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    accountId: initialData?.accountId || carteiraSelecionada || (accounts.length > 0 ? accounts[0].id : ''),
    date: dataHoje,
    isFixed: false,
    recurringMonths: 12
  });

  useEffect(() => {
    async function carregarCategorias() {
      if (!usuario) return;
      try {
        setCarregandoCategorias(true);
        const token = await usuario.getIdToken();
        const dados = await categoryService.getCategories(token, 'receita');
        setCategorias(dados);

        if (!initialData && dados.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: dados[0].name }));
        }
      } catch (erro) {
        console.error("Erro ao carregar categorias:", erro);
      } finally {
        setCarregandoCategorias(false);
      }
    }
    carregarCategorias();
  }, [usuario, initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: initialData.date ? initialData.date.split('T')[0] : dataHoje,
        isFixed: initialData.isFixed || false,
        recurringMonths: initialData.recurringMonths || 12
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (!initialData && carteiraSelecionada) {
      setFormData(prev => ({ ...prev, accountId: carteiraSelecionada }));
    }
  }, [carteiraSelecionada, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      amount: parseFloat(formData.amount),
      month: formData.date.substring(0, 7),
      recurringMonths: formData.isFixed ? (parseInt(formData.recurringMonths) || 12) : null
    };

    onSubmit(dataToSubmit);
  };

  const opcoesContas = accounts.map(acc => ({ rotulo: acc.name, valor: acc.id }));
  const opcoesCategorias = categorias.map(cat => ({ rotulo: cat.name, valor: cat.name }));

  if (accounts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--espacamento-lg)' }}>
        <p style={{ color: 'var(--cor-texto-secundario)', marginBottom: 'var(--espacamento-md)' }}>
          Você precisa cadastrar uma carteira antes de lançar receitas.
        </p>
        <Button onClick={onCancel} variante="secundario">Fechar</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacamento-md)' }}>
      <Input
        label="Descrição"
        nome="description"
        id="revenue-description"
        valor={formData.description}
        onChange={handleChange}
        placeholder="Ex: Salário Mensal"
        icone={FileText}
        obrigatorio
      />

      <Input
        label="Valor (R$)"
        nome="amount"
        id="revenue-amount"
        tipo="number"
        step="0.01"
        min="0"
        valor={formData.amount}
        onChange={handleChange}
        placeholder="0,00"
        icone={DollarSign}
        obrigatorio
      />

      <Select
        label="Categoria"
        nome="category"
        id="revenue-category"
        valor={formData.category}
        onChange={handleChange}
        opcoes={opcoesCategorias}
        icone={Tag}
        obrigatorio
        placeholder={carregandoCategorias ? "Carregando..." : "Selecione uma categoria"}
      />

      <Select
        label="Carteira de Destino"
        nome="accountId"
        id="revenue-account"
        valor={formData.accountId}
        onChange={handleChange}
        opcoes={opcoesContas}
        icone={Landmark}
        obrigatorio
      />

      <Input
        label="Data"
        nome="date"
        id="revenue-date"
        tipo="date"
        valor={formData.date}
        onChange={handleChange}
        icone={Calendar}
        obrigatorio
      />

      {/* Checkbox receita fixa */}
      {!initialData && (
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--espacamento-sm)',
          cursor: 'pointer',
          padding: 'var(--espacamento-sm) var(--espacamento-md)',
          background: formData.isFixed ? 'rgba(16,185,129,0.08)' : 'var(--cor-fundo-input)',
          borderRadius: 'var(--raio-borda-md)',
          border: `1px solid ${formData.isFixed ? 'var(--cor-sucesso)' : 'var(--cor-borda)'}`,
          transition: 'all 0.2s'
        }}>
          <input
            type="checkbox"
            name="isFixed"
            id="revenue-fixed"
            checked={formData.isFixed}
            onChange={handleChange}
            style={{ width: '16px', height: '16px', accentColor: 'var(--cor-sucesso)', cursor: 'pointer' }}
          />
          <Repeat size={16} color={formData.isFixed ? 'var(--cor-sucesso)' : 'var(--cor-texto-secundario)'} />
          <span style={{
            fontSize: 'var(--fonte-tamanho-sm)',
            fontWeight: 600,
            color: formData.isFixed ? 'var(--cor-sucesso)' : 'var(--cor-texto-secundario)'
          }}>
            Receita fixa (repete todo mês)
          </span>
        </label>
      )}

      {/* Campo de meses — aparece só ao criar receita fixa */}
      {formData.isFixed && !initialData && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--espacamento-md)',
          padding: 'var(--espacamento-sm) var(--espacamento-md)',
          background: 'rgba(16,185,129,0.08)',
          borderRadius: 'var(--raio-borda-md)',
          border: '1px solid var(--cor-sucesso)'
        }}>
          <Hash size={16} color="var(--cor-sucesso)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <label htmlFor="revenue-recurring-months" style={{
              fontSize: 'var(--fonte-tamanho-sm)',
              fontWeight: 600,
              color: 'var(--cor-sucesso)',
              display: 'block',
              marginBottom: '4px'
            }}>
              Repetir por quantos meses?
            </label>
            <input
              id="revenue-recurring-months"
              name="recurringMonths"
              type="number"
              min="1"
              max="120"
              value={formData.recurringMonths}
              onChange={handleChange}
              style={{
                width: '80px',
                padding: '4px 8px',
                borderRadius: 'var(--raio-borda-sm)',
                border: '1px solid var(--cor-sucesso)',
                background: 'var(--cor-fundo-input)',
                color: 'var(--cor-texto)',
                fontSize: 'var(--fonte-tamanho-sm)',
                fontWeight: 600
              }}
            />
          </div>
          <span style={{ fontSize: 'var(--fonte-tamanho-xs)', color: 'var(--cor-texto-secundario)', textAlign: 'right' }}>
            Será criada em {formData.recurringMonths || 12} mês{(formData.recurringMonths || 12) > 1 ? 'es' : ''}
          </span>
        </div>
      )}

      {/* Aviso ao editar receita fixa */}
      {formData.isFixed && initialData && (
        <div style={{
          padding: 'var(--espacamento-sm) var(--espacamento-md)',
          background: 'rgba(16,185,129,0.08)',
          borderRadius: 'var(--raio-borda-md)',
          border: '1px solid var(--cor-sucesso)',
          fontSize: 'var(--fonte-tamanho-sm)',
          color: 'var(--cor-sucesso)'
        }}>
          <Repeat size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Receita fixa — ao salvar, você poderá aplicar as alterações a esta ocorrência ou a todas as futuras.
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--espacamento-sm)', marginTop: 'var(--espacamento-sm)', justifyContent: 'flex-end' }}>
        <Button variante="secundario" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button tipo="submit" variante="primario" carregando={isLoading}>
          {initialData ? 'Salvar Alterações' : 'Adicionar Receita'}
        </Button>
      </div>
    </form>
  );
}
