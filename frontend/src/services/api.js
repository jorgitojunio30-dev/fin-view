// Em desenvolvimento, VITE_API_URL deve ser '' (vazio) para usar o proxy do Vite.
// Em produção, defina VITE_API_URL com a URL completa do backend.
// Ex: VITE_API_URL=https://fin-view-api.onrender.com
const API_URL = import.meta.env.VITE_API_URL ?? '';

/**
 * Faz uma requisição autenticada para a API.
 * @param {string} caminho - Endpoint da API (ex: '/accounts')
 * @param {object} opcoes - Opções do fetch (method, body, etc.)
 * @param {string} token - Token JWT do Firebase Auth
 */
export async function apiRequest(caminho, opcoes = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...opcoes.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers,
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(erro.detail || `Erro ${resposta.status}`);
  }

  return resposta.json();
}

export default apiRequest;
