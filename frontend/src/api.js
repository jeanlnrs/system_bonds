const TOKEN_KEY = 'bonos.token';

export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (token) => {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* sin almacenamiento */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* sin almacenamiento */ }
  },
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const token = tokenStore.get();
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No pudimos conectar con el servidor. Revisa tu conexión.', 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('auth:expired'));
    throw new ApiError(data.error || 'Ocurrió un error inesperado.', res.status);
  }
  return data;
}

export const api = {
  login: (correo, password) => request('/auth/login', { method: 'POST', body: { correo, password } }),
  perfil: () => request('/cuenta'),
  actualizarCorreo: (correo) => request('/cuenta/correo', { method: 'PUT', body: { correo } }),
  cambiarContrasena: (actual, nueva) => request('/cuenta/contrasena', { method: 'PUT', body: { actual, nueva } }),
  resumen: () => request('/cartera/resumen'),
  bonos: () => request('/cartera/bonos'),
  bono: (id) => request(`/cartera/bonos/${id}`),
};
