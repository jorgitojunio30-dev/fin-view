import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import { Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { entrar } = useAuth();
  const navegar = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      await entrar(email, senha);
      navegar('/');
    } catch (err) {
      const mensagens = {
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.'
      };
      setErro(mensagens[err.code] || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="logo">
          <h1>FinView</h1>
          <p>Gestão Financeira Inteligente</p>
        </div>

        <h2>Entrar</h2>

        {erro && <div className="erro-mensagem">{erro}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="E-mail"
            tipo="email"
            id="login-email"
            valor={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            icone={Mail}
            obrigatorio
          />
          <Input
            label="Senha"
            tipo="password"
            id="login-senha"
            valor={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            icone={Lock}
            obrigatorio
          />
          <Button
            tipo="submit"
            variante="primario"
            tamanho="lg"
            carregando={carregando}
            className="btn-bloco"
            id="btn-entrar"
          >
            Entrar
          </Button>
        </form>

        <div className="auth-links">
          <Link to="/recuperar-senha">Esqueci minha senha</Link>
          <span>
            Não tem conta? <Link to="/cadastro">Criar conta</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
