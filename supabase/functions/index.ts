import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const JOBS = ['dokter_hewan', 'paramedis', 'groomer', 'resepsionis', 'lainnya'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^08\d{8,11}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OPTS = { auth: { persistSession: false, autoRefreshToken: false } };

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { ...CORS, 'Content-Type': 'application/json' } });
const fail = (message: string) => json({ ok: false, error: message });

function safeRedirect(v: unknown) {
  try {
    const u = new URL(String(v || ''));
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.origin : undefined;
  } catch {
    return undefined;
  }
}

async function sendLink(url: string, anon: string, email: string, redirectTo?: string) {
  const mailer = createClient(url, anon, OPTS);
  const { error } = await mailer.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
  return error;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return fail('Metode tidak didukung.');

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !anon || !service) return fail('Konfigurasi server belum lengkap.');

    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return fail('Sesi tidak valid. Silakan masuk kembali.');

    const admin = createClient(url, service, OPTS);
    const { data: u, error: ue } = await admin.auth.getUser(token);
    if (ue || !u?.user) return fail('Sesi tidak valid. Silakan masuk kembali.');

    const { data: prof } = await admin.from('profiles').select('role, is_active').eq('id', u.user.id).maybeSingle();
    if (!prof || prof.role !== 'admin' || !prof.is_active) return fail('Hanya admin yang boleh melakukan aksi ini.');

    let body: any;
    try { body = await req.json(); } catch { return fail('Permintaan tidak valid.'); }
    const action = String(body?.action || '');

    // ---- Undang petugas baru ----
    if (action === 'invite') {
      const fullName = String(body.full_name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const phone = String(body.phone || '').replace(/[\s\-().]/g, '');
      const job = String(body.job_title || '');
      const spec = String(body.specialization || '').trim();
      if (fullName.length < 2 || fullName.length > 100) return fail('Nama harus 2–100 karakter.');
      if (!EMAIL_RE.test(email)) return fail('Format email tidak valid.');
      if (!PHONE_RE.test(phone)) return fail('Gunakan nomor ponsel Indonesia, contoh 081234567890.');
      if (!JOBS.includes(job)) return fail('Jabatan tidak valid.');
      if (spec.length > 100) return fail('Spesialisasi maksimal 100 karakter.');

      const { error: ce } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName, phone },
        app_metadata: {
          provisioned_role: 'staff',
          provisioned_job_title: job,
          provisioned_specialization: spec,
        },
      });
      if (ce) {
        console.error(ce);
        if (/already|registered|exists/i.test(ce.message)) return fail('Email ini sudah terdaftar.');
        return fail('Gagal membuat akun petugas. Periksa data yang diisi lalu coba lagi.');
      }
      const mailErr = await sendLink(url, anon, email, safeRedirect(body.redirect_to));
      if (mailErr) {
        console.error(mailErr);
        return json({ ok: true, warning: 'Akun dibuat, tetapi email gagal dikirim. Gunakan "Kirim ulang undangan" beberapa saat lagi.' });
      }
      return json({ ok: true });
    }

    // ---- Kirim ulang undangan ----
    if (action === 'resend') {
      const staffId = String(body.staff_id || '');
      if (!UUID_RE.test(staffId)) return fail('Data petugas tidak valid.');
      const { data: st } = await admin.from('staff').select('profile_id').eq('id', staffId).maybeSingle();
      if (!st) return fail('Petugas tidak ditemukan.');
      const { data: au } = await admin.auth.admin.getUserById(st.profile_id);
      if (!au?.user?.email) return fail('Akun petugas tidak ditemukan.');
      if (au.user.last_sign_in_at) return fail('Petugas sudah pernah login. Minta petugas memakai "Lupa password".');
      const mailErr = await sendLink(url, anon, au.user.email, safeRedirect(body.redirect_to));
      if (mailErr) {
        console.error(mailErr);
        return fail('Email gagal dikirim. Tunggu beberapa saat lalu coba lagi.');
      }
      return json({ ok: true });
    }

    // ---- Batalkan undangan (hanya yang belum pernah login dan belum punya riwayat) ----
    if (action === 'cancel_invite') {
      const staffId = String(body.staff_id || '');
      if (!UUID_RE.test(staffId)) return fail('Data petugas tidak valid.');
      const { data: profileId, error: re } = await admin.rpc('rpc_cancel_staff_invite', { p_staff_id: staffId });
      if (re) {
        console.error(re);
        return fail(re.message || 'Undangan tidak dapat dibatalkan.');
      }
      const { error: de } = await admin.auth.admin.deleteUser(String(profileId));
      if (de) {
        console.error(de);
        return fail('Data petugas sudah dihapus, tetapi akun login gagal dihapus. Hubungi pengembang.');
      }
      return json({ ok: true });
    }

    // ---- Daftar profile_id yang belum pernah login ----
    if (action === 'pending') {
      const ids: string[] = (Array.isArray(body.profile_ids) ? body.profile_ids : [])
        .map(String).filter((x: string) => UUID_RE.test(x)).slice(0, 50);
      const out = await Promise.all(ids.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        return data?.user && !data.user.last_sign_in_at ? id : null;
      }));
      return json({ ok: true, pending: out.filter(Boolean) });
    }

    return fail('Aksi tidak dikenal.');
  } catch (e) {
    console.error(e);
    return fail('Terjadi kesalahan di server.');
  }
});