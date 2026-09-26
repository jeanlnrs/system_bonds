import jwt from 'jsonwebtoken';

const DEV_SECRET = 'dev-secret-cambiar-en-produccion';

export const JWT_SECRET = process.env.JWT_SECRET || DEV_SECRET;

if (JWT_SECRET === DEV_SECRET && process.env.VERCEL) {
  throw new Error('JWT_SECRET no está configurado en las variables de entorno de Vercel.');
}
if (JWT_SECRET === DEV_SECRET) {
  console.warn('⚠  JWT_SECRET no definido: usando un secreto de desarrollo.');
}

export function signToken(clienteId) {
  return jwt.sign({ sub: String(clienteId) }, JWT_SECRET, { expiresIn: '8h' });
}

export function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Sesión no válida. Inicia sesión nuevamente.' });
  }
  try {
    req.clienteId = Number(jwt.verify(token, JWT_SECRET).sub);
    next();
  } catch {
    res.status(401).json({ error: 'Tu sesión expiró. Inicia sesión nuevamente.' });
  }
}
