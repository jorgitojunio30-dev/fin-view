import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { categoryService } from '../services/categories';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import CategoryForm from '../components/Forms/CategoryForm';
import { Tag, Plus, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function Categories() {
  const { usuario } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarCategorias();
  }, [usuario]);

  async function carregarCategorias() {
    if (!usuario) return;
    try {
      setCarregando(true);
      const token = await usuario.getIdToken();
      const dados = await categoryService.getCategories(token);
      setCategorias(dados);
    } catch (erro) {
      console.error("Erro ao buscar categorias:", erro);
    } finally {
      setCarregando(false);
    }
  }

  function abrirModal(categoria = null) {
    setCategoriaEditando(categoria);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setCategoriaEditando(null);
  }

  async function handleSubmit(dados) {
    try {
      setSalvando(true);
      const token = await usuario.getIdToken();
      
      if (categoriaEditando) {
        await categoryService.updateCategory(token, categoriaEditando.id, dados);
      } else {
        await categoryService.createCategory(token, dados);
      }
      
      await carregarCategorias();
      fecharModal();
    } catch (erro) {
      console.error("Erro ao salvar categoria:", erro);
      alert("Houve um erro ao salvar a categoria.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(id) {
    if (!window.confirm("Tem certeza que deseja excluir esta categoria?")) return;
    
    try {
      setCarregando(true);
      const token = await usuario.getIdToken();
      await categoryService.deleteCategory(token, id);
      await carregarCategorias();
    } catch (erro) {
      console.error("Erro ao excluir categoria:", erro);
      alert("Houve um erro ao excluir.");
      setCarregando(false);
    }
  }

  const receitas = categorias.filter(c => c.type === 'receita');
  const despesas = categorias.filter(c => c.type === 'despesa');

  return (
    <div className="pagina-conteudo">
      <div className="pagina-titulo">
        <div>
          <h1>Categorias</h1>
          <p>Personalize as categorias para seus lançamentos</p>
        </div>
        <Button onClick={() => abrirModal()} icone={Plus}>
          <Plus size={18} /> Nova Categoria
        </Button>
      </div>

      <div style={{ display: 'grid', gap: 'var(--espacamento-xl)', gridTemplateColumns: '1fr 1fr' }}>
        {/* Coluna Receitas */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-sm)', marginBottom: 'var(--espacamento-md)' }}>
            <ArrowDownCircle color="var(--cor-sucesso)" size={20} />
            <h2 style={{ fontSize: 'var(--fonte-tamanho-lg)' }}>Categorias de Receita</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacamento-sm)' }}>
            {receitas.length === 0 && !carregando && (
              <p style={{ color: 'var(--cor-texto-terciario)', fontSize: 'var(--fonte-tamanho-sm)' }}>Nenhuma categoria de receita cadastrada.</p>
            )}
            {receitas.map(cat => (
              <CategoryCard key={cat.id} categoria={cat} onEdit={abrirModal} onDelete={handleExcluir} />
            ))}
          </div>
        </div>

        {/* Coluna Despesas */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-sm)', marginBottom: 'var(--espacamento-md)' }}>
            <ArrowUpCircle color="var(--cor-erro)" size={20} />
            <h2 style={{ fontSize: 'var(--fonte-tamanho-lg)' }}>Categorias de Despesa</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacamento-sm)' }}>
            {despesas.length === 0 && !carregando && (
              <p style={{ color: 'var(--cor-texto-terciario)', fontSize: 'var(--fonte-tamanho-sm)' }}>Nenhuma categoria de despesa cadastrada.</p>
            )}
            {despesas.map(cat => (
              <CategoryCard key={cat.id} categoria={cat} onEdit={abrirModal} onDelete={handleExcluir} />
            ))}
          </div>
        </div>
      </div>

      <Modal 
        aberto={modalAberto} 
        aoFechar={fecharModal} 
        titulo={categoriaEditando ? "Editar Categoria" : "Nova Categoria"}
      >
        <CategoryForm 
          initialData={categoriaEditando} 
          onSubmit={handleSubmit} 
          onCancel={fecharModal}
          isLoading={salvando}
        />
      </Modal>
    </div>
  );
}

function CategoryCard({ categoria, onEdit, onDelete }) {
  return (
    <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--espacamento-sm) var(--espacamento-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacamento-md)' }}>
        <div style={{ 
          width: '12px', 
          height: '12px', 
          borderRadius: '50%', 
          backgroundColor: categoria.color || '#3b82f6' 
        }} />
        <span style={{ fontWeight: 500 }}>{categoria.name}</span>
      </div>
      <div style={{ display: 'flex', gap: 'var(--espacamento-xs)' }}>
        <button 
          onClick={() => onEdit(categoria)}
          style={{ background: 'none', border: 'none', color: 'var(--cor-texto-secundario)', cursor: 'pointer', padding: '4px' }}
        >
          <Edit2 size={14} />
        </button>
        <button 
          onClick={() => onDelete(categoria.id)}
          style={{ background: 'none', border: 'none', color: 'var(--cor-erro)', cursor: 'pointer', padding: '4px' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </Card>
  );
}
