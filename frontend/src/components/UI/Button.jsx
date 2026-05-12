import './Button.css';

export default function Button({
  children,
  variante = 'primario',
  tamanho = 'md',
  carregando = false,
  disabled = false,
  tipo = 'button',
  onClick,
  className = '',
  id,
  estilo,
  ...props
}) {
  return (
    <button
      type={tipo}
      className={`btn btn-${variante} btn-${tamanho} ${className}`}
      disabled={disabled || carregando}
      onClick={onClick}
      id={id}
      style={estilo}
      {...props}
    >
      {carregando ? <span className="spinner"></span> : children}
    </button>
  );
}
