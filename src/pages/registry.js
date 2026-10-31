import { ROLES } from '../utils/constants.js';
import { adminDashboard } from './dashboard/AdminDashboard.js';
import { staffDashboard } from './dashboard/StaffDashboard.js';
import { customerDashboard } from './dashboard/CustomerDashboard.js';
import { servicesPage } from './master/ServicesPage.js';
import { customersPage } from './master/CustomersPage.js';
import { petsPage } from './master/PetsPage.js';
import { staffAdminPage, staffDirectoryPage } from './master/StaffPages.js';
import { bookingsPage } from './booking/BookingsPage.js';
import { transactionsPage } from './transaction/TransactionsPage.js';
import { reportsPage } from './report/ReportsPage.js';
import { profilePage } from './profile/ProfilePage.js';

// Dashboard di halaman utama tiap role
export const HOME_PAGES = {
  [ROLES.ADMIN]: adminDashboard,
  [ROLES.STAFF]: staffDashboard,
  [ROLES.CUSTOMER]: customerDashboard,
};

// Halaman nyata. Path yang belum ada di sini otomatis menjadi placeholder.
export const PAGES = {
  '/admin/services': () => servicesPage('admin'),
  '/staff/services': () => servicesPage('staff'),
  '/customer/services': () => servicesPage('customer'),
  '/admin/customers': () => customersPage('admin'),
  '/staff/customers': () => customersPage('staff'),
  '/admin/pets': () => petsPage('admin'),
  '/staff/pets': () => petsPage('staff'),
  '/customer/pets': () => petsPage('customer'),
  '/admin/staff': () => staffAdminPage(),
  '/staff/directory': () => staffDirectoryPage(),
  '/admin/bookings': () => bookingsPage('admin'),
  '/staff/bookings': () => bookingsPage('staff'),
  '/customer/bookings': () => bookingsPage('customer'),
  '/admin/transactions': () => transactionsPage('admin'),
  '/staff/transactions': () => transactionsPage('staff'),
  '/customer/transactions': () => transactionsPage('customer'),
  '/admin/reports': () => reportsPage(),
  '/admin/profile': () => profilePage(),
  '/staff/profile': () => profilePage(),
  '/customer/profile': () => profilePage(),
};