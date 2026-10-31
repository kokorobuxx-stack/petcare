import { supabase } from './supabaseClient.js';
import { todayRangeJakarta, lastMonths } from '../utils/formatters.js';

const BOOKING_SELECT =
  'id, booking_code, scheduled_at, status, staff_id, customers(full_name), pets(name), booking_items(service_name)';
const TX_SELECT =
  'id, transaction_code, total_amount, payment_status, payment_method, created_at, bookings(booking_code, customers(full_name))';

async function run(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

const bookings = () => supabase.from('bookings').select(BOOKING_SELECT).is('deleted_at', null);

export async function getStats() {
  const d = await run(supabase.from('v_dashboard_stats').select('*').single());
  return {
    customers: Number(d.total_customers) || 0,
    pets: Number(d.total_pets) || 0,
    staff: Number(d.total_staff) || 0,
    bookings: Number(d.total_bookings) || 0,
    revenue: Number(d.total_revenue) || 0,
  };
}

export async function getStatusSummary() {
  const rows = await run(supabase.from('v_booking_status_summary').select('status, total'));
  const out = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  rows.forEach((r) => { out[r.status] = Number(r.total) || 0; });
  return out;
}

// Hanya Admin yang mendapat baris (dijaga di view). 6 bulan terakhir, bulan kosong = 0.
export async function getMonthlyRevenue() {
  const rows = await run(supabase.from('v_monthly_revenue').select('month, revenue'));
  const map = new Map(rows.map((r) => [String(r.month).slice(0, 10), Number(r.revenue) || 0]));
  const months = lastMonths(6);
  return { labels: months.map((m) => m.label), values: months.map((m) => map.get(m.key) || 0) };
}

export const getRecentBookings = (limit = 5) =>
  run(bookings().order('created_at', { ascending: false }).limit(limit));

export function getTodayBookings() {
  const { start, end } = todayRangeJakarta();
  return run(bookings().gte('scheduled_at', start).lt('scheduled_at', end)
    .order('scheduled_at', { ascending: true }).limit(50));
}

export const getPendingBookings = (limit = 5) =>
  run(bookings().eq('status', 'pending').order('scheduled_at', { ascending: true }).limit(limit));

export const getUpcomingBookings = (limit = 20) =>
  run(bookings().in('status', ['pending', 'confirmed']).gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true }).limit(limit));

export const getRecentTransactions = (limit = 5) =>
  run(supabase.from('transactions').select(TX_SELECT).is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(limit));

export async function countUnpaid() {
  const { count, error } = await supabase.from('transactions')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null).eq('payment_status', 'belum_bayar');
  if (error) throw error;
  return count || 0;
}