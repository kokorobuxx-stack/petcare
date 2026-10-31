export const ROLES = Object.freeze({
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer',
});

export const ROLE_LABEL = {
  admin: 'Admin',
  staff: 'Petugas',
  customer: 'Pelanggan',
};

export function homePathFor(role) {
  if (role === ROLES.ADMIN) return '/admin';
  if (role === ROLES.STAFF) return '/staff';
  if (role === ROLES.CUSTOMER) return '/customer';
  return '/login';
}

// Menu sidebar per role. "icon" memakai nama ikon Lucide (huruf kecil dengan tanda hubung).
export const NAV_ITEMS = {
  admin: [
    { path: '/admin', label: 'Dashboard', icon: 'layout-dashboard' },
    { path: '/admin/customers', label: 'Pelanggan', icon: 'users' },
    { path: '/admin/pets', label: 'Hewan', icon: 'paw-print' },
    { path: '/admin/staff', label: 'Petugas', icon: 'stethoscope' },
    { path: '/admin/services', label: 'Layanan', icon: 'clipboard-list' },
    { path: '/admin/bookings', label: 'Booking', icon: 'calendar-check' },
    { path: '/admin/transactions', label: 'Transaksi', icon: 'wallet' },
    { path: '/admin/reports', label: 'Laporan', icon: 'chart-column' },
    { path: '/admin/profile', label: 'Profil', icon: 'user' },
  ],
  staff: [
    { path: '/staff', label: 'Dashboard', icon: 'layout-dashboard' },
    { path: '/staff/customers', label: 'Pelanggan', icon: 'users' },
    { path: '/staff/pets', label: 'Hewan', icon: 'paw-print' },
    { path: '/staff/services', label: 'Layanan', icon: 'clipboard-list' },
    { path: '/staff/bookings', label: 'Booking', icon: 'calendar-check' },
    { path: '/staff/transactions', label: 'Transaksi', icon: 'wallet' },
    { path: '/staff/directory', label: 'Direktori Petugas', icon: 'stethoscope' },
    { path: '/staff/profile', label: 'Profil', icon: 'user' },
  ],
  customer: [
    { path: '/customer', label: 'Dashboard', icon: 'layout-dashboard' },
    { path: '/customer/pets', label: 'Hewan Saya', icon: 'paw-print' },
    { path: '/customer/services', label: 'Layanan', icon: 'clipboard-list' },
    { path: '/customer/bookings', label: 'Booking Saya', icon: 'calendar-check' },
    { path: '/customer/transactions', label: 'Transaksi', icon: 'wallet' },
    { path: '/customer/profile', label: 'Profil', icon: 'user' },
  ],
};