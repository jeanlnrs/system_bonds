import { useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../components/Toast';
import { date } from '../format';

export default function Account() {
  const { cliente } = useAuth();

  return (
    <>
      <div className="page-head">
        <h1>Mi cuenta</h1>
        <p className="muted">Administra tus datos de acceso.</p>
      </div>

      <section className="profile-card">
        <span className="avatar avatar-lg" aria-hidden>{cliente.nombres[0]}{cliente.apellidos[0]}</span>
        <div>
          <h2>{cliente.nombres} {cliente.apellidos}</h2>
          <p className="muted">DNI {cliente.documento} · Cliente desde {date(cliente.cliente_desde)}</p>
        </div>
      </section>

      <div className="account-grid">
        <EmailForm />
        <PasswordForm />
      </div>
    </>
  );
}

function EmailForm() {
  const { cliente, setCliente } = useAuth();
  const notify = useToast();
  const [correo, setCorreo] = useState(cliente.correo);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const cambiado = correo.trim().toLowerCase() !== cliente.correo;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.actualizarCorreo(correo);
      setCliente({ ...cliente, correo: res.correo });
      setCorreo(res.correo);
      notify(res.mensaje);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h3><Mail size={18} /> Correo electrónico</h3>
      <p className="muted small">Lo usamos para iniciar sesión y enviarte avisos de pagos.</p>

      <label className="field">
        <span>Correo</span>
        <input type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
      </label>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <button className="btn btn-primary" disabled={!cambiado || saving}>
        {saving ? <span className="spinner spinner-sm" /> : 'Guardar correo'}
      </button>
    </form>
  );
}

const REGLAS = [
  { test: (v) => v.length >= 8, label: 'Al menos 8 caracteres' },
  { test: (v) => /[A-Za-z]/.test(v), label: 'Contiene letras' },
  { test: (v) => /\d/.test(v), label: 'Contiene números' },
];

function PasswordForm() {
  const notify = useToast();
  const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const reglasOk = REGLAS.every((r) => r.test(form.nueva));
  const coincide = form.nueva && form.nueva === form.confirmar;
  const valido = form.actual && reglasOk && coincide;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.cambiarContrasena(form.actual, form.nueva);
      setForm({ actual: '', nueva: '', confirmar: '' });
      notify(res.mensaje);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const type = show ? 'text' : 'password';

  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <div className="form-card-head">
        <h3><KeyRound size={18} /> Contraseña</h3>
        <button type="button" className="link-btn" onClick={() => setShow((s) => !s)}>
          {show ? <><EyeOff size={15} /> Ocultar</> : <><Eye size={15} /> Mostrar</>}
        </button>
      </div>

      <label className="field">
        <span>Contraseña actual</span>
        <input type={type} autoComplete="current-password" value={form.actual} onChange={set('actual')} />
      </label>
      <label className="field">
        <span>Nueva contraseña</span>
        <input type={type} autoComplete="new-password" value={form.nueva} onChange={set('nueva')} />
      </label>

      <ul className="rules">
        {REGLAS.map((r) => (
          <li key={r.label} className={r.test(form.nueva) ? 'ok' : ''}><Check size={14} /> {r.label}</li>
        ))}
      </ul>

      <label className="field">
        <span>Confirmar nueva contraseña</span>
        <input type={type} autoComplete="new-password" value={form.confirmar} onChange={set('confirmar')} />
        {form.confirmar && !coincide && <small className="field-error">Las contraseñas no coinciden.</small>}
      </label>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <button className="btn btn-primary" disabled={!valido || saving}>
        {saving ? <span className="spinner spinner-sm" /> : 'Actualizar contraseña'}
      </button>
    </form>
  );
}
