'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Settings,
  Save,
  AlertCircle,
  CheckCircle2,
  Download,
  Upload,
  Database,
  ShieldAlert,
  X,
  Clock,
  FileJson,
  RefreshCcw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RestoreResult {
  message: string;
  restoredAt: string;
  backupCreatedAt: string;
  restored: {
    users: number;
    schoolProfiles: number;
    academicYears: number;
    subjects: number;
    gradeWeights: number;
    students: number;
    reportGrades: number;
    examGrades: number;
  };
}

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Grade Weight State ──
  const [reportPercentage, setReportPercentage] = useState<number>(60);
  const [examPercentage, setExamPercentage] = useState<number>(40);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [weightSuccess, setWeightSuccess] = useState(false);

  // ── Backup / Restore State ──
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [restoreResultOpen, setRestoreResultOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Redirect if not ADMIN
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Load last backup time from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sipanmu_last_backup');
    if (stored) setLastBackupTime(stored);
  }, []);

  // Fetch Weight Settings
  const { data, isLoading } = useQuery({
    queryKey: ['weight'],
    queryFn: async () => {
      const res = await api.get('/grades/weight');
      return res.data;
    },
  });

  useEffect(() => {
    if (data?.weight) {
      setReportPercentage(data.weight.reportPercentage);
      setExamPercentage(data.weight.examPercentage);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.put('/grades/weight', payload);
    },
    onSuccess: () => {
      setWeightSuccess(true);
      setWeightError(null);
      queryClient.invalidateQueries({ queryKey: ['weight'] });
      queryClient.invalidateQueries({ queryKey: ['recap'] });
      setTimeout(() => setWeightSuccess(false), 3000);
    },
    onError: (err: any) => {
      setWeightSuccess(false);
      setWeightError(err.response?.data?.message || 'Gagal menyimpan konfigurasi bobot.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWeightError(null);
    setWeightSuccess(false);
    if (reportPercentage + examPercentage !== 100) {
      setWeightError('Total pembobotan harus sama dengan 100%!');
      return;
    }
    updateMutation.mutate({ reportPercentage, examPercentage });
  };

  // ── Backup Handlers ──
  const handleDownloadBackup = async () => {
    try {
      setIsDownloadingBackup(true);
      const response = await api.get('/backup/export', { responseType: 'blob' });

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
      const fileName = `backup_sipanmu_${ts}.json`;

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      const timeStr = now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
      localStorage.setItem('sipanmu_last_backup', timeStr);
      setLastBackupTime(timeStr);
      showToast('Backup database berhasil diunduh!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Gagal mengunduh backup.', 'error');
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setConfirmText('');
    setConfirmOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRestoreConfirm = async () => {
    if (!pendingFile) return;
    setConfirmOpen(false);
    setConfirmText('');

    const formData = new FormData();
    formData.append('file', pendingFile);
    setPendingFile(null);

    try {
      setIsRestoring(true);
      const res = await api.post('/backup/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRestoreResult(res.data);
      setRestoreResultOpen(true);
      queryClient.clear();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Gagal melakukan restore database. Periksa file backup Anda.';
      showToast(msg, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  if (user?.role !== 'ADMIN') return null;

  const CONFIRM_KEYWORD = 'HAPUS';

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-wide">Pengaturan Sistem</h2>
        <p className="text-xs text-slate-450 mt-1">
          Konfigurasi pembobotan nilai akhir dan manajemen backup database.
        </p>
      </div>

      {/* ── Grade Weight Card ── */}
      <div className="max-w-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-7 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3.5 mb-6 border-b border-slate-800/60 pb-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200">Bobot Persentase Nilai Akhir</h3>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Memuat pengaturan bobot...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {weightSuccess && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-450">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Konfigurasi pembobotan berhasil diperbarui.</span>
              </div>
            )}
            {weightError && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{weightError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Persentase Nilai Rapor (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={reportPercentage}
                    onChange={(e) => setReportPercentage(Number(e.target.value))}
                    className="block w-32 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  <span className="text-slate-500 text-xs font-medium">Bobot rata-rata nilai rapor (Sem 7–11)</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Persentase Nilai Ujian (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={examPercentage}
                    onChange={(e) => setExamPercentage(Number(e.target.value))}
                    className="block w-32 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  <span className="text-slate-500 text-xs font-medium">Bobot nilai ujian madrasah</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/60 mt-6 flex justify-between items-center">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">
                Total:{' '}
                <span
                  className={
                    reportPercentage + examPercentage === 100
                      ? 'text-emerald-400 font-bold'
                      : 'text-rose-400 font-bold'
                  }
                >
                  {reportPercentage + examPercentage}%
                </span>
              </div>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/10 flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Backup & Restore Card ── */}
      <div className="max-w-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-7 backdrop-blur-md shadow-xl space-y-6">
        <div className="flex items-center gap-3.5 border-b border-slate-800/60 pb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-200">Backup &amp; Restore Database</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Ekspor semua data ke file JSON atau pulihkan dari backup sebelumnya.
            </p>
          </div>
        </div>

        {/* Info box */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 space-y-1.5">
          <p className="font-semibold text-slate-300 flex items-center gap-1.5">
            <FileJson className="w-3.5 h-3.5 text-amber-400" /> Yang tercakup dalam backup:
          </p>
          <ul className="space-y-1 pl-5 list-disc text-slate-500">
            <li>Data pengguna (user &amp; password terenkripsi)</li>
            <li>Profil madrasah &amp; tahun ajaran</li>
            <li>Semua mata pelajaran &amp; konfigurasi bobot</li>
            <li>Data siswa (NIS, NISN, nama, dll.)</li>
            <li>Semua nilai rapor (Smt 7–11) &amp; nilai ujian</li>
          </ul>
        </div>

        {/* Download Backup */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-300">Unduh Backup</p>
            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {lastBackupTime ? `Terakhir: ${lastBackupTime}` : 'Belum pernah backup'}
            </p>
          </div>
          <button
            onClick={handleDownloadBackup}
            disabled={isDownloadingBackup}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40 text-amber-400 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            {isDownloadingBackup ? (
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isDownloadingBackup ? 'Menyiapkan...' : 'Unduh Backup (.json)'}
          </button>
        </div>

        <div className="border-t border-slate-800/60" />

        {/* Restore */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-300">Restore dari Backup</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Upload file backup (.json) untuk memulihkan seluruh data database.
            </p>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/50">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-rose-300 leading-relaxed">
              <strong>Peringatan:</strong> Restore akan <strong>menghapus SEMUA data saat ini</strong> dan
              menggantinya dengan data dari file backup. Proses ini tidak dapat dibatalkan.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/50 text-rose-400 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            {isRestoring ? (
              <>
                <RefreshCcw className="w-4 h-4 animate-spin" />
                Sedang merestore database...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Pilih File Backup untuk Restore
              </>
            )}
          </button>
        </div>
      </div>

      {/* ══ CONFIRMATION MODAL ══ */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-rose-900/50 rounded-2xl shadow-2xl shadow-rose-950/30 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Konfirmasi Restore Database</h3>
              </div>
              <button
                onClick={() => { setConfirmOpen(false); setPendingFile(null); setConfirmText(''); }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300 space-y-2 leading-relaxed">
                <p><strong>⚠️ Tindakan ini tidak dapat dibatalkan.</strong></p>
                <p>Seluruh data database saat ini akan dihapus dan diganti dengan data dari:</p>
                <p className="font-mono text-rose-400 text-[11px] bg-rose-950/40 px-2 py-1 rounded">
                  {pendingFile?.name}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Ketik <span className="text-rose-400 font-mono">{CONFIRM_KEYWORD}</span> untuk mengkonfirmasi
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={`Ketik ${CONFIRM_KEYWORD} di sini...`}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500/50 transition-colors placeholder-slate-700"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-800">
              <button
                onClick={() => { setConfirmOpen(false); setPendingFile(null); setConfirmText(''); }}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleRestoreConfirm}
                disabled={confirmText !== CONFIRM_KEYWORD}
                className="flex-1 px-4 py-2.5 bg-rose-700 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Ya, Restore Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ RESTORE RESULT MODAL ══ */}
      {restoreResultOpen && restoreResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-900/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Restore Berhasil!</h3>
              </div>
              <button
                onClick={() => setRestoreResultOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="text-[10px] text-slate-500 space-y-1">
                <p>
                  Backup dibuat pada:{' '}
                  <span className="text-slate-300 font-semibold">
                    {new Date(restoreResult.backupCreatedAt).toLocaleString('id-ID')}
                  </span>
                </p>
                <p>
                  Restore selesai:{' '}
                  <span className="text-slate-300 font-semibold">
                    {new Date(restoreResult.restoredAt).toLocaleString('id-ID')}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-800/60 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-4 text-left">Tabel</th>
                      <th className="py-2.5 px-4 text-right">Record</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {Object.entries(restoreResult.restored).map(([key, count]) => (
                      <tr key={key} className="hover:bg-slate-800/20">
                        <td className="py-2 px-4 capitalize">{key}</td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-400 font-bold">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 text-[10px] text-amber-300">
                ⚠️ Silakan login ulang jika password Anda berubah setelah restore.
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800">
              <button
                onClick={() => setRestoreResultOpen(false)}
                className="w-full px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
