import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarClock, Search, Wallet } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useApi } from '../useApi';
import { date, money, percent, relativeDays, riskTone } from '../format';
import { Badge, ErrorState, Progress, Skeleton } from '../components/ui';

const ESTADOS = ['Todos', 'Activo', 'Vencido'];

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Dashboard() {
  const { cliente } = useAuth();
  const { data, error, loading, retry } = useApi(
    () => Promise.all([api.resumen(), api.bonos()]).then(([resumen, bonos]) => ({ resumen, bonos })),
  );

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">{saludo()}, {cliente.nombres}</p>
        <h1>Mis bonos corporativos</h1>
        <p className="muted">Tus inversiones, intereses cobrados y próximos pagos.</p>
      </div>

      {loading && <DashboardSkeleton />}
      {error && <ErrorState error={error} onRetry={retry} />}
      {data && <DashboardContent resumen={data.resumen} bonos={data.bonos} />}
    </>
  );
}

function DashboardContent({ resumen, bonos }) {
  const [estado, setEstado] = useState('Todos');
  const [query, setQuery] = useState('');

  const [actual] = resumen;

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bonos.filter((b) =>
      (estado === 'Todos' || b.estado === estado) &&
      (!q || [b.nombre, b.emisor, b.sector, b.numero_serie].some((t) => t.toLowerCase().includes(q))),
    );
  }, [bonos, estado, query]);

  if (!bonos.length) {
    return (
      <div className="state-card">
        <Wallet size={28} />
        <h3>Aún no tienes bonos</h3>
        <p>Cuando adquieras un bono aparecerá aquí con su calendario de pagos.</p>
      </div>
    );
  }

  return (
    <>
      {actual && <SummaryHero r={actual} />}

      <div className="section-head">
        <h2>Listado de bonos <span className="muted">({filtrados.length})</span></h2>
        <div className="filters">
          <label className="search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Buscar serie, emisor o sector"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar bonos"
            />
          </label>
          <div className="chips" role="group" aria-label="Filtrar por estado">
            {ESTADOS.map((e) => (
              <button key={e} className={`chip ${estado === e ? 'chip-active' : ''}`} onClick={() => setEstado(e)}>
                {e === 'Todos' ? e : `${e}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtrados.length ? (
        <div className="bond-grid">
          {filtrados.map((b) => <BondCard key={b.id} b={b} />)}
        </div>
      ) : (
        <div className="state-card state-card-soft">
          <Search size={24} />
          <p>No hay bonos que coincidan con tu búsqueda.</p>
        </div>
      )}
    </>
  );
}

function SummaryHero({ r }) {
  const total = r.cobrado + r.pendiente;
  return (
    <section className="hero-card">
      <div className="hero-main">
        <span className="hero-label">Total invertido</span>
        <strong className="hero-value">{money(r.total_invertido)}</strong>
        <span className="hero-sub">{r.bonos} {r.bonos === 1 ? 'bono' : 'bonos'} en cartera</span>
      </div>

      <div className="hero-stats">
        <div>
          <span className="hero-label">Cobrado a la fecha</span>
          <strong>{money(r.cobrado)}</strong>
        </div>
        <div>
          <span className="hero-label">Flujos pendientes</span>
          <strong>{money(r.pendiente)}</strong>
        </div>
        <div className="hero-progress">
          <Progress value={r.cobrado} max={total} label="Avance de cobros" />
          <span>{total ? Math.round((r.cobrado / total) * 100) : 0}% de los flujos ya cobrados</span>
        </div>
      </div>

      {r.proximo_pago_fecha && (
        <div className="hero-next">
          <CalendarClock size={22} />
          <div>
            <span className="hero-label">Próximo pago</span>
            <strong>{money(r.proximo_pago_monto)}</strong>
            <span className="hero-sub">{date(r.proximo_pago_fecha)} · {relativeDays(r.proximo_pago_fecha)}</span>
          </div>
        </div>
      )}
    </section>
  );
}

function BondCard({ b }) {
  const vencido = b.estado === 'Vencido';
  return (
    <Link to={`/bonos/${b.id}`} className={`bond-card ${vencido ? 'is-muted' : ''}`}>
      <div className="bond-card-head">
        <span className="serie-mark" aria-hidden>{b.serie}</span>
        <div className="bond-card-title">
          <span className="eyebrow">{b.sector}</span>
          <h3>{b.nombre}</h3>
          <span className="muted small">{b.emisor}</span>
        </div>
        <ArrowUpRight className="bond-card-arrow" size={20} />
      </div>

      <div className="badges">
        <Badge tone={vencido ? 'neutral' : 'success'}>{b.estado}</Badge>
        <Badge tone={riskTone(b.calificacion_riesgo)}>Riesgo {b.calificacion_riesgo}</Badge>
      </div>

      <dl className="bond-card-data">
        <div><dt>Invertido</dt><dd>{money(b.monto_invertido)}</dd></div>
        <div><dt>Interés fijo</dt><dd>{percent(b.tasa_anual)} anual</dd></div>
        <div><dt>Vencimiento</dt><dd>{date(b.fecha_vencimiento)}</dd></div>
        <div>
          <dt>Próximo pago</dt>
          <dd>{b.proximo_pago_fecha ? date(b.proximo_pago_fecha) : 'Completado'}</dd>
        </div>
      </dl>

      <div className="bond-card-foot">
        <Progress value={b.pagos_realizados} max={b.pagos_totales} label="Pagos realizados" />
        <span className="small muted">{b.pagos_realizados} de {b.pagos_totales} pagos recibidos</span>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="hero-card hero-skeleton"><Skeleton height={120} /></div>
      <div className="bond-grid">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bond-card">
            <Skeleton height={20} width="40%" />
            <Skeleton height={26} width="70%" />
            <Skeleton height={80} />
          </div>
        ))}
      </div>
    </>
  );
}
