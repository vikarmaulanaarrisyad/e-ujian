'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Settings, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [reportPercentage, setReportPercentage] = useState<number>(60);
  const [examPercentage, setExamPercentage] = useState<number>(40);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if not ADMIN
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch Weight Settings
  const { data, isLoading } = useQuery({
    queryKey: ['weight'],
    queryFn: async () => {
      const res = await api.get('/grades/weight');
      return res.data;
    },
  });

  // Sync to states
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
      setSuccess(true);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['weight'] });
      queryClient.invalidateQueries({ queryKey: ['recap'] });
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: any) => {
      setSuccess(false);
      setError(err.response?.data?.message || 'Gagal menyimpan konfigurasi bobot.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (reportPercentage + examPercentage !== 100) {
      setError('Total pembobotan harus sama dengan 100%!');
      return;
    }

    updateMutation.mutate({
      reportPercentage,
      examPercentage,
    });
  };

  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-wide">Pengaturan Sistem</h2>
        <p className="text-xs text-slate-450 mt-1">Konfigurasi pembobotan nilai akhir dan preferensi kelulusan.</p>
      </div>

      <div className="max-w-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-7 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3.5 mb-6 border-b border-slate-800/60 pb-4">
          <div className="p-2.5 rounded-xl bg-indigo-550/10 border border-indigo-500/20 text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200">Bobot Persentase Nilai Akhir</h3>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-550 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Memuat pengaturan bobot...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {success && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-450">
                <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                <span>Konfigurasi pembobotan berhasil diperbarui.</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-455">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{error}</span>
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
                    className="block w-32 px-3.5 py-2.5 bg-slate-955 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  <span className="text-slate-500 text-xs font-medium">
                    Bobot rata-rata nilai rapor (Sem 7-11)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-2.5">
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
                    className="block w-32 px-3.5 py-2.5 bg-slate-955 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  <span className="text-slate-500 text-xs font-medium">
                    Bobot nilai ujian madrasah
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/60 mt-6 flex justify-between items-center">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">
                Total: <span className={reportPercentage + examPercentage === 100 ? 'text-emerald-450 font-bold' : 'text-rose-455 font-bold'}>
                  {reportPercentage + examPercentage}%
                </span>
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/10 flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
