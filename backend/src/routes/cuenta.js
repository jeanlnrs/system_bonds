import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { callSp } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const [cliente] = await callSp('sp_obtener_cliente', [req.clienteId]);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  res.json(cliente);
});

router.put('/correo', async (req, res) => {
  const correo = String(req.body?.correo ?? '').trim();
  if (!correo) return res.status(400).json({ error: 'Ingresa un correo.' });

  try {
    const [row] = await callSp('sp_actualizar_correo', [req.clienteId, correo]);
    res.json({ correo: row.correo, mensaje: 'Correo actualizado correctamente.' });
  } catch (err) {
    if (err.message?.includes('CORREO_INVALIDO')) {
      return res.status(400).json({ error: 'El formato del correo no es válido.' });
    }
    if (err.message?.includes('CORREO_EN_USO')) {
      return res.status(409).json({ error: 'Ese correo ya está registrado por otro cliente.' });
    }
    throw err;
  }
});

router.put('/contrasena', async (req, res) => {
  const { actual, nueva } = req.body ?? {};
  if (!actual || !nueva) {
    return res.status(400).json({ error: 'Completa la contraseña actual y la nueva.' });
  }
  if (String(nueva).length < 8 || !/[A-Za-z]/.test(nueva) || !/\d/.test(nueva)) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres, letras y números.' });
  }

  const [row] = await callSp('sp_obtener_hash_cliente', [req.clienteId]);
  if (!row || !(await bcrypt.compare(String(actual), row.password_hash))) {
    return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
  }

  const hash = await bcrypt.hash(String(nueva), 10);
  await callSp('sp_actualizar_contrasena', [req.clienteId, hash]);
  res.json({ mensaje: 'Contraseña actualizada correctamente.' });
});

export default router;
