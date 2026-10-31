// Membersihkan teks pencarian agar tidak merusak filter PostgREST.
export const cleanSearch = (s) => (s || '').replace(/[%,()*\\]/g, ' ').trim();

export const rangeOf = (page, size) => [(page - 1) * size, (page - 1) * size + size - 1];

// Menjalankan update/arsip dan memastikan ada baris yang benar-benar berubah.
// (Update yang ditolak RLS tidak error, hanya mengubah 0 baris.)
export async function mutate(query) {
  const { data, error } = await query.select('id');
  if (error) throw error;
  if (!data || !data.length) {
    throw Object.assign(
      new Error('Perubahan tidak tersimpan. Data tidak ditemukan atau Anda tidak berhak mengubahnya.'),
      { code: 'P0001' }
    );
  }
}