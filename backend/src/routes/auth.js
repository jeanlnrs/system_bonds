import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { callSp } from '../db.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' },
});

router.post('/login', loginLimiter, async (req, res) => {
  const { correo, password } = req.body ?? {};
  if (!correo || !password) {
    return res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
  }

  const [cred] = await callSp('sp_obtener_credenciales', [String(correo)]);
  const ok = cred && (await bcrypt.compare(String(password), cred.password_hash));
  if (!ok) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }

  const [cliente] = await callSp('sp_obtener_cliente', [cred.id]);
  res.json({ token: signToken(cred.id), cliente });
});

export default router;
