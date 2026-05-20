'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Printer, Award, Download } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface SubjectScore {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectGroup: string;
  reportAverage: number;
  examScore: number;
  finalScore: number;
}

interface StudentRecap {
  studentId: string;
  nis: string;
  nisn: string;
  studentName: string;
  gender: string;
  subjectScores: SubjectScore[];
  totalFinalScore: number;
  averageFinalScore: number;
  rank: number;
}

export default function GradeRecapPage() {
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['recap'],
    queryFn: async () => {
      const res = await api.get('/grades/recap');
      return res.data;
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/grades/recap/export', { responseType: 'blob' });
      const fileName = `rekap_nilai_akhir_${data?.academicYear?.year ? data.academicYear.year.replace('/', '_') : 'recap'}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('Berhasil mengunduh rekap nilai akhir ke Excel.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal mengekspor rekap nilai akhir.', 'error');
    }
  };

  const subjects = data?.recap?.[0]?.subjectScores || [];

  return (
    <div className="space-y-6 print-container">
      {/* Header section (hidden on print) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">Rekapitulasi Nilai Akhir</h2>
          <p className="text-xs text-slate-450 mt-1">
            Kalkulasi nilai akhir kelulusan (Rata-rata Rapor {data?.weight?.reportPercentage || 60}% & Ujian Madrasah {data?.weight?.examPercentage || 40}%).
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Excel Rekap</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-md shadow-indigo-600/10"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap Nilai</span>
          </button>
        </div>
      </div>

      {/* Print header (visible only on print) */}
      <div className="hidden print:flex flex-col items-center text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-lg font-bold uppercase text-black">LAPORAN REKAPITULASI NILAI AKHIR SISWA</h1>
        <h2 className="text-md font-bold uppercase text-black">MI BUSTANUL HUDA DAWUHAN</h2>
        <p className="text-[10px] text-black mt-1">Tahun Pelajaran: {data?.academicYear?.year || '2025/2026'} | Semester: {data?.academicYear?.semester || 'GANJIL'}</p>
        <p className="text-[9px] text-black mt-0.5">Bobot Kelulusan: Rapor {data?.weight?.reportPercentage || 60}% | Ujian {data?.weight?.examPercentage || 40}%</p>
      </div>

      {/* Recap details card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl print:bg-white print:border-none print:shadow-none print:p-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-200">Rincian Nilai Akhir</h3>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] font-semibold text-slate-455">
            Formula: Rapor ({data?.weight?.reportPercentage || 60}%) + Ujian ({data?.weight?.examPercentage || 40}%)
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-505 text-xs print:hidden">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Mengkalkulasi rekapitulasi nilai akhir...
          </div>
        ) : !data?.recap || data.recap.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl print:text-black">
            Tidak ada data rekapitulasi nilai. Pastikan data siswa dan nilai telah diinput.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px] print:text-black">
                <thead>
                  <tr className="border-b border-slate-800/60 text-slate-450 text-[10px] font-bold uppercase tracking-wider print:border-black">
                    <th className="py-3 px-4 print:text-black print:border print:border-black">NIS</th>
                    <th className="py-3 px-4 print:text-black print:border print:border-black">Nama Lengkap</th>
                    <th className="py-3 px-4 text-center print:text-black print:border print:border-black">L/P</th>
                    {subjects.map((sub: any) => (
                      <th key={sub.subjectId} className="py-3 px-2 text-center text-[9px] print:text-black print:border print:border-black" title={sub.subjectName}>
                        {sub.subjectCode}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center font-bold text-emerald-400 print:text-black print:border print:border-black">JUMLAH</th>
                    <th className="py-3 px-4 text-center font-bold text-indigo-400 print:text-black print:border print:border-black">RATA2</th>
                    <th className="py-3 px-4 text-center font-bold text-amber-400 print:text-black print:border print:border-black">RANK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs text-slate-350 print:divide-black">
                  {data.recap.map((student: StudentRecap) => (
                    <tr key={student.studentId} className="hover:bg-slate-900/10">
                      <td className="py-3 px-4 font-mono text-slate-450 print:text-black print:border print:border-black">{student.nis}</td>
                      <td className="py-3 px-4 font-bold text-slate-205 print:text-black print:border print:border-black">{student.studentName}</td>
                      <td className="py-3 px-4 text-center print:text-black print:border print:border-black">{student.gender}</td>
                      {student.subjectScores.map((score) => (
                        <td key={score.subjectId} className="py-3 px-2 text-center font-mono text-slate-400 print:text-black print:border print:border-black">
                          {score.finalScore !== undefined && score.finalScore !== null ? score.finalScore.toFixed(0) : '0'}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-center font-bold font-mono text-emerald-400 print:text-black print:border print:border-black">
                        {student.totalFinalScore !== undefined && student.totalFinalScore !== null ? student.totalFinalScore.toFixed(0) : '0'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono text-indigo-400 print:text-black print:border print:border-black">
                        {student.averageFinalScore !== undefined && student.averageFinalScore !== null ? student.averageFinalScore.toFixed(2) : '0.00'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono text-amber-400 print:text-black print:border print:border-black">
                        {student.rank !== undefined && student.rank !== null ? student.rank : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Print sign area */}
            <div className="hidden print:grid grid-cols-2 gap-8 pt-12 text-xs text-black">
              <div></div>
              <div className="text-center flex flex-col items-center">
                <p>Bondowoso, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="mt-1 font-semibold">Kepala Madrasah,</p>
                <div className="h-16"></div>
                <p className="font-bold underline">H. Ahmad Fauzi, S.Pd.I</p>
                <p>NIP. 197508122005011002</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
