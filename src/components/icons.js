import {
  createIcons,
  LayoutDashboard, Users, PawPrint, Stethoscope, ClipboardList, CalendarCheck,
  Wallet, ChartColumn, Menu, X, LogOut, ChevronDown, ShieldAlert, SearchX,
  Inbox, TriangleAlert, CircleCheck, CircleX, Info,
  Plus, UserPlus, Clock, CalendarDays, RefreshCw, Receipt,
  Search, Pencil, Archive, ArchiveRestore, Eye, ChevronLeft, ChevronRight,
  User,
} from 'lucide';

const icons = {
  LayoutDashboard, Users, PawPrint, Stethoscope, ClipboardList, CalendarCheck,
  Wallet, ChartColumn, Menu, X, LogOut, ChevronDown, ShieldAlert, SearchX,
  Inbox, TriangleAlert, CircleCheck, CircleX, Info,
  Plus, UserPlus, Clock, CalendarDays, RefreshCw, Receipt,
  Search, Pencil, Archive, ArchiveRestore, Eye, ChevronLeft, ChevronRight,
  User,
};

// Pakai di dalam template HTML: ${icon('users')}
export const icon = (name) => `<i data-lucide="${name}" class="ico" aria-hidden="true"></i>`;

// Panggil setelah HTML dimasukkan ke halaman, agar <i> berubah menjadi ikon.
export const renderIcons = () => createIcons({ icons, attrs: { 'stroke-width': 1.8 } });