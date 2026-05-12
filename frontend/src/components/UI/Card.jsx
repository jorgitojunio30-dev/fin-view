import './Card.css';

export default function Card({ children, className = '', variante, onClick, id, style }) {
  return (
    <div
      className={`card ${variante ? `card-${variante}` : ''} ${onClick ? 'card-clicavel' : ''} ${className}`}
      onClick={onClick}
      id={id}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardIcone({ icone: Icone, cor = 'primario' }) {
  return (
    <div className={`card-icone card-icone-${cor}`}>
      <Icone size={22} />
    </div>
  );
}
