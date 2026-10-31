const TZ = 'Asia/Jakarta';

export const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n) || 0);

export const formatDate = (v) =>
  v ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: TZ }).format(new Date(v)) : '-';

export const formatDateTime = (v) =>
  v ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ }).format(new Date(v)) : '-';

// Tanggal hari ini di Jakarta, format YYYY-MM-DD
const jakartaYmd = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

// Awal dan akhir hari ini (zona Jakarta, UTC+7 tanpa DST) dalam format ISO untuk query.
export function todayRangeJakarta() {
  const start = new Date(`${jakartaYmd()}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 86400000);
  return { start: start.toISOString(), end: end.toISOString() };
}

// n bulan terakhir (termasuk bulan ini): [{ key: '2026-10-01', label: 'Okt 26' }, ...]
export function lastMonths(n = 6) {
  const [y, m] = jakartaYmd().split('-').map(Number);
  const fmt = new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push({ key: d.toISOString().slice(0, 7) + '-01', label: fmt.format(d) });
  }
  return out;
}