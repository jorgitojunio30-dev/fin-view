import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Toast.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const sucesso = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const erro = useCallback((msg) => addToast(msg, 'error', 5000), [addToast]);
  const aviso = useCallback((msg) => addToast(msg, 'warning', 4000), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ sucesso, erro, aviso, info }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const [saindo, setSaindo] = useState(false);

  function handleClose() {
    setSaindo(true);
    setTimeout(onClose, 200);
  }

  const icones = {
    success: <CheckCircle2 size={18} />,
    error: <XCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />
  };

  return (
    <div className={`toast toast-${toast.type} ${saindo ? 'toast-saindo' : ''}`}>
      <span className="toast-icone">{icones[toast.type]}</span>
      <span className="toast-msg">{toast.message}</span>
      <button className="toast-fechar" onClick={handleClose}>
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}
