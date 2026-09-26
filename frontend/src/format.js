const SIMBOLOS = { USD: 'US$', PEN: 'S/' };

const numero = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function money(value, moneda) {
  return `${SIMBOLOS[moneda] ?? moneda} ${numero.format(value ?? 0)}`;
}

export const MONEDAS = { USD: 'Dólares', PEN: 'Soles' };

// Las fechas llegan como 'YYYY-MM-DD'; se interpretan en hora local para no desplazar el día
function parse(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const fechaLarga = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
const fechaMes = new Intl.DateTimeFormat('es-PE', { month: 'long' });

export function date(iso) {
  return iso ? fechaLarga.format(parse(iso)).replace('.', '') : '—';
}

export function monthName(iso) {
  return fechaMes.format(parse(iso));
}

export function daysUntil(iso) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parse(iso) - today) / 86_400_000);
}

export function relativeDays(iso) {
  const d = daysUntil(iso);
  if (d === 0) return 'hoy';
  if (d === 1) return 'mañana';
  if (d > 0) return `en ${d} días`;
  return `hace ${-d} días`;
}

export function riskTone(calificacion) {
  if (calificacion.startsWith('AA') || calificacion === 'A+') return 'success';
  if (calificacion.startsWith('A')) return 'info';
  return 'warning';
}

export function percent(value) {
  return `${numero.format(value)}%`;
}
