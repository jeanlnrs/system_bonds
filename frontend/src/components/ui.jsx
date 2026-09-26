import { AlertCircle, RotateCcw } from 'lucide-react';

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Progress({ value, max, label }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="progress-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%', radius = 8 }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius }} />;
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state-card" role="alert">
      <AlertCircle size={28} />
      <h3>No pudimos cargar la información</h3>
      <p>{error?.message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          <RotateCcw size={16} /> Reintentar
        </button>
      )}
    </div>
  );
}
