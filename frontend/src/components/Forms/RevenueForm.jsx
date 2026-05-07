import { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../hooks/useAuth';
import { categoryService } from '../../services/categories';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { FileText, DollarSign, Tag, Landmark, Calendar } from 'lucide-react';

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
    date: dataHoje
  });

  useEffect(() => {
    async function carregarCategorias() {
      if (!usuario) return;
      try {
        setCarregandoCategorias(true);
        const token = await usuario.getIdToken();
        const dados = await categoryService.getCategories(token, 'receita');
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
    
    // Parse values before submit
    const dataToSubmit = {
      ...formData,
      amount: parseFloat(formData.amount),
      // Set the month field as YYYY-MM based on the date
      month: formData.date.substring(0, 7)
    };
    
    onSubmit(dataToSubmit);
  };

  // Convert accounts to select options
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
        disabled={true}
        title="A carteira deve ser alterada no seletor global no topo da página"
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
