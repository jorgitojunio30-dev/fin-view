import { useState, useEffect } from 'react';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { Building2, Landmark } from 'lucide-react';

export default function AccountForm({ initialData, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
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
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacamento-md)' }}>
      <Input
        label="Nome da Carteira"
        nome="name"
        id="account-name"
        valor={formData.name}
        onChange={handleChange}
        placeholder="Ex: Conta Pessoal, Caixinha do Time"
        icone={Landmark}
        obrigatorio
      />
      
      <Input
        label="Descrição (Opcional)"
        nome="description"
        id="account-description"
        valor={formData.description || ''}
        onChange={handleChange}
        placeholder="Ex: Usada para as despesas da casa"
        icone={Building2}
      />

      <div style={{ display: 'flex', gap: 'var(--espacamento-sm)', marginTop: 'var(--espacamento-sm)', justifyContent: 'flex-end' }}>
        <Button variante="secundario" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button tipo="submit" variante="primario" carregando={isLoading}>
          {initialData ? 'Salvar Alterações' : 'Adicionar Carteira'}
        </Button>
      </div>
    </form>
  );
}
