'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  ClipboardList,
  Search,
  Filter,
  Calendar,
  User,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  LogIn,
  Plus,
  Edit2,
  X,
  Upload,
  Download,
  Archive,
  Award,
  BookOpen,
  Settings,
  Shield,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface ActivityLog {
  id: string;
  userId: string | null;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  metadata: any;
  ipAddress: string | null;
  createdAt: string;
}

interface Meta {
  actions: string[];
  users: { userId: string; userName: string; userRole: string }[];
}

interface PaginatedResponse {
  logs: ActivityLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  todayCount: number;
}

// Konfigurasi tampilan per jenis aksi
const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  LOGIN:                   { label: 'Login',              color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',  icon: LogIn },
  CREATE_STUDENT:          { label: 'Tambah Siswa',       color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', icon: Plus },
  UPDATE_STUDENT:          { label: 'Edit Siswa',         color: 'bg-amber-500/15 text-amber-300 border-amber-500/25',    icon: Edit2 },
  DELETE_STUDENT:          { label: 'Hapus Siswa',        color: 'bg-rose-500/15 text-rose-300 border-rose-500/25',       icon: X },
  IMPORT_STUDENTS:         { label: 'Import Siswa',       color: 'bg-purple-500/15 text-purple-300 border-purple-500/25', icon: Upload },
  ARCHIVE_STUDENTS:        { label: 'Arsip Alumni',       color: 'bg-pink-500/15 text-pink-300 border-pink-500/25',       icon: Archive },
  UPDATE_GRADUATION:       { label: 'Status Kelulusan',   color: 'bg-teal-500/15 text-teal-300 border-teal-500/25',       icon: Award },
  BATCH_UPDATE_GRADUATION: { label: 'Batch Kelulusan',    color: 'bg-teal-500/15 text-teal-300 border-teal-500/25',       icon: Award },
  ASSIGN_SKL_NUMBERS:      { label: 'Assign SKL',         color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',       icon: Award },
  SAVE_REPORT_GRADES:      { label: 'Simpan Rapor',       color: 'bg-blue-500/15 text-blue-300 border-blue-500/25',       icon: BookOpen },
  SAVE_EXAM_GRADES:        { label: 'Simpan Ujian',       color: 'bg-blue-500/15 text-blue-300 border-blue-500/25',       icon: BookOpen },
  IMPORT_REPORT_GRADES:    { label: 'Import Rapor',       color: 'bg-purple-500/15 text-purple-300 border-purple-500/25', icon: Upload },
  IMPORT_EXAM_GRADES:      { label: 'Import Ujian',       color: 'bg-purple-500/15 text-purple-300 border-purple-500/25', icon: Upload },
  UPDATE_SCHOOL_PROFILE:   { label: 'Profil Madrasah',    color: 'bg-orange-500/15 text-orange-300 border-orange-500/25', icon: Settings },
  UPDATE_GRADE_WEIGHT:     { label: 'Bobot Nilai',        color: 'bg-orange-500/15 text-orange-300 border-orange-500/25', icon: Settings },
  CREATE_ACADEMIC_YEAR:    { label: 'Buat Tahun Ajaran',  color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', icon: Calendar },
  ACTIVATE_ACADEMIC_YEAR:  { label: 'Aktifkan TP',        color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', icon: Calendar },
  DELETE_ACADEMIC_YEAR:    { label: 'Hapus Tahun Ajaran', color: 'bg-rose-500/15 text-rose-300 border-rose-500/25',       icon: X },
  CREATE_USER:             { label: 'Tambah Pengguna',    color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', icon: Shield },
  UPDATE_USER:             { label: 'Edit Pengguna',      color: 'bg-amber-500/15 text-amber-300 border-amber-500/25',    icon: Shield },
  DELETE_USER:             { label: 'Hapus Pengguna',     color: 'bg-rose-500/15 text-rose-300 border-rose-500/25',       icon: Shield },
  EXPORT_BACKUP:           { label: 'Export Backup',      color: 'bg-violet-500/15 text-violet-300 border-violet-500/25', icon: Download },
  IMPORT_BACKUP:           { label: 'Restore Backup',     color: 'bg-violet-500/15 text-violet-300 border-violet-500/25', icon: Upload },
};

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  GURU:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  STAFF: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action];
  const Icon = cfg?.icon ?? ClipboardList;
  const label = cfg?.label ?? action;
  const color = cfg?.color ?? 'bg-slate-500/15 text-slate-300 border-slate-500/25';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${color} whitespace-nowrap`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function ActivityLogsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Query params builder
  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('limit', '50');
    if (search) p.set('search', search);
    if (filterAction) p.set('action', filterAction);
    if (filterUserId) p.set('userId', filterUserId);
    if (filterStart) p.set('startDate', filterStart);
    if (filterEnd) p.set('endDate', filterEnd);
    return p.toString();
  }, [page, search, filterAction, filterUserId, filterStart, filterEnd]);

  const { data, isLoading, isError, refetch } = useQuery<PaginatedResponse>({
    queryKey: ['activity-logs', queryParams],
    queryFn: async () => {
      const res = await api.get(`/activity-logs?${queryParams}`);
      return res.data;
    },
    staleTime: 30000,
  });

  const { data: meta } = useQuery<Meta>({
    queryKey: ['activity-logs-meta'],
    queryFn: async () => {
      const res = await api.get('/activity-logs/meta');
      return res.data;
    },
    staleTime: 60000,
  });

  const clearMutation = useMutation({
    mutationFn: () => api.delete('/activity-logs/old?days=90'),
    onSuccess: (res) => {
      showToast(res.data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      setShowClearConfirm(false);
    },
    onError: () => {
      showToast('Gagal membersihkan log lama.', 'error');
    },
  });

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch(''); setFilterAction(''); setFilterUserId('');
    setFilterStart(''); setFilterEnd(''); setPage(1);
  };

  const hasFilters = search || filterAction || filterUserId || filterStart || filterEnd;
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">Riwayat Aktivitas</h2>
          <p className="text-xs text-slate-500 mt-1">Catatan lengkap semua aksi yang dilakukan pengguna di sistem.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {data?.todayCount !== undefined && (
            <div className="px-4 py-2 rounded-xl bg-indigo-950/40 border border-indigo-900/50 text-xs font-semibold text-indigo-300">
              {data.todayCount} aktivitas hari ini
            </div>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-950/30 border border-rose-900/40 text-xs font-semibold text-rose-400 hover:bg-rose-950/50 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Bersihkan Log Lama
          </button>
        </div>
      </div>

      {/* Confirm Dialog */}
      {showClearConfirm && (
        <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-300">Konfirmasi Hapus Log Lama</p>
            <p className="text-xs text-slate-400 mt-1">Semua log aktivitas yang lebih dari <strong>90 hari</strong> akan dihapus permanen. Aksi ini tidak dapat dibatalkan.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
            >
              Batal
            </button>
            <button
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              className="px-4 py-2 text-xs rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all font-semibold disabled:opacity-50"
            >
              {clearMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={handleFilterChange(setSearch)}
              placeholder="Cari deskripsi aktivitas..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Action Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <select
              value={filterAction}
              onChange={handleFilterChange(setFilterAction)}
              className="pl-9 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">Semua Aksi</option>
              {(meta?.actions ?? []).map((a) => (
                <option key={a} value={a}>{ACTION_CONFIG[a]?.label ?? a}</option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <select
              value={filterUserId}
              onChange={handleFilterChange(setFilterUserId)}
              className="pl-9 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">Semua Pengguna</option>
              {(meta?.users ?? []).map((u) => (
                <option key={u.userId} value={u.userId ?? ''}>{u.userName} ({u.userRole})</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                type="date"
                value={filterStart}
                onChange={handleFilterChange(setFilterStart)}
                className="pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
              />
            </div>
            <span className="text-slate-600 text-xs">s/d</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                type="date"
                value={filterEnd}
                onChange={handleFilterChange(setFilterEnd)}
                className="pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
              />
            </div>
          </div>

          {/* Reset */}
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2.5 text-xs text-slate-400 hover:text-rose-400 bg-slate-800/60 hover:bg-rose-950/30 border border-slate-700/60 hover:border-rose-900/40 rounded-xl transition-all flex items-center gap-1.5"
            >
              <X className="w-3 h-3" /> Reset
            </button>
          )}

          <div className="ml-auto text-[10px] text-slate-500 font-semibold whitespace-nowrap">
            {pagination ? `${pagination.total.toLocaleString('id-ID')} log ditemukan` : ''}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-xl overflow-hidden">
        {isLoading && (
          <div className="py-24 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Memuat log aktivitas...
          </div>
        )}

        {isError && (
          <div className="py-16 text-center text-rose-400 text-xs border border-dashed border-rose-900/50 rounded-xl bg-rose-950/20 mx-6 my-6">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-60" />
            Gagal memuat data aktivitas.
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            {data.logs.length === 0 ? (
              <div className="py-20 text-center">
                <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-sm font-semibold text-slate-400">Belum Ada Log Aktivitas</p>
                <p className="text-xs text-slate-600 mt-2">
                  {hasFilters ? 'Tidak ada log yang sesuai dengan filter.' : 'Log akan muncul setelah ada aktivitas pengguna.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">Pengguna</th>
                      <th className="py-3 px-4">Aksi</th>
                      <th className="py-3 px-4">Deskripsi</th>
                      <th className="py-3 px-4">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {data.logs.map((log, idx) => (
                      <tr
                        key={log.id}
                        className={`transition-colors hover:bg-slate-900/30 ${idx % 2 === 0 ? '' : 'bg-slate-900/10'}`}
                      >
                        {/* Waktu */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-450 font-mono text-[11px]">
                          {formatTime(log.createdAt)}
                        </td>

                        {/* Pengguna */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-slate-200">{log.userName}</span>
                            <span className={`self-start inline-block px-2 py-0.5 rounded-full border text-[9px] font-bold ${ROLE_BADGE[log.userRole] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                              {log.userRole}
                            </span>
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4">
                          <ActionBadge action={log.action} />
                        </td>

                        {/* Deskripsi */}
                        <td className="py-3 px-4 text-slate-300 max-w-xs">
                          <span className="line-clamp-2">{log.description}</span>
                        </td>

                        {/* IP */}
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-600 whitespace-nowrap">
                          {log.ipAddress ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800/60 bg-slate-900/30">
                <p className="text-[11px] text-slate-500">
                  Halaman <span className="font-bold text-slate-300">{pagination.page}</span> dari{' '}
                  <span className="font-bold text-slate-300">{pagination.totalPages}</span>
                  {' '}({pagination.total.toLocaleString('id-ID')} total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let p: number;
                    if (pagination.totalPages <= 5) {
                      p = i + 1;
                    } else if (pagination.page <= 3) {
                      p = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      p = pagination.totalPages - 4 + i;
                    } else {
                      p = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          p === pagination.page
                            ? 'bg-indigo-600 text-white border border-indigo-500'
                            : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
