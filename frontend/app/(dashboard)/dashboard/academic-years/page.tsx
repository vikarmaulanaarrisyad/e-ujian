'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { Calendar, Plus, Trash2, CheckCircle2, AlertCircle, Settings2, Loader2, Save, X } from 'lucide-react';

interface GradeWeight {
  id: string;
  reportPercentage: number;
  examPercentage: number;
}

interface AcademicYear {
  id: string;
  year: string;
  semester: 'ODD' | 'EVEN';
  isActive: boolean;
  gradeWeights: GradeWeight[];
}

export default function AcademicYearPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Add Form
  const [newYear, setNewYear] = useState('');
  const [newSemester, setNewSemester] = useState<'ODD' | 'EVEN'>('ODD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Weight Form
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [reportWeight, setReportWeight] = useState(60);
  const [examWeight, setExamWeight] = useState(40);

  const isAdmin = user?.role === 'ADMIN';

  const fetchAcademicYears = async () => {
    setLoading(true);
    try {
      const res = await api.get('/academic-years');
      setAcademicYears(res.data);
    } catch (error) {
      showToast('Gagal memuat data Tahun Ajaran.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYear.match(/^\d{4}\/\d{4}$/)) {
      showToast('Format tahun ajaran tidak valid. Gunakan format "YYYY/YYYY" (contoh: 2026/2027).', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/academic-years', {
        year: newYear,
        semester: newSemester,
      });
      showToast('Tahun Ajaran berhasil ditambahkan.', 'success');
      setIsAddModalOpen(false);
      setNewYear('');
      fetchAcademicYears();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menambahkan tahun ajaran.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (id: string) => {
    if (!window.confirm('Mengaktifkan tahun ajaran ini akan mengubah tujuan penyimpanan data rapor dan ujian. Lanjutkan?')) return;
    
    try {
      await api.patch(`/academic-years/${id}/activate`);
      showToast('Tahun Ajaran berhasil diaktifkan.', 'success');
      fetchAcademicYears();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal mengaktifkan.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus tahun ajaran ini? Data yang terhubung mungkin akan hilang jika ada.')) return;
    
    try {
      await api.delete(`/academic-years/${id}`);
      showToast('Tahun Ajaran berhasil dihapus.', 'success');
      fetchAcademicYears();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus tahun ajaran (Mungkin sudah ada data nilai).', 'error');
    }
  };

  const openWeightModal = (year: AcademicYear) => {
    setSelectedYear(year);
    if (year.gradeWeights && year.gradeWeights.length > 0) {
      setReportWeight(year.gradeWeights[0].reportPercentage);
      setExamWeight(year.gradeWeights[0].examPercentage);
    } else {
      setReportWeight(60);
      setExamWeight(40);
    }
    setIsWeightModalOpen(true);
  };

  const handleUpdateWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear) return;
    
    if (reportWeight + examWeight !== 100) {
      showToast('Total bobot Rapor + Ujian harus 100%.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/academic-years/${selectedYear.id}/weights`, {
        reportPercentage: reportWeight,
        examPercentage: examWeight,
      });
      showToast('Bobot kelulusan berhasil diperbarui.', 'success');
      setIsWeightModalOpen(false);
      fetchAcademicYears();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memperbarui bobot.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-400" />
            Tahun Ajaran & Semester
          </h2>
          <p className="text-xs text-slate-450 mt-1">Kelola siklus akademik, setel tahun aktif, dan atur bobot nilai.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 w-fit"
          >
            <Plus className="w-4 h-4" />
            Tambah Tahun Ajaran
          </button>
        )}
      </div>

      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-xs">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            Memuat data tahun ajaran...
          </div>
        ) : academicYears.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl m-6">
            Belum ada data Tahun Ajaran. Silakan tambahkan baru.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-800/60 bg-slate-950/30 text-slate-450 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Tahun Ajaran</th>
                  <th className="py-4 px-6">Semester</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Bobot (Rapor : Ujian)</th>
                  {isAdmin && <th className="py-4 px-6 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                {academicYears.map((ay) => {
                  const rWeight = ay.gradeWeights?.[0]?.reportPercentage || 60;
                  const eWeight = ay.gradeWeights?.[0]?.examPercentage || 40;
                  
                  return (
                    <tr key={ay.id} className={`hover:bg-slate-900/40 transition-colors ${ay.isActive ? 'bg-indigo-950/10' : ''}`}>
                      <td className="py-4 px-6 font-semibold text-slate-200">
                        {ay.year}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          ay.semester === 'ODD' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' 
                          : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                        }`}>
                          {ay.semester === 'ODD' ? 'GANJIL' : 'GENAP'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {ay.isActive ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-bold border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            AKTIF
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 text-slate-450 rounded-full text-[10px] font-medium border border-slate-700/50">
                            Tidak Aktif
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-slate-950/50 rounded-lg border border-slate-800 font-mono text-[10px]">
                          <span className="text-emerald-400 font-bold" title="Bobot Rapor">{rWeight}%</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-amber-400 font-bold" title="Bobot Ujian">{eWeight}%</span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {!ay.isActive && (
                              <button
                                onClick={() => handleActivate(ay.id)}
                                className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-bold transition-colors"
                              >
                                Set Aktif
                              </button>
                            )}
                            <button
                              onClick={() => openWeightModal(ay)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                              title="Atur Bobot Kelulusan"
                            >
                              <Settings2 className="w-4 h-4" />
                            </button>
                            {!ay.isActive && (
                              <button
                                onClick={() => handleDelete(ay.id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors border border-rose-500/20"
                                title="Hapus Tahun Ajaran"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD ACADEMIC YEAR MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Tambah Tahun Ajaran
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tahun Ajaran</label>
                <input
                  type="text"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="Contoh: 2026/2027"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Semester</label>
                <select
                  value={newSemester}
                  onChange={(e) => setNewSemester(e.target.value as 'ODD' | 'EVEN')}
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 appearance-none"
                >
                  <option value="ODD">Ganjil</option>
                  <option value="EVEN">Genap</option>
                </select>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-amber-300/80 text-xs mt-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>Tahun ajaran baru otomatis dibuat dengan bobot kelulusan default (Rapor 60%, Ujian 40%). Anda dapat menyesuaikannya nanti.</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT WEIGHT MODAL --- */}
      {isWeightModalOpen && selectedYear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-indigo-400" />
                  Atur Bobot Kelulusan
                </h3>
                <p className="text-[10px] text-slate-450 mt-1">
                  TA: {selectedYear.year} ({selectedYear.semester === 'ODD' ? 'Ganjil' : 'Genap'})
                </p>
              </div>
              <button onClick={() => setIsWeightModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateWeight} className="p-5 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Bobot Rapor (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={reportWeight}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setReportWeight(val);
                        setExamWeight(100 - val); // Auto balance
                      }}
                      required
                      className="w-full px-4 py-4 text-center font-bold text-xl bg-slate-950/50 border border-slate-800 rounded-xl text-emerald-400 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Bobot Ujian (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={examWeight}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setExamWeight(val);
                        setReportWeight(100 - val); // Auto balance
                      }}
                      required
                      className="w-full px-4 py-4 text-center font-bold text-xl bg-slate-950/50 border border-slate-800 rounded-xl text-amber-400 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>
              
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${reportWeight}%` }} className="h-full bg-emerald-500 transition-all duration-300"></div>
                <div style={{ width: `${examWeight}%` }} className="h-full bg-amber-500 transition-all duration-300"></div>
              </div>
              
              <div className="flex justify-center">
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${reportWeight + examWeight === 100 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  Total: {reportWeight + examWeight}%
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsWeightModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || reportWeight + examWeight !== 100}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Bobot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
