import { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import Select from '../UI/Select';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { Landmark, Calendar, DollarSign } from 'lucide-react';

export default function InvoicePaymentForm({ amount, accounts, onSubmit, onCancel, isLoading }) {
  const { carteiraSelecionada } = useWallet();
  const dataHoje = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    accountId: carteiraSelecionada || (accounts.length > 0 ? accounts[0].id : ''),
    paidAt: dataHoje,
    amount: amount || 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  const opcoesContas = accounts.map(acc => ({
    rotulo: acc.name,
    valor: acc.id
  }));

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacamento-md)' }}>
      <p style={{ color: 'var(--cor-texto-secundario)', fontSize: 'var(--fonte-tamanho-sm)', marginBottom: 'var(--espacamento-xs)' }}>
        Confirme os detalhes do pagamento da fatura. Isso gerará uma despesa na carteira selecionada.
      </p>

      <Input
        label="Valor do Pagamento (R$)"
        nome="amount"
        id="payment-amount"
        tipo="number"
        step="0.01"
        valor={formData.amount}
        onChange={handleChange}
        icone={DollarSign}
        obrigatorio
      />

      <Select
        label="Pagar com a Carteira"
        nome="accountId"
        id="payment-account"
        valor={formData.accountId}
        onChange={handleChange}
        opcoes={opcoesContas}
        icone={Landmark}
        obrigatorio
      />

      <Input
        label="Data do Pagamento"
        nome="paidAt"
        id="payment-date"
        tipo="date"
        valor={formData.paidAt}
        onChange={handleChange}
        icone={Calendar}
        obrigatorio
      />

      <div style={{ display: 'flex', gap: 'var(--espacamento-sm)', marginTop: 'var(--espacamento-sm)', justifyContent: 'flex-end' }}>
        <Button variante="secundario" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button tipo="submit" variante="primario" carregando={isLoading}>
          Confirmar Pagamento
        </Button>
      </div>
    </form>
  );
}
