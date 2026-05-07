import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { accountService } from '../services/accounts';

export const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const { usuario } = useAuth();
  const [carteiras, setCarteiras] = useState([]);
  const [carteiraSelecionada, setCarteiraSelecionada] = useState(''); // '' significa TODAS
  const [carregandoCarteiras, setCarregandoCarteiras] = useState(true);

  useEffect(() => {
    async function carregarCarteiras() {
      if (!usuario) {
        setCarteiras([]);
        setCarteiraSelecionada('');
        setCarregandoCarteiras(false);
        return;
      }

      try {
        setCarregandoCarteiras(true);
        const token = await usuario.getIdToken();
        const dados = await accountService.getAccounts(token);
        setCarteiras(dados);

        // Se a selecionada atual não existe mais nos novos dados, voltamos para TODAS
        if (carteiraSelecionada && !dados.find(c => c.id === carteiraSelecionada)) {
          setCarteiraSelecionada('');
        }
      } catch (erro) {
        console.error("Erro ao carregar carteiras:", erro);
      } finally {
        setCarregandoCarteiras(false);
      }
    }

    carregarCarteiras();
  }, [usuario]);


  const recarregarCarteiras = async () => {
    if (!usuario) return;
    try {
      const token = await usuario.getIdToken();
      const dados = await accountService.getAccounts(token);
      setCarteiras(dados);
    } catch (erro) {
      console.error("Erro ao recarregar carteiras:", erro);
    }
  };

  const valor = {
    carteiras,
    carteiraSelecionada,
    setCarteiraSelecionada,
    carregandoCarteiras,
    recarregarCarteiras
  };

  return (
    <WalletContext.Provider value={valor}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet deve ser usado dentro de um WalletProvider');
  }
  return context;
}
