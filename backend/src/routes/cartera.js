import { Router } from 'express';
import { callSp } from '../db.js';

const router = Router();

router.get('/resumen', async (req, res) => {
  res.json(await callSp('sp_resumen_cartera', [req.clienteId]));
});

router.get('/bonos', async (req, res) => {
  res.json(await callSp('sp_listar_bonos', [req.clienteId]));
});

router.get('/bonos/:id', async (req, res) => {
  const bonoId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(bonoId)) return res.status(400).json({ error: 'Bono inválido.' });

  const [bono] = await callSp('sp_detalle_bono', [req.clienteId, bonoId]);
  if (!bono) return res.status(404).json({ error: 'No encontramos este bono en tu cartera.' });

  const pagos = await callSp('sp_calendario_pagos', [req.clienteId, bonoId]);
  res.json({ ...bono, pagos });
});

export default router;
