import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { categoryService } from '../../services/categories';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { FileText, DollarSign, Tag, Calendar, Hash } from 'lucide-react';

export default function PurchaseForm({ cardId, onSubmit, onCancel, isLoading }) {
  const { usuario } = useAuth();
  const dataHoje = new Date().toISOString().split('T')[0];

  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({
    cardId: cardId || '',
    description: '',
    category: '',
    totalAmount: '',
    installments: '1',
    date: dataHoje
  });

  useEffect(() => {
    async function carregarCategorias() {
      if (!usuario) return;
      try {
        const token = await usuario.getIdToken();
        const dados = await categoryService.getCategories(token, 'despesa');
        setCategorias(dados);
        if (dados.length > 0) {
          setFormData(prev => ({ ...prev, category: dados[0].name }));
        }
      } catch (erro) {
        console.error("Erro ao carregar categorias:", erro);
      }
    }
    carregarCategorias();
  }, [usuario]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      totalAmount: parseFloat(formData.totalAmount),
      installments: parseInt(formData.installments)
    };
    onSubmit(dataToSubmit);
  };

  const opcoesCategorias = categorias.map(cat => ({
    rotulo: cat.name,
    valor: cat.name
  }));

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacamento-md)' }}>
      <Input
        label="Descrição"
        nome="description"
        id="purchase-description"
        valor={formData.description}
        onChange={handleChange}
        placeholder="Ex: Compra Amazon"
        icone={FileText}
        obrigatorio
      />
      
      <Input
        label="Valor Total (R$)"
        nome="totalAmount"
        id="purchase-amount"
        tipo="number"
        step="0.01"
        valor={formData.totalAmount}
        onChange={handleChange}
        placeholder="0,00"
        icone={DollarSign}
        obrigatorio
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacamento-md)' }}>
        <Select
          label="Categoria"
          nome="category"
          id="purchase-category"
          valor={formData.category}
          onChange={handleChange}
          opcoes={opcoesCategorias}
          icone={Tag}
          obrigatorio
        />

        <Input
          label="Parcelas"
          nome="installments"
          id="purchase-installments"
          tipo="number"
          min="1"
          max="48"
          valor={formData.installments}
          onChange={handleChange}
          icone={Hash}
          obrigatorio
        />
      </div>

      <Input
        label="Data da Compra"
        nome="date"
        id="purchase-date"
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
          Adicionar Compra
        </Button>
      </div>
    </form>
  );
}
