import { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../hooks/useAuth';
import { categoryService } from '../../services/categories';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { FileText, DollarSign, Tag, Landmark, Calendar, Repeat, Hash } from 'lucide-react';

export default function ExpenseForm({ initialData, accounts, onSubmit, onCancel, isLoading }) {
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
    type: 'variavel',
    date: dataHoje,
    recurringMonths: 12
  });

  useEffect(() => {
    async function carregarCategorias() {
      if (!usuario) return;
      try {
        setCarregandoCategorias(true);
        const token = await usuario.getIdToken();
        const dados = await categoryService.getCategories(token, 'despesa');
        setCategorias(dados);
        
        // Selecionar a primeira categoria por padrão se não houver inicialData
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
        date: initialData.date ? initialData.date.split('T')[0] : dataHoje
      });
    }
  }, [initialData]);

  // Atualiza a conta selecionada sempre que a carteira global mudar (se não for edição)
  useEffect(() => {
    if (!initialData && carteiraSelecionada) {
      setFormData(prev => ({ ...prev, accountId: carteiraSelecionada }));
    }
  }, [carteiraSelecionada, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      amount: parseFloat(formData.amount),
      month: formData.date.substring(0, 7),
      isRecurring: formData.type === 'fixa',
      recurringMonths: formData.type === 'fixa' ? (parseInt(formData.recurringMonths) || 12) : null
    };
    
    onSubmit(dataToSubmit);
  };

  const TIPOS_DESPESA = [
    { rotulo: 'Variável', valor: 'variavel' },
    { rotulo: 'Fixa', valor: 'fixa' }
  ];

  const opcoesContas = accounts.map(acc => ({
    rotulo: acc.name,
    valor: acc.id
  }));

  // Convert categories to select options
  const opcoesCategorias = categorias.map(cat => ({
    rotulo: cat.name,
    valor: cat.name
  }));

  if (accounts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--espacamento-lg)' }}>
        <p style={{ color: 'var(--cor-texto-secundario)', marginBottom: 'var(--espacamento-md)' }}>
          Você precisa cadastrar uma carteira antes de lançar despesas.
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
        id="expense-description"
        valor={formData.description}
        onChange={handleChange}
        placeholder="Ex: Supermercado"
        icone={FileText}
        obrigatorio
      />
      
      <Input
        label="Valor (R$)"
        nome="amount"
        id="expense-amount"
        tipo="number"
        step="0.01"
        min="0"
        valor={formData.amount}
        onChange={handleChange}
        placeholder="0,00"
        icone={DollarSign}
        obrigatorio
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacamento-md)' }}>
        <Select
          label="Categoria"
          nome="category"
          id="expense-category"
          valor={formData.category}
          onChange={handleChange}
          opcoes={opcoesCategorias}
          icone={Tag}
          obrigatorio
          placeholder={carregandoCategorias ? "Carregando..." : "Selecione uma categoria"}
        />

        <Select
          label="Tipo"
          nome="type"
          id="expense-type"
          valor={formData.type}
          onChange={handleChange}
          opcoes={TIPOS_DESPESA}
          icone={Repeat}
          obrigatorio
        />
      </div>

      {formData.type === 'fixa' && !initialData && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--espacamento-md)',
          padding: 'var(--espacamento-sm) var(--espacamento-md)',
          background: 'var(--cor-primaria-transparente)',
          borderRadius: 'var(--raio-borda-md)',
          border: '1px solid var(--cor-primaria)'
        }}>
          <Hash size={16} color="var(--cor-primaria)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <label htmlFor="expense-recurring-months" style={{ fontSize: 'var(--fonte-tamanho-sm)', fontWeight: 600, color: 'var(--cor-primaria)', display: 'block', marginBottom: '4px' }}>
              Repetir por quantos meses?
            </label>
            <input
              id="expense-recurring-months"
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
                border: '1px solid var(--cor-primaria)',
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

      {formData.type === 'fixa' && initialData && (
        <div style={{
          padding: 'var(--espacamento-sm) var(--espacamento-md)',
          background: 'var(--cor-primaria-transparente)',
          borderRadius: 'var(--raio-borda-md)',
          border: '1px solid var(--cor-primaria)',
          fontSize: 'var(--fonte-tamanho-sm)',
          color: 'var(--cor-primaria)'
        }}>
          <Hash size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Despesa fixa — ao salvar, você poderá aplicar as alterações a esta ocorrência ou a todas as futuras.
        </div>
      )}

      <Select
        label="Carteira de Origem"
        nome="accountId"
        id="expense-account"
        valor={formData.accountId}
        onChange={handleChange}
        opcoes={opcoesContas}
        icone={Landmark}
        obrigatorio
      />

      <Input
        label="Data"
        nome="date"
        id="expense-date"
        tipo="date"
        valor={formData.date}
        onChange={handleChange}
        icone={Calendar}
        obrigatorio
      />

      <div style={{ display: 'flex', gap: 'var(--espacamento-sm)', marginTop: 'var(--espacamento-sm)', justifyContent: 'flex-end' }}>
        <Button variante="secundario" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button tipo="submit" variante="primario" carregando={isLoading} estilo={{ background: 'var(--cor-erro)', borderColor: 'var(--cor-erro)' }}>
          {initialData ? 'Salvar Alterações' : 'Adicionar Despesa'}
        </Button>
      </div>
    </form>
  );
}
