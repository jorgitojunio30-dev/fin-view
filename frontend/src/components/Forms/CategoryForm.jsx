import { useState, useEffect } from 'react';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { Tag, Palette } from 'lucide-react';

const TIPOS_CATEGORIA = [
  { rotulo: 'Receita', valor: 'receita' },
  { rotulo: 'Despesa', valor: 'despesa' }
];

const CORES_PADRAO = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', '#06b6d4'
];

export default function CategoryForm({ initialData, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'despesa',
    color: '#3b82f6'
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
        label="Nome da Categoria"
        nome="name"
        id="category-name"
        valor={formData.name}
        onChange={handleChange}
        placeholder="Ex: Alimentação, Bônus..."
        icone={Tag}
        obrigatorio
      />
      
      <Select
        label="Tipo"
        nome="type"
        id="category-type"
        valor={formData.type}
        onChange={handleChange}
        opcoes={TIPOS_CATEGORIA}
        obrigatorio
      />

      <div className="campo-grupo">
        <label className="campo-label">Cor da Categoria</label>
        <div style={{ display: 'flex', gap: 'var(--espacamento-sm)', flexWrap: 'wrap', marginTop: 'var(--espacamento-xs)' }}>
          {CORES_PADRAO.map(cor => (
            <div 
              key={cor}
              onClick={() => setFormData(prev => ({ ...prev, color: cor }))}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: cor,
                cursor: 'pointer',
                border: formData.color === cor ? '3px solid white' : '1px solid var(--cor-borda)',
                boxShadow: formData.color === cor ? '0 0 0 2px ' + cor : 'none',
                transition: 'all 0.2s'
              }}
            />
          ))}
          <input 
            type="color" 
            value={formData.color} 
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            style={{ width: '32px', height: '32px', padding: '0', border: 'none', background: 'none', cursor: 'pointer' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--espacamento-sm)', marginTop: 'var(--espacamento-sm)', justifyContent: 'flex-end' }}>
        <Button variante="secundario" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button tipo="submit" variante="primario" carregando={isLoading}>
          {initialData ? 'Salvar Alterações' : 'Adicionar Categoria'}
        </Button>
      </div>
    </form>
  );
}
