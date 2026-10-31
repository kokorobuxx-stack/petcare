import { supabase } from './supabaseClient.js';
import { lastMonths } from '../utils/formatters.js';

export async function getMonthlyReport(n = 12) {
  const { data, error } = await supabase
    .from('v_monthly_revenue').select('month, revenue, transaction_count');
  if (error) throw error;

  const map = new Map(data.map((r) => [
    String(r.month).slice(0, 10),
    { revenue: Number(r.revenue) || 0, count: Number(r.transaction_count) || 0 },
  ]));
  const fmt = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return lastMonths(n).map((m) => ({
    key: m.key,
    short: m.label,
    long: fmt.format(new Date(m.key + 'T00:00:00Z')),
    ...(map.get(m.key) || { revenue: 0, count: 0 }),
  }));
}