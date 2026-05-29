'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileSpreadsheet,
  Settings,
  LogOut,
  Menu,
  X,
  School,
  ChevronRight,
  BookOpen,
  BookMarked,
  AlertTriangle,
  Award,
  Calendar,
  Shield,
  ClipboardList,
  Building2,
  DatabaseBackup,
} from 'lucide-react';
// Import removed
import SyncDatabase from '@/components/SyncDatabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium tracking-wide">Memuat Sesi...</p>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'GURU', 'STAFF'] },
    { name: 'Manajemen Lembaga', href: '/dashboard/tenants', icon: Building2, roles: ['SUPER_ADMIN'] },
    { name: 'Profil Madrasah', href: '/dashboard/school', icon: School, roles: ['ADMIN'] },
    { name: 'Tahun Ajaran', href: '/dashboard/academic-years', icon: Calendar, roles: ['SUPER_ADMIN'] },
    { name: 'Manajemen Akses', href: '/dashboard/users', icon: Shield, roles: ['ADMIN'] },
    { name: 'Data Siswa', href: '/dashboard/students', icon: Users, roles: ['ADMIN', 'GURU', 'STAFF'] },
    { name: 'Data Alumni', href: '/dashboard/alumni', icon: GraduationCap, roles: ['ADMIN', 'GURU', 'STAFF'] },
    { name: 'Mata Pelajaran', href: '/dashboard/subjects', icon: BookMarked, roles: ['SUPER_ADMIN'] },
    { name: 'Input Nilai Rapor', href: '/dashboard/grades/reports', icon: BookOpen, roles: ['ADMIN', 'GURU', 'STAFF'] },
    { name: 'Input Nilai Ujian', href: '/dashboard/grades/exams', icon: FileSpreadsheet, roles: ['ADMIN', 'GURU', 'STAFF'] },
    { name: 'Input Nilai TKA', href: '/dashboard/grades/tka', icon: FileSpreadsheet, roles: ['ADMIN', 'GURU', 'STAFF'] },
    { name: 'Rekap Nilai Akhir', href: '/dashboard/grades/recap', icon: FileSpreadsheet, roles: ['ADMIN', 'GURU', 'STAFF'] },
    { name: 'Summary TKA & UM', href: '/dashboard/grades/summary', icon: FileSpreadsheet, roles: ['ADMIN', 'GURU', 'STAFF'] },
    { name: 'Nilai Belum Masuk', href: '/dashboard/grades/missing', icon: AlertTriangle, roles: ['ADMIN', 'GURU', 'STAFF'] },
    { name: 'Kelulusan Siswa', href: '/dashboard/students/graduation', icon: Award, roles: ['ADMIN', 'STAFF'] },
    { name: 'Pengaturan Bobot', href: '/dashboard/settings', icon: Settings, roles: ['ADMIN'] },
    { name: 'Backup & Restore', href: '/dashboard/backup', icon: DatabaseBackup, roles: ['SUPER_ADMIN'] },
    { name: 'Riwayat Aktivitas', href: '/dashboard/activity-logs', icon: ClipboardList, roles: ['ADMIN'] },
  ];

  const filteredNav = navigation.filter(item => item.roles.includes(user?.role || ''));

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'GURU': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'STAFF': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="h-screen flex bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-72 flex-col 
        border-r border-slate-800/60 bg-slate-900/40 backdrop-blur-md
        transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header/Logo section */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800/60 bg-slate-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-none">SIPANMU</h1>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">{user?.tenantName || 'Memuat Lembaga...'}</span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-850 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 group
                  ${isActive 
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-600/5' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-indigo-400/80" />}
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/20">
          <div className="flex items-center gap-3.5 px-3 py-3 rounded-xl bg-slate-900/40 border border-slate-800/40 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user?.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate leading-tight">{user?.name}</p>
              <span className={`inline-block px-2 py-0.5 mt-1 text-[9px] font-bold rounded-full border ${getRoleBadgeColor(user?.role || '')}`}>
                {user?.role}
              </span>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center gap-3.5 px-4 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5 text-rose-400" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/60 bg-slate-900/20 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800 bg-slate-900/40"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-slate-550 font-semibold tracking-wider uppercase">Tahun Pelajaran</p>
              <p className="text-xs font-bold text-indigo-400">AKTIF TAHUN INI</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest block">User Aktif</span>
              <span className="text-xs font-bold text-slate-350">{user?.name}</span>
            </div>
            <SyncDatabase />
            {/* Tenant selector removed */}
            <div className="w-8.5 h-8.5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-400 border border-slate-700">
              {user?.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-auto p-6 md:p-8 bg-slate-950/40 relative">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
          
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
