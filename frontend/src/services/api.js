const API_URL = 'http://192.168.1.104:3000/api';
const TIMEOUT_MS = 15000;

async function request(endpoint, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  try {
    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers, signal: controller.signal });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur serveur');
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Le serveur ne répond pas (délai dépassé)');
    if (err instanceof TypeError && err.message.includes('Network')) throw new Error('Impossible de contacter le serveur');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  sendLlmRequest: (systemPrompt, userMessage, options = {}) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ systemPrompt, userMessage, options }),
    }),
};
