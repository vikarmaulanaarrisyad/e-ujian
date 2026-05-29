'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { 
  Download, 
  Upload, 
  Save, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function TkaGradesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected Subject Type State
  const [selectedSubjectType, setSelectedSubjectType] = useState<string>('MATEMATIKA');
  const [importing, setImporting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Local grid grades state
  const [gridGrades, setGridGrades] = useState<Record<string, string>>({});

  const tkaSubjects = [
    { id: 'MATEMATIKA', name: 'Matematika' },
    { id: 'BAHASA_INDONESIA', name: 'Bahasa Indonesia' }
  ];

  // Fetch TKA Grades for selected Subject
  const { data: tkaData, isLoading: isLoadingGrades } = useQuery({
    queryKey: ['tkaGrades', selectedSubjectType],
    queryFn: async () => {
      if (!selectedSubjectType) return null;
      const res = await api.get(`/grades/tka?subjectType=${selectedSubjectType}`);
      return res.data;
    },
    enabled: !!selectedSubjectType,
  });

  // Sync server data to local grid state
  useEffect(() => {
    if (tkaData?.students) {
      const initialGrid: Record<string, string> = {};
      tkaData.students.forEach((student: any) => {
        // format output dengan koma jika ada desimal (opsional, tapi disesuaikan dengan input pengguna)
        initialGrid[student.studentId] = student.score !== null ? String(student.score).replace('.', ',') : '';
      });
      setGridGrades(initialGrid);
    }
  }, [tkaData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/grades/tka', payload);
    },
    onSuccess: () => {
      setSaveSuccess(true);
      setSaveError(null);
      queryClient.invalidateQueries({ queryKey: ['tkaGrades', selectedSubjectType] });
      queryClient.invalidateQueries({ queryKey: ['recap'] });
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: any) => {
      setSaveSuccess(false);
      setSaveError(err.response?.data?.message || 'Gagal menyimpan nilai TKA.');
    }
  });

  const handleCellChange = (studentId: string, val: string) => {
    // Only allow numbers and commas
    if (val !== '' && !/^[0-9,]+$/.test(val)) return;

    setGridGrades((prev) => ({
      ...prev,
      [studentId]: val,
    }));
  };

  const handleSave = () => {
    setSaveError(null);
    setSaveSuccess(false);

    const gradesArray: any[] = [];
    let hasError = false;

    Object.keys(gridGrades).forEach((studentId) => {
      const scoreStr = gridGrades[studentId];
      if (scoreStr !== '') {
        const score = Number(scoreStr.replace(',', '.'));
        if (isNaN(score) || score < 0 || score > 100) {
          hasError = true;
        } else {
          gradesArray.push({
            studentId,
            subjectType: selectedSubjectType,
            score,
          });
        }
      }
    });

    if (hasError) {
      setSaveError('Pastikan nilai berupa angka antara 0 hingga 100.');
      return;
    }

    if (gradesArray.length === 0) {
      setSaveError('Tidak ada nilai yang diinput untuk disimpan.');
      return;
    }

    saveMutation.mutate({ grades: gradesArray });
  };

  // Excel handlers
  const handleExportExcel = async () => {
    if (!selectedSubjectType) return;
    try {
      const response = await api.get(`/grades/tka/export?subjectType=${selectedSubjectType}`, { responseType: 'blob' });
      const fileName = `nilai_tka_${selectedSubjectType.toLowerCase()}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('Template nilai TKA berhasil diunduh.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor template nilai TKA.', 'error');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSubjectType) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subjectType', selectedSubjectType);

    try {
      setImporting(true);
      const res = await api.post('/grades/tka/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(res.data.message || 'Import nilai TKA berhasil!', 'success');
      queryClient.invalidateQueries({ queryKey: ['tkaGrades', selectedSubjectType] });
      queryClient.invalidateQueries({ queryKey: ['recap'] });
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.errors?.join('\\n') || err.response?.data?.message || 'Gagal mengimpor file.';
      showToast(msg, 'error');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">Input Nilai TKA</h2>
          <p className="text-xs text-slate-450 mt-1">Kelola nilai Tes Kemampuan Akademik (TKA) siswa.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {selectedSubjectType && (
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Template TKA</span>
            </button>
          )}

          {selectedSubjectType && user?.role !== 'GURU' && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                className="hidden"
                accept=".xlsx, .xls"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer transition-all duration-200 disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>{importing ? 'Mengimpor...' : 'Impor Nilai TKA'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid Settings Bar */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-800/60 pb-5">
          <div className="w-full sm:max-w-xs">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Jenis TKA</label>
            <select
              value={selectedSubjectType}
              onChange={(e) => setSelectedSubjectType(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
            >
              {tkaSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Feedback Notification */}
        {saveSuccess && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-450">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
            <span>Semua nilai TKA berhasil disimpan ke database.</span>
          </div>
        )}

        {saveError && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-450">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Table/Input Grid */}
        {isLoadingGrades ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Memuat tabel input nilai TKA...
          </div>
        ) : tkaData?.students?.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            Tidak ada siswa terdaftar. Silakan tambahkan siswa di halaman Data Siswa.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-800/60 text-slate-450 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-[150px]">NIS</th>
                    <th className="py-3.5 px-4 w-[250px]">Nama Lengkap</th>
                    <th className="py-3.5 px-4 text-center">Nilai TKA ({selectedSubjectType === 'MATEMATIKA' ? 'Matematika' : 'Bahasa Indonesia'})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                  {tkaData?.students?.map((student: any) => (
                    <tr key={student.studentId} className="hover:bg-slate-900/10">
                      <td className="py-3.5 px-4 font-mono text-slate-450">{student.nis}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-205">{student.studentName}</td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="text"
                          value={gridGrades[student.studentId] ?? ''}
                          onChange={(e) => handleCellChange(student.studentId, e.target.value)}
                          className="w-24 px-2 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-center font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                          placeholder="85,5"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-slate-800/60">
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/10 flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Simpan Semua Nilai TKA</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
