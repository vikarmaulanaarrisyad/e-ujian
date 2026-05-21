'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Award, Download, FileText, X, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['recap'],
    queryFn: async () => {
      const res = await api.get('/grades/recap');
      return res.data;
    },
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!data?.recap || data.recap.length === 0) {
      showToast('Tidak ada data untuk diunduh', 'error');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = doc.internal.pageSize.width;
      
      // Load logo if available
      let logoData = null;
      if (data?.schoolProfile?.logoUrl) {
        try {
          // Convert image URL to base64
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.src = data.schoolProfile.logoUrl;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          logoData = canvas.toDataURL('image/png');
        } catch (e) {
          console.error("Could not load logo for PDF", e);
        }
      }

      // Draw KOP Surat
      if (logoData) {
        doc.addImage(logoData, 'PNG', 15, 10, 25, 25);
      }
      
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.text('YAYASAN BUSTANUL HUDA DAWUHAN', pageWidth / 2, 14, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text(data?.schoolProfile?.name || 'MI BUSTANUL HUDA 01 DAWUHAN', pageWidth / 2, 21, { align: 'center' });
      
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(`TERAKREDITASI A     NPSN : ${data?.schoolProfile?.npsn || '60713609'}    NSM : 111233280040`, pageWidth / 2, 27, { align: 'center' });
      doc.text(data?.schoolProfile?.address || '-', pageWidth / 2, 32, { align: 'center' });
      
      // KOP Double Line
      doc.setLineWidth(1);
      doc.line(15, 36, pageWidth - 15, 36);
      doc.setLineWidth(0.5);
      doc.line(15, 37.5, pageWidth - 15, 37.5);
      
      // Title
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.text('LAPORAN REKAPITULASI NILAI AKHIR', pageWidth / 2, 48, { align: 'center' });
      
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(`Tahun Pelajaran: ${data?.academicYear?.year || '...'} | Semester: ${data?.academicYear?.semester === 'EVEN' ? 'GENAP' : 'GANJIL'}`, pageWidth / 2, 54, { align: 'center' });
      doc.setFont('times', 'italic');
      doc.text(`Kalkulasi Bobot: Rapor ${data?.weight?.reportPercentage || 60}% (Semester: ${data?.weight?.activeSemesters || '7,8,9,10,11'}) & Ujian ${data?.weight?.examPercentage || 40}%`, pageWidth / 2, 59, { align: 'center' });
      
      // Prepare Table Data
      const subjects = data.recap[0]?.subjectScores || [];
      const headers = [
        'NIS', 'Nama Lengkap', 'L/P',
        ...subjects.map((sub: any) => sub.subjectCode),
        'JUMLAH', 'RATA2', 'RATA2 BULAT', 'RANK'
      ];
      
      const body = data.recap.map((student: StudentRecap) => [
        student.nis,
        student.studentName,
        student.gender,
        ...student.subjectScores.map(s => s.finalScore !== undefined && s.finalScore !== null ? s.finalScore.toFixed(0) : '0'),
        student.totalFinalScore !== undefined && student.totalFinalScore !== null ? student.totalFinalScore.toFixed(0) : '0',
        student.averageFinalScore !== undefined && student.averageFinalScore !== null ? student.averageFinalScore.toFixed(2) : '0.00',
        student.averageFinalScore !== undefined && student.averageFinalScore !== null ? Math.round(student.averageFinalScore).toFixed(0) : '0',
        student.rank !== undefined && student.rank !== null ? student.rank : '-'
      ]);

      // Draw Table
      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 65,
        theme: 'grid',
        styles: { font: 'times', fontSize: 8, textColor: 0, halign: 'center' },
        headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          1: { halign: 'left', cellWidth: 40 }, // Nama Lengkap
        },
        margin: { left: 15, right: 15 },
        didDrawPage: function (dataInfo) {
          // Add Signatures on the last page only
          // We will draw it after the table, so we check if this is the last page (roughly)
          // A better way is to capture the final Y and draw on the current page if space allows
        }
      });
      
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      
      // Check if we need a new page for signatures
      if (finalY > doc.internal.pageSize.height - 40) {
        doc.addPage();
      }
      
      const signY = finalY > doc.internal.pageSize.height - 40 ? 30 : finalY;
      
      // Draw Signatures
      doc.setFont('times', 'normal');
      const cityName = data?.schoolProfile?.city || 'Bondowoso';
      doc.text(`${cityName}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 20, signY, { align: 'right' });
      doc.setFont('times', 'bold');
      doc.text('Kepala Madrasah,', pageWidth - 50, signY + 6, { align: 'center' });
      
      doc.text(data?.schoolProfile?.headmaster || '......................', pageWidth - 50, signY + 30, { align: 'center' });
      doc.setFont('times', 'normal');
      doc.text(`NIP. ${data?.schoolProfile?.headmasterNip || '-'}`, pageWidth - 50, signY + 35, { align: 'center' });

      // Save PDF
      const fileName = `Rekap_Nilai_Akhir_${data?.academicYear?.year ? data.academicYear.year.replace('/', '_') : 'recap'}.pdf`;
      doc.save(fileName);
      showToast('PDF berhasil diunduh.', 'success');
      
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat menggenerate PDF.', 'error');
    } finally {
      setIsDownloading(false);
    }
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

  const handleExportReportAllExcel = async () => {
    try {
      const response = await api.get('/grades/reports/export-all', { responseType: 'blob' });
      const fileName = `ekspor_nilai_rapor_semua_mapel.xlsx`;

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
      showToast('Gagal mengekspor nilai rapor semua mapel.', 'error');
    }
  };

  const handleExportExamAllExcel = async () => {
    try {
      const response = await api.get('/grades/exams/export-all', { responseType: 'blob' });
      const fileName = `ekspor_nilai_ujian_semua_mapel.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('Ekspor nilai ujian semua mapel berhasil diunduh.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal mengekspor nilai ujian semua mapel.', 'error');
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
            Kalkulasi nilai akhir kelulusan (Rata-rata Rapor {data?.weight?.reportPercentage || 60}% dari Semester {data?.weight?.activeSemesters || '7,8,9,10,11'} & Ujian Madrasah {data?.weight?.examPercentage || 40}%).
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportReportAllExcel}
            className="px-4 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-900/60 rounded-xl text-xs font-semibold text-emerald-455 flex items-center gap-2 cursor-pointer transition-all duration-200"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Rapor (Semua Mapel)</span>
          </button>

          <button
            onClick={handleExportExamAllExcel}
            className="px-4 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-900/60 rounded-xl text-xs font-semibold text-emerald-455 flex items-center gap-2 cursor-pointer transition-all duration-200"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Ujian (Semua Mapel)</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Excel Rekap</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-md shadow-indigo-600/10 disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span>{isDownloading ? 'Memproses PDF...' : 'Unduh PDF'}</span>
          </button>
        </div>
      </div>

      {/* Recap details card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl print:bg-white print:border-none print:shadow-none print:p-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-200">Rincian Nilai Akhir</h3>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] font-semibold text-slate-455">
            Formula: Rapor {data?.weight?.reportPercentage || 60}% (Smt {data?.weight?.activeSemesters || '7,8,9,10,11'}) + Ujian {data?.weight?.examPercentage || 40}%
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
                    <th className="py-3 px-4 text-center font-bold text-indigo-400 print:text-black print:border print:border-black">RATA2 BULAT</th>
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
                      <td className="py-3 px-4 text-center font-bold font-mono text-indigo-400 print:text-black print:border print:border-black">
                        {student.averageFinalScore !== undefined && student.averageFinalScore !== null ? Math.round(student.averageFinalScore).toFixed(0) : '0'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono text-amber-400 print:text-black print:border print:border-black">
                        {student.rank !== undefined && student.rank !== null ? student.rank : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
