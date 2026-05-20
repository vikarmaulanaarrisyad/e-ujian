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
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

interface Subject {
  id: string;
  code: string;
  name: string;
  group: string;
}

export default function ExamGradesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected Subject State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Local grid grades state
  const [gridGrades, setGridGrades] = useState<Record<string, number | ''>>({});

  // Fetch Subjects
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await api.get('/grades/subjects');
      return res.data;
    },
  });

  // Automatically select first subject once loaded
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Fetch Exam Grades for selected Subject
  const { data: examData, isLoading: isLoadingGrades } = useQuery({
    queryKey: ['examGrades', selectedSubjectId],
    queryFn: async () => {
      if (!selectedSubjectId) return null;
      const res = await api.get(`/grades/exams?subjectId=${selectedSubjectId}`);
      return res.data;
    },
    enabled: !!selectedSubjectId,
  });

  // Sync server data to local grid state
  useEffect(() => {
    if (examData?.students) {
      const initialGrid: Record<string, number | ''> = {};
      examData.students.forEach((student: any) => {
        initialGrid[student.studentId] = student.score !== null ? student.score : '';
      });
      setGridGrades(initialGrid);
    }
  }, [examData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/grades/exams', payload);
    },
    onSuccess: () => {
      setSaveSuccess(true);
      setSaveError(null);
      queryClient.invalidateQueries({ queryKey: ['examGrades', selectedSubjectId] });
      queryClient.invalidateQueries({ queryKey: ['recap'] });
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: any) => {
      setSaveSuccess(false);
      setSaveError(err.response?.data?.message || 'Gagal menyimpan nilai.');
    }
  });

  const handleCellChange = (studentId: string, val: string) => {
    const numVal = val === '' ? '' : Number(val);
    if (numVal !== '' && (isNaN(numVal) || numVal < 0 || numVal > 100)) return;

    setGridGrades((prev) => ({
      ...prev,
      [studentId]: numVal,
    }));
  };

  const handleSave = () => {
    setSaveError(null);
    setSaveSuccess(false);

    const gradesArray: any[] = [];
    Object.keys(gridGrades).forEach((studentId) => {
      const score = gridGrades[studentId];
      if (score !== '') {
        gradesArray.push({
          studentId,
          subjectId: selectedSubjectId,
          score,
        });
      }
    });

    if (gradesArray.length === 0) {
      setSaveError('Tidak ada nilai yang diinput untuk disimpan.');
      return;
    }

    saveMutation.mutate({ grades: gradesArray });
  };

  // Excel handlers
  const handleExportExcel = async () => {
    if (!selectedSubjectId) return;
    try {
      const response = await api.get(`/grades/exams/export?subjectId=${selectedSubjectId}`, { responseType: 'blob' });
      const currentSubject = subjects.find(s => s.id === selectedSubjectId);
      const fileName = `nilai_ujian_${currentSubject?.code.toLowerCase() || 'subject'}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('Template nilai ujian berhasil diunduh.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor template nilai.', 'error');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSubjectId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subjectId', selectedSubjectId);

    try {
      setImporting(true);
      const res = await api.post('/grades/exams/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(res.data.message || 'Import nilai ujian berhasil!', 'success');
      queryClient.invalidateQueries({ queryKey: ['examGrades', selectedSubjectId] });
      queryClient.invalidateQueries({ queryKey: ['recap'] });
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || 'Gagal mengimpor file.';
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
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">Input Nilai Ujian Madrasah</h2>
          <p className="text-xs text-slate-450 mt-1">Kelola nilai Ujian Akhir Madrasah untuk kelulusan siswa.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {selectedSubjectId && (
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Template Ujian</span>
            </button>
          )}

          {selectedSubjectId && user?.role !== 'GURU' && (
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
                <span>{importing ? 'Mengimpor...' : 'Impor Nilai Ujian'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid Settings Bar */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-800/60 pb-5">
          <div className="w-full sm:max-w-xs">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Mata Pelajaran</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
            >
              {isLoadingSubjects ? (
                <option>Memuat Mapel...</option>
              ) : (
                subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    [{sub.group}] {sub.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Input Feedback Notification */}
        {saveSuccess && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-450">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
            <span>Semua nilai ujian madrasah berhasil disimpan ke database.</span>
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
            Memuat tabel input nilai ujian...
          </div>
        ) : !selectedSubjectId ? (
          <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            Silakan pilih mata pelajaran terlebih dahulu.
          </div>
        ) : examData?.students?.length === 0 ? (
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
                    <th className="py-3.5 px-4 text-center">Nilai Ujian Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                  {examData.students.map((student: any) => (
                    <tr key={student.studentId} className="hover:bg-slate-900/10">
                      <td className="py-3.5 px-4 font-mono text-slate-450">{student.nis}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-205">{student.studentName}</td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="text"
                          value={gridGrades[student.studentId] ?? ''}
                          onChange={(e) => handleCellChange(student.studentId, e.target.value)}
                          className="w-24 px-2 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-center font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                          placeholder="-"
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
                <span>Simpan Semua Nilai Ujian</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
