import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import { User, Mail, Lock, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { cadastrar } = useAuth();
  const navegar = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (senha !== confirmarSenha) {
      return setErro('As senhas não coincidem.');
    }

    if (senha.length < 6) {
      return setErro('A senha deve ter pelo menos 6 caracteres.');
    }

    setCarregando(true);

    try {
      await cadastrar(nome, email, senha);
      navegar('/');
    } catch (err) {
      const mensagens = {
        'auth/email-already-in-use': 'Este e-mail já está em uso.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.'
      };
      setErro(mensagens[err.code] || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="logo">
          <h1>FinView</h1>
          <p>Crie sua conta gratuita</p>
        </div>

        <h2>Cadastro</h2>

        {erro && <div className="erro-mensagem">{erro}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="Nome completo"
            tipo="text"
            id="cadastro-nome"
            valor={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            icone={User}
            obrigatorio
          />
          <Input
            label="E-mail"
            tipo="email"
            id="cadastro-email"
            valor={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            icone={Mail}
            obrigatorio
          />
          <Input
            label="Senha"
            tipo="password"
            id="cadastro-senha"
            valor={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            icone={Lock}
            obrigatorio
          />
          <Input
            label="Confirmar senha"
            tipo="password"
            id="cadastro-confirmar"
            valor={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            placeholder="Repita a senha"
            icone={ShieldCheck}
            obrigatorio
          />
          <Button
            tipo="submit"
            variante="primario"
            tamanho="lg"
            carregando={carregando}
            className="btn-bloco"
            id="btn-cadastrar"
          >
            Criar conta
          </Button>
        </form>

        <div className="auth-links">
          <span>
            Já tem conta? <Link to="/login">Entrar</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
