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
  BookOpen
} from 'lucide-react';

interface Subject {
  id: string;
  code: string;
  name: string;
  group: string;
}

export default function ReportGradesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputAllRef = useRef<HTMLInputElement>(null);

  // Selected Subject & Semester State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [importingAll, setImportingAll] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Local grid grades state
  const [gridGrades, setGridGrades] = useState<Record<string, Record<number, number | ''>>>({});

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

  // Fetch Report Grades for selected Subject
  const { data: reportData, isLoading: isLoadingGrades } = useQuery({
    queryKey: ['reportGrades', selectedSubjectId],
    queryFn: async () => {
      if (!selectedSubjectId) return null;
      const res = await api.get(`/grades/reports?subjectId=${selectedSubjectId}`);
      return res.data;
    },
    enabled: !!selectedSubjectId,
  });

  // Sync server data to local grid state
  useEffect(() => {
    if (reportData?.students) {
      const initialGrid: Record<string, Record<number, number | ''>> = {};
      reportData.students.forEach((student: any) => {
        initialGrid[student.studentId] = {
          7: student.grades[7] !== null ? student.grades[7] : '',
          8: student.grades[8] !== null ? student.grades[8] : '',
          9: student.grades[9] !== null ? student.grades[9] : '',
          10: student.grades[10] !== null ? student.grades[10] : '',
          11: student.grades[11] !== null ? student.grades[11] : '',
          12: student.grades[12] !== null ? student.grades[12] : '',
        };
      });
      setGridGrades(initialGrid);
    }
  }, [reportData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/grades/reports', payload);
    },
    onSuccess: () => {
      setSaveSuccess(true);
      setSaveError(null);
      queryClient.invalidateQueries({ queryKey: ['reportGrades', selectedSubjectId] });
      queryClient.invalidateQueries({ queryKey: ['recap'] });
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: any) => {
      setSaveSuccess(false);
      setSaveError(err.response?.data?.message || 'Gagal menyimpan nilai.');
    }
  });

  const handleCellChange = (studentId: string, semester: number, val: string) => {
    const numVal = val === '' ? '' : Number(val);
    if (numVal !== '' && (isNaN(numVal) || numVal < 0 || numVal > 100)) return;

    setGridGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [semester]: numVal,
      },
    }));
  };

  const handleSave = () => {
    setSaveError(null);
    setSaveSuccess(false);

    const gradesArray: any[] = [];
    Object.keys(gridGrades).forEach((studentId) => {
      const semesters = gridGrades[studentId];
      [7, 8, 9, 10, 11, 12].forEach((sem) => {
        const score = semesters[sem];
        if (score !== '') {
          gradesArray.push({
            studentId,
            subjectId: selectedSubjectId,
            semester: sem,
            score,
          });
        }
      });
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
      const semParam = selectedSemester ? `&semester=${selectedSemester}` : '';
      const response = await api.get(`/grades/reports/export?subjectId=${selectedSubjectId}${semParam}`, { responseType: 'blob' });
      const currentSubject = subjects.find(s => s.id === selectedSubjectId);
      const semSuffix = selectedSemester ? `_smt_${selectedSemester}` : '';
      const fileName = `nilai_rapor_${currentSubject?.code.toLowerCase() || 'subject'}${semSuffix}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('Template nilai rapor berhasil diunduh.', 'success');
    } catch (err: any) {
      console.error(err);
      if (err.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string);
            showToast(errorData.message || 'Gagal mengekspor template nilai.', 'error');
          } catch {
            showToast('Gagal mengekspor template nilai.', 'error');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        showToast(err.response?.data?.message || err.message || 'Gagal mengekspor template nilai.', 'error');
      }
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
      const res = await api.post('/grades/reports/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(res.data.message || 'Import nilai rapor berhasil!', 'success');
      queryClient.invalidateQueries({ queryKey: ['reportGrades', selectedSubjectId] });
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

  const handleExportAllExcel = async () => {
    try {
      const semParam = selectedSemester ? `?semester=${selectedSemester}` : '';
      const response = await api.get(`/grades/reports/export-all${semParam}`, { responseType: 'blob' });
      const semSuffix = selectedSemester ? `_smt_${selectedSemester}` : '';
      const fileName = `nilai_rapor_semua_mapel${semSuffix}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('Template nilai rapor semua mapel berhasil diunduh.', 'success');
    } catch (err: any) {
      console.error(err);
      if (err.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string);
            showToast(errorData.message || 'Gagal mengekspor template nilai semua mapel.', 'error');
          } catch {
            showToast('Gagal mengekspor template nilai semua mapel.', 'error');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        showToast(err.response?.data?.message || err.message || 'Gagal mengekspor template nilai semua mapel.', 'error');
      }
    }
  };

  const handleExportGradesAllExcel = async () => {
    try {
      const semParam = selectedSemester ? `?semester=${selectedSemester}` : '';
      const response = await api.get(`/grades/reports/export-all${semParam}`, { responseType: 'blob' });
      const semSuffix = selectedSemester ? `_smt_${selectedSemester}` : '';
      const fileName = `ekspor_nilai_rapor_semua_mapel${semSuffix}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('Ekspor nilai rapor semua mapel berhasil diunduh.', 'success');
    } catch (err: any) {
      console.error(err);
      if (err.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string);
            showToast(errorData.message || 'Gagal mengekspor nilai semua mapel.', 'error');
          } catch {
            showToast('Gagal mengekspor nilai semua mapel.', 'error');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        showToast(err.response?.data?.message || err.message || 'Gagal mengekspor nilai semua mapel.', 'error');
      }
    }
  };

  const handleImportAllExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setImportingAll(true);
      const res = await api.post('/grades/reports/import-all', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(res.data.message || 'Import nilai rapor semua mapel berhasil!', 'success');
      queryClient.invalidateQueries({ queryKey: ['reportGrades', selectedSubjectId] });
      queryClient.invalidateQueries({ queryKey: ['recap'] });
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || 'Gagal mengimpor file.';
      showToast(msg, 'error');
    } finally {
      setImportingAll(false);
      if (fileInputAllRef.current) fileInputAllRef.current.value = '';
    }
  };

  const isGuru = user?.role === 'GURU';

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">Input Nilai Rapor (Sem 7-11)</h2>
          <p className="text-xs text-slate-450 mt-1">Kelola nilai rapor semester 7 sampai 11 kelas 4 - kelas 6 ganjil.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Batch Export & Import for All Subjects */}
          <button
            onClick={handleExportAllExcel}
            className="px-4 py-2.5 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/60 rounded-xl text-xs font-semibold text-indigo-300 flex items-center gap-2 cursor-pointer transition-all duration-200"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Unduh Template Semua Mapel{selectedSemester ? ` (Smt ${selectedSemester})` : ''}</span>
          </button>

          <button
            onClick={handleExportGradesAllExcel}
            className="px-4 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/50 rounded-xl text-xs font-semibold text-emerald-450 flex items-center gap-2 cursor-pointer transition-all duration-200"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Nilai Rapor (Semua Mapel{selectedSemester ? ` - Smt ${selectedSemester}` : ''})</span>
          </button>

          {user?.role !== 'GURU' && (
            <>
              <input
                type="file"
                ref={fileInputAllRef}
                onChange={handleImportAllExcel}
                className="hidden"
                accept=".xlsx, .xls"
              />
              <button
                onClick={() => fileInputAllRef.current?.click()}
                disabled={importingAll}
                className="px-4 py-2.5 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/60 rounded-xl text-xs font-semibold text-indigo-300 flex items-center gap-2 cursor-pointer transition-all duration-200 disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>{importingAll ? 'Mengimpor...' : 'Impor Nilai Semua Mapel'}</span>
              </button>
            </>
          )}

          {/* Divider */}
          <div className="h-9 w-px bg-slate-800 self-center hidden md:block"></div>

          {selectedSubjectId && (
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer transition-all duration-200"
            >
              <Download className="w-4 h-4 text-slate-450" />
              <span>Unduh Template Rapor{selectedSemester ? ` (Smt ${selectedSemester})` : ''}</span>
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
                <Upload className="w-4 h-4 text-slate-450" />
                <span>{importing ? 'Mengimpor...' : 'Impor Nilai Rapor'}</span>
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

          <div className="w-full sm:max-w-[185px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
            >
              <option value="">Semua Semester</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
              <option value="9">Semester 9</option>
              <option value="10">Semester 10</option>
              <option value="11">Semester 11</option>
              <option value="12">Semester 12</option>
            </select>
          </div>
        </div>

        {/* Input Feedback Notification */}
        {saveSuccess && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-450">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
            <span>Semua nilai rapor berhasil disimpan ke database.</span>
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
            Memuat tabel input nilai rapor...
          </div>
        ) : !selectedSubjectId ? (
          <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            Silakan pilih mata pelajaran terlebih dahulu.
          </div>
        ) : reportData?.students?.length === 0 ? (
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
                    {(!selectedSemester || selectedSemester === '7') && <th className="py-3.5 px-4 text-center">Smt 7</th>}
                    {(!selectedSemester || selectedSemester === '8') && <th className="py-3.5 px-4 text-center">Smt 8</th>}
                    {(!selectedSemester || selectedSemester === '9') && <th className="py-3.5 px-4 text-center">Smt 9</th>}
                    {(!selectedSemester || selectedSemester === '10') && <th className="py-3.5 px-4 text-center">Smt 10</th>}
                    {(!selectedSemester || selectedSemester === '11') && <th className="py-3.5 px-4 text-center">Smt 11</th>}
                    {(!selectedSemester || selectedSemester === '12') && <th className="py-3.5 px-4 text-center">Smt 12</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                  {reportData.students.map((student: any) => (
                    <tr key={student.studentId} className="hover:bg-slate-900/10">
                      <td className="py-3.5 px-4 font-mono text-slate-450">{student.nis}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-205">{student.studentName}</td>
                      {[7, 8, 9, 10, 11, 12].map((sem) => {
                        if (selectedSemester && selectedSemester !== String(sem)) return null;
                        return (
                          <td key={sem} className="py-2.5 px-4 text-center">
                            <input
                              type="text"
                              value={gridGrades[student.studentId]?.[sem] ?? ''}
                              onChange={(e) => handleCellChange(student.studentId, sem, e.target.value)}
                              className="w-16 px-2 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-center font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Save Buttons */}
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
                <span>Simpan Semua Nilai Rapor</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
