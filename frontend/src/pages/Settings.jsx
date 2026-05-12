import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import './Settings.css';

export default function Settings() {
  const { usuario, atualizarPerfilUsuario, recuperarSenha, excluirConta } = useAuth();
  const [nome, setNome] = useState(usuario?.displayName || '');
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSalvarPerfil(e) {
    e.preventDefault();
    try {
      setSalvando(true);
      setSucesso('');
      setErro('');
      await atualizarPerfilUsuario(nome);
      setSucesso('Perfil atualizado!');
    } catch (err) {
      setErro('Erro ao atualizar.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleRecuperarSenha() {
    try {
      setSucesso('');
      await recuperarSenha(usuario.email);
      setSucesso('E-mail de recuperação enviado!');
    } catch (err) {
      setErro('Erro ao enviar e-mail.');
    }
  }

  async function handleExcluirConta() {
    if (!window.confirm('Tem certeza? Esta ação é irreversível.')) return;
    try {
      await excluirConta();
    } catch (err) {
      setErro('Erro ao excluir conta. Faça login novamente e tente de novo.');
    }
  }

  return (
    <div className="pagina-conteudo">
      <div className="pagina-titulo">
        <h1>Configurações</h1>
      </div>

      <Card className="settings-card">
        <h3>Meu Perfil</h3>
        <form onSubmit={handleSalvarPerfil}>
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Button type="submit" isLoading={salvando}>Salvar</Button>
        </form>
      </Card>

      <Card className="settings-card" style={{ marginTop: '20px' }}>
        <h3>Segurança</h3>
        <p style={{ fontSize: '14px', color: 'var(--cor-texto-secundario)', marginBottom: '10px' }}>
          Receba um link de redefinição de senha no seu e-mail.
        </p>
        <Button onClick={handleRecuperarSenha} variante="secundario">Redefinir Senha</Button>
      </Card>

      <Card className="settings-card" style={{ marginTop: '20px', borderColor: 'var(--cor-erro)' }}>
        <h3 style={{ color: 'var(--cor-erro)' }}>Zona de Perigo</h3>
        <p style={{ fontSize: '14px', color: 'var(--cor-texto-secundario)', marginBottom: '10px' }}>
          Excluir sua conta é uma ação permanente.
        </p>
        <Button onClick={handleExcluirConta} variante="perigo">Excluir Conta</Button>
      </Card>
      
      {sucesso && <p style={{ color: 'var(--cor-sucesso)', marginTop: '10px' }}>{sucesso}</p>}
      {erro && <p style={{ color: 'var(--cor-erro)', marginTop: '10px' }}>{erro}</p>}
    </div>
  );
}
