import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarClock, CalendarRange, CircleDollarSign, Percent } from 'lucide-react';
import { api } from '../api';
import { useApi } from '../useApi';
import { date, money, percent, relativeDays, riskTone } from '../format';
import { Badge, ErrorState, Progress, Skeleton } from '../components/ui';

const FILTROS = ['Todos', 'Pendiente', 'Pagado'];

export default function BondDetail() {
  const { id } = useParams();
  const { data: b, error, loading, retry } = useApi(() => api.bono(id), [id]);

  return (
    <>
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Volver a mis bonos</Link>
      {loading && <DetailSkeleton />}
      {error && <ErrorState error={error} onRetry={error.status === 404 ? undefined : retry} />}
      {b && <DetailContent b={b} />}
    </>
  );
}

function DetailContent({ b }) {
  const pagados = b.pagos.filter((p) => p.estado === 'Pagado');
  const cobrado = pagados.reduce((s, p) => s + p.monto, 0);
  const pendiente = b.pagos.reduce((s, p) => s + p.monto, 0) - cobrado;
  const proximo = b.pagos.find((p) => p.estado === 'Pendiente');
  const proximoMonto = proximo ? b.pagos.filter((p) => p.fecha === proximo.fecha).reduce((s, p) => s + p.monto, 0) : 0;
  const vencido = b.estado === 'Vencido';

  const secciones = [
    {
      titulo: 'Condiciones', icon: Percent, filas: [
        ['Tipo de bono', b.tipo],
        ['Tipo de interés', b.tipo_interes],
        ['Tasa de interés fija', `${percent(b.tasa_anual)} anual`],
        ['Cupón trimestral', money(b.cupon_trimestral)],
        ['Cupón anual estimado', money(b.cupon_anual)],
        ['Frecuencia de pago', b.frecuencia_pago],
      ],
    },
    {
      titulo: 'Tu inversión', icon: CircleDollarSign, filas: [
        ['Monto invertido', money(b.monto_invertido)],
        ['Moneda', 'Dólares (USD)'],
        ['Fecha de compra', date(b.fecha_compra)],
      ],
    },
    {
      titulo: 'Fechas y plazo', icon: CalendarRange, filas: [
        ['Fecha de inicio (emisión)', date(b.fecha_emision)],
        ['Fecha de vencimiento', date(b.fecha_vencimiento)],
        ['Plazo', `${b.plazo_anios} años`],
      ],
    },
    {
      titulo: 'Emisor', icon: Building2, filas: [
        ['Razón social', b.emisor],
        ['Serie', b.numero_serie],
        ['Sector / destino', b.sector],
        ['Calificación de riesgo', b.calificacion_riesgo],
      ],
    },
  ];

  return (
    <>
      <header className="detail-head">
        <span className="serie-mark serie-mark-lg" aria-hidden>{b.serie}</span>
        <div>
          <span className="eyebrow">{b.sector}</span>
          <h1>{b.nombre}</h1>
          <p className="muted">{b.emisor} · <span className="mono">{b.numero_serie}</span></p>
        </div>
        <div className="badges detail-badges">
          <Badge tone={vencido ? 'neutral' : 'success'}>{b.estado}</Badge>
          <Badge tone={riskTone(b.calificacion_riesgo)}>Riesgo {b.calificacion_riesgo}</Badge>
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat">
          <span className="stat-label">Cobrado a la fecha</span>
          <strong>{money(cobrado)}</strong>
          <span className="small muted">{pagados.length} de {b.pagos.length} pagos</span>
        </div>
        <div className="stat">
          <span className="stat-label">Flujos pendientes</span>
          <strong>{money(pendiente)}</strong>
          <span className="small muted">Incluye la devolución del capital</span>
        </div>
        <div className="stat stat-accent">
          <span className="stat-label"><CalendarClock size={15} /> Próximo pago</span>
          {proximo ? (
            <>
              <strong>{money(proximoMonto)}</strong>
              <span className="small">{date(proximo.fecha)} · {relativeDays(proximo.fecha)}</span>
            </>
          ) : (
            <strong>Bono completado</strong>
          )}
        </div>
      </div>

      <div className="progress-row">
        <Progress value={pagados.length} max={b.pagos.length} label="Avance del bono" />
        <span className="small muted">{Math.round((pagados.length / b.pagos.length) * 100)}% del calendario cumplido</span>
      </div>

      <h2 className="section-title">Datos del bono</h2>
      <div className="info-grid">
        {secciones.map(({ titulo, icon: Icon, filas }) => (
          <section key={titulo} className="info-card">
            <h3><Icon size={16} /> {titulo}</h3>
            <dl>
              {filas.map(([k, v]) => (
                <div key={k} className="info-row"><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <Schedule pagos={b.pagos} proximaFecha={proximo?.fecha} />
    </>
  );
}

function Schedule({ pagos, proximaFecha }) {
  const [filtro, setFiltro] = useState(proximaFecha ? 'Pendiente' : 'Todos');

  const porAnio = useMemo(() => {
    const grupos = new Map();
    for (const p of pagos) {
      if (filtro !== 'Todos' && p.estado !== filtro) continue;
      const anio = p.fecha.slice(0, 4);
      if (!grupos.has(anio)) grupos.set(anio, []);
      grupos.get(anio).push(p);
    }
    return [...grupos];
  }, [pagos, filtro]);

  return (
    <section>
      <div className="section-head">
        <h2 className="section-title">Calendario de pagos</h2>
        <div className="chips" role="group" aria-label="Filtrar pagos">
          {FILTROS.map((f) => (
            <button key={f} className={`chip ${filtro === f ? 'chip-active' : ''}`} onClick={() => setFiltro(f)}>
              {f === 'Todos' ? f : `${f}s`}
              <span className="count">{f === 'Todos' ? pagos.length : pagos.filter((p) => p.estado === f).length}</span>
            </button>
          ))}
        </div>
      </div>

      {porAnio.length === 0 && (
        <div className="state-card state-card-soft"><p>No hay pagos en esta vista.</p></div>
      )}

      <div className="schedule">
        {porAnio.map(([anio, items]) => (
          <div key={anio} className="schedule-year">
            <div className="schedule-year-head">
              <span>{anio}</span>
              <span className="muted">{money(items.reduce((s, p) => s + p.monto, 0))}</span>
            </div>
            <ul>
              {items.map((p) => {
                const esProximo = p.fecha === proximaFecha;
                const amort = p.concepto === 'Amortización';
                return (
                  <li key={p.numero} className={`pay-row ${esProximo ? 'is-next' : ''} ${amort ? 'is-amort' : ''}`}>
                    <span className={`pay-dot ${p.estado === 'Pagado' ? 'done' : ''}`} aria-hidden />
                    <div className="pay-date">
                      <strong>{date(p.fecha)}</strong>
                      <span className="small muted">
                        {amort ? 'Devolución del capital' : `Cupón ${p.numero}`}
                        {esProximo && ' · próximo pago'}
                      </span>
                    </div>
                    <span className="pay-amount">{money(p.monto)}</span>
                    <Badge tone={p.estado === 'Pagado' ? 'success' : 'warning'}>{p.estado}</Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <>
      <Skeleton height={60} width="60%" />
      <div className="stat-grid" style={{ marginTop: 24 }}>
        {[0, 1, 2].map((i) => <div key={i} className="stat"><Skeleton height={50} /></div>)}
      </div>
      <Skeleton height={260} radius={16} />
    </>
  );
}
