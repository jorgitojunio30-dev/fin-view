import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import { Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { recuperarSenha } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);

    try {
      await recuperarSenha(email);
      setSucesso('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err) {
      const mensagens = {
        'auth/user-not-found': 'Nenhuma conta encontrada com este e-mail.',
        'auth/invalid-email': 'E-mail inválido.'
      };
      setErro(mensagens[err.code] || 'Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="logo">
          <h1>FinView</h1>
          <p>Recuperação de senha</p>
        </div>

        <h2>Esqueci minha senha</h2>

        {erro && <div className="erro-mensagem">{erro}</div>}
        {sucesso && <div className="sucesso-mensagem">{sucesso}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="E-mail cadastrado"
            tipo="email"
            id="recuperar-email"
            valor={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            icone={Mail}
            obrigatorio
          />
          <Button
            tipo="submit"
            variante="primario"
            tamanho="lg"
            carregando={carregando}
            className="btn-bloco"
            id="btn-recuperar"
          >
            Enviar e-mail de recuperação
          </Button>
        </form>

        <div className="auth-links">
          <Link to="/login">← Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
