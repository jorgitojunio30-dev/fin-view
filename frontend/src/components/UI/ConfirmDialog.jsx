import { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';
import './ConfirmDialog.css';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ aberto: false, mensagem: '', resolve: null });

  const confirmar = useCallback((mensagem) => {
    return new Promise((resolve) => {
      setState({ aberto: true, mensagem, resolve });
    });
  }, []);

  function handleConfirm() {
    state.resolve(true);
    setState({ aberto: false, mensagem: '', resolve: null });
  }

  function handleCancel() {
    state.resolve(false);
    setState({ aberto: false, mensagem: '', resolve: null });
  }

  return (
    <ConfirmContext.Provider value={{ confirmar }}>
      {children}
      {state.aberto && (
        <div className="confirm-overlay" onClick={handleCancel}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icone">
              <AlertTriangle size={24} />
            </div>
            <p className="confirm-mensagem">{state.mensagem}</p>
            <div className="confirm-acoes">
              <Button variante="secundario" onClick={handleCancel}>Cancelar</Button>
              <Button variante="primario" onClick={handleConfirm}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm deve ser usado dentro de um ConfirmProvider');
  }
  return context.confirmar;
}
