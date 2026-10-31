import { supabase } from './supabaseClient.js';
import { cleanSearch, rangeOf, mutate } from '../utils/query.js';

const COLS = 'id, name, category, description, price, duration_minutes, is_active, deleted_at, created_at';

export async function listServices({ page, pageSize, search, filters }) {
  let q = supabase.from('services').select(COLS, { count: 'exact' });
  q = filters.archive === 'only' ? q.not('deleted_at', 'is', null) : q.is('deleted_at', null);
  if (filters.category) q = q.eq('category', filters.category);
  if (filters.status === 'active') q = q.eq('is_active', true);
  if (filters.status === 'inactive') q = q.eq('is_active', false);
  const s = cleanSearch(search);
  if (s) q = q.ilike('name', `%${s}%`);
  const [from, to] = rangeOf(page, pageSize);
  const { data, error, count } = await q.order('name').range(from, to);
  if (error) throw error;
  return { rows: data, count: count || 0 };
}

export async function createService(v) {
  const { error } = await supabase.from('services').insert({
    name: v.name, category: v.category, description: v.description,
    price: v.price, duration_minutes: v.duration_minutes, is_active: v.is_active,
  });
  if (error) throw error;
}

export const updateService = (id, v) =>
  mutate(supabase.from('services').update({
    name: v.name, category: v.category, description: v.description,
    price: v.price, duration_minutes: v.duration_minutes, is_active: v.is_active,
  }).eq('id', id));

export const archiveService = (id) =>
  mutate(supabase.from('services').update({ deleted_at: new Date().toISOString() }).eq('id', id));

export const restoreService = (id) =>
  mutate(supabase.from('services').update({ deleted_at: null }).eq('id', id));