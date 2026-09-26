import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Landmark, LayoutGrid, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../auth';

const NAV = [
  { to: '/', label: 'Mis bonos', icon: LayoutGrid, end: true },
  { to: '/cuenta', label: 'Mi cuenta', icon: UserRound },
];

export default function Layout() {
  const { cliente, logout } = useAuth();
  const iniciales = `${cliente.nombres[0]}${cliente.apellidos[0]}`;
  const { pathname } = useLocation();

  // Cada pantalla nueva empieza desde arriba
  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">
            <span className="brand-mark"><Landmark size={18} /></span>
            <span>Mis Bonos</span>
          </NavLink>

          <nav className="nav" aria-label="Principal">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className="nav-link">
                <Icon size={17} /> {label}
              </NavLink>
            ))}
          </nav>

          <div className="user">
            <span className="avatar" aria-hidden>{iniciales}</span>
            <span className="user-name">{cliente.nombres}</span>
            <button className="icon-btn" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Principal">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="tab-link">
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
