import { supabase } from './supabaseClient.js';

async function call(body) {
  const { data, error } = await supabase.functions.invoke('staff-admin', {
    body: { ...body, redirect_to: window.location.origin },
  });
  if (error) {
    console.error(error);
    throw Object.assign(
      new Error('Layanan undangan tidak dapat dihubungi. Pastikan Edge Function sudah di-deploy.'),
      { code: 'P0001' }
    );
  }
  if (!data?.ok) {
    throw Object.assign(new Error(data?.error || 'Permintaan gagal.'), { code: 'P0001' });
  }
  return data;
}

export const inviteStaff = (v) => call({ action: 'invite', ...v });
export const resendInvite = (staffId) => call({ action: 'resend', staff_id: staffId });
export const cancelInvite = (staffId) => call({ action: 'cancel_invite', staff_id: staffId });

export async function getPendingInvites(profileIds) {
  if (!profileIds.length) return [];
  const data = await call({ action: 'pending', profile_ids: profileIds });
  return data.pending || [];
}