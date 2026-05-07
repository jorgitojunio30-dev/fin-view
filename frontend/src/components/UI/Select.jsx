import './Input.css';

export default function Select({
  label,
  valor,
  onChange,
  opcoes = [],
  placeholder = 'Selecione...',
  obrigatorio = false,
  erro,
  id,
  nome,
  ...props
}) {
  return (
    <div className="campo-grupo">
      {label && (
        <label htmlFor={id} className="campo-label">
          {label} {obrigatorio && <span className="campo-obrigatorio">*</span>}
        </label>
      )}
      <div className={`campo-wrapper ${erro ? 'campo-erro' : ''}`}>
        <select
          id={id}
          name={nome}
          value={valor}
          onChange={onChange}
          required={obrigatorio}
          className="campo-input"
          {...props}
        >
          <option value="">{placeholder}</option>
          {opcoes.map((opcao) => (
            <option key={opcao.valor || opcao} value={opcao.valor || opcao}>
              {opcao.rotulo || opcao}
            </option>
          ))}
        </select>
      </div>
      {erro && <span className="campo-erro-texto">{erro}</span>}
    </div>
  );
}
