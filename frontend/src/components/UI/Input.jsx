import './Input.css';

export default function Input({
  label,
  tipo = 'text',
  valor,
  onChange,
  placeholder,
  obrigatorio = false,
  erro,
  id,
  nome,
  icone: Icone,
  ...props
}) {
  return (
    <div className="campo-grupo">
      {label && (
        <label htmlFor={id} className="campo-label">
          {label} {obrigatorio && <span className="campo-obrigatorio">*</span>}
        </label>
      )}
      <div className={`campo-wrapper ${erro ? 'campo-erro' : ''} ${Icone ? 'com-icone' : ''}`}>
        {Icone && <Icone size={18} className="campo-icone" />}
        <input
          type={tipo}
          id={id}
          name={nome}
          value={valor}
          onChange={onChange}
          placeholder={placeholder}
          required={obrigatorio}
          className="campo-input"
          {...props}
        />
      </div>
      {erro && <span className="campo-erro-texto">{erro}</span>}
    </div>
  );
}
