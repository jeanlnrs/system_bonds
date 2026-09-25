import { useState } from 'react';
import { ArrowRight, CalendarCheck, Eye, EyeOff, Landmark, ShieldCheck, TrendingUp } from 'lucide-react';
import { useAuth } from '../auth';

const DEMOS = [
  { nombre: 'Lucía', correo: 'lucia@demo.com' },
  { nombre: 'Carlos', correo: 'carlos@demo.com' },
  { nombre: 'Ana', correo: 'ana@demo.com' },
];

export default function Login() {
  const { login } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await login(correo, password);
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  }

  return (
    <div className="login">
      <section className="login-hero">
        <div className="brand brand-light">
          <span className="brand-mark"><Landmark size={18} /></span>
          <span>Mis Bonos</span>
        </div>
        <div className="login-hero-copy">
          <h1>Tu cartera de bonos, clara y a la mano.</h1>
          <p>Consulta tus inversiones, intereses y el calendario de pagos en un solo lugar.</p>
          <ul className="login-features">
            <li><TrendingUp size={18} /> Rendimiento y cobros al día</li>
            <li><CalendarCheck size={18} /> Pagos trimestrales, sin sorpresas</li>
            <li><ShieldCheck size={18} /> Acceso seguro a tu información</li>
          </ul>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={onSubmit} noValidate>
          <div className="brand login-brand-mobile">
            <span className="brand-mark"><Landmark size={18} /></span>
            <span>Mis Bonos</span>
          </div>
          <h2>Iniciar sesión</h2>
          <p className="muted">Ingresa con tu correo registrado.</p>

          <label className="field">
            <span>Correo electrónico</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <div className="input-group">
              <input
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-addon"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <button className="btn btn-primary btn-block" disabled={sending || !correo || !password}>
            {sending ? <span className="spinner spinner-sm" /> : <>Ingresar <ArrowRight size={18} /></>}
          </button>

          <div className="demo">
            <span>Cuentas de prueba · contraseña <code>Demo1234!</code></span>
            <div className="demo-chips">
              {DEMOS.map((d) => (
                <button
                  key={d.correo}
                  type="button"
                  className="chip"
                  onClick={() => { setCorreo(d.correo); setPassword('Demo1234!'); setError(''); }}
                >
                  {d.nombre}
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
