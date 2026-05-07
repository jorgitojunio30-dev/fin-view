import { useState, useEffect } from 'react';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { CreditCard, Calendar, Landmark } from 'lucide-react';

export default function CardForm({ initialData, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    lastDigits: '',
    limit: '',
    closingDay: '',
    dueDay: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      limit: parseFloat(formData.limit),
      closingDay: parseInt(formData.closingDay),
      dueDay: parseInt(formData.dueDay)
    };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacamento-md)' }}>
      <Input
        label="Nome do Cartão"
        nome="name"
        id="card-name"
        valor={formData.name}
        onChange={handleChange}
        placeholder="Ex: Nubank, Inter..."
        icone={CreditCard}
        obrigatorio
      />
      
      <Input
        label="4 Últimos Dígitos"
        nome="lastDigits"
        id="card-digits"
        valor={formData.lastDigits}
        onChange={handleChange}
        placeholder="1234"
        maxLength="4"
        obrigatorio
      />

      <Input
        label="Limite (R$)"
        nome="limit"
        id="card-limit"
        tipo="number"
        step="0.01"
        valor={formData.limit}
        onChange={handleChange}
        placeholder="0,00"
        icone={Landmark}
        obrigatorio
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacamento-md)' }}>
        <Input
          label="Dia de Fechamento"
          nome="closingDay"
          id="card-closing"
          tipo="number"
          min="1"
          max="31"
          valor={formData.closingDay}
          onChange={handleChange}
          placeholder="Dia"
          icone={Calendar}
          obrigatorio
        />

        <Input
          label="Dia de Vencimento"
          nome="dueDay"
          id="card-due"
          tipo="number"
          min="1"
          max="31"
          valor={formData.dueDay}
          onChange={handleChange}
          placeholder="Dia"
          icone={Calendar}
          obrigatorio
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--espacamento-sm)', marginTop: 'var(--espacamento-sm)', justifyContent: 'flex-end' }}>
        <Button variante="secundario" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button tipo="submit" variante="primario" carregando={isLoading}>
          {initialData ? 'Salvar Alterações' : 'Adicionar Cartão'}
        </Button>
      </div>
    </form>
  );
}
