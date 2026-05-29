'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Download, FileText, Loader2, BookOpenCheck } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StudentSummary {
  studentId: string;
  nis: string;
  nisn: string;
  studentName: string;
  gender: string;
  tkaAverage: number;
  examAverage: number;
  examAverageRounded: number;
}

export default function GradeSummaryPage() {
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['grades-summary'],
    queryFn: async () => {
      const res = await api.get('/grades/summary');
      return res.data;
    },
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!data?.summary || data.summary.length === 0) {
      showToast('Tidak ada data untuk diunduh', 'error');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = doc.internal.pageSize.width;
      
      // Load logo if available
      let logoData = null;
      if (data?.schoolProfile?.logoUrl) {
        try {
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
      doc.text(data?.schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN", pageWidth / 2, 14, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text(data?.schoolProfile?.name || 'MI BUSTANUL HUDA 01 DAWUHAN', pageWidth / 2, 21, { align: 'center' });
      
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(`TERAKREDITASI A     NPSN : ${data?.schoolProfile?.npsn || '60713609'}    NSM : ${data?.schoolProfile?.nsm || "-"}`, pageWidth / 2, 27, { align: 'center' });
      doc.text(data?.schoolProfile?.address || '-', pageWidth / 2, 32, { align: 'center' });
      
      // KOP Double Line
      doc.setLineWidth(1);
      doc.line(15, 36, pageWidth - 15, 36);
      doc.setLineWidth(0.5);
      doc.line(15, 37.5, pageWidth - 15, 37.5);
      
      // Title
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.text('LAPORAN SUMMARY TKA & UJIAN MADRASAH', pageWidth / 2, 48, { align: 'center' });
      
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(`Tahun Pelajaran: ${data?.academicYear?.year || '...'} | Semester: ${data?.academicYear?.semester === 'EVEN' ? 'GENAP' : 'GANJIL'}`, pageWidth / 2, 54, { align: 'center' });
      
      // Prepare Table Data
      const headers = [
        'No', 'NIS', 'Nama Lengkap', 'L/P',
        'Rata-rata TKA', 'Rata-rata UM', 'Rata-rata UM (Bulat)'
      ];
      
      const body = data.summary.map((student: StudentSummary, index: number) => [
        index + 1,
        student.nis,
        student.studentName,
        student.gender,
        student.tkaAverage.toFixed(2),
        student.examAverage.toFixed(2),
        student.examAverageRounded
      ]);

      // Draw Table
      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 60,
        theme: 'grid',
        styles: { font: 'times', fontSize: 9, textColor: 0, halign: 'center' },
        headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          2: { halign: 'left', cellWidth: 50 }, // Nama Lengkap
        },
        margin: { left: 15, right: 15 },
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
      doc.text('Kepala Madrasah,', pageWidth - 45, signY + 6, { align: 'center' });
      
      doc.text(data?.schoolProfile?.headmaster || '......................', pageWidth - 45, signY + 30, { align: 'center' });
      doc.setFont('times', 'normal');
      doc.text(`NIP. ${data?.schoolProfile?.headmasterNip || '-'}`, pageWidth - 45, signY + 35, { align: 'center' });

      // Save PDF
      const fileName = `Summary_TKA_UM_${data?.academicYear?.year ? data.academicYear.year.replace('/', '_') : 'summary'}.pdf`;
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
      const response = await api.get('/grades/summary/export', { responseType: 'blob' });
      const fileName = `summary_tka_um_${data?.academicYear?.year ? data.academicYear.year.replace('/', '_') : 'summary'}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('Berhasil mengunduh rekap TKA & UM ke Excel.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal mengekspor rekap.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">Summary TKA & UM</h2>
          <p className="text-xs text-slate-450 mt-1">
            Laporan rata-rata nilai Tes Kompetensi Akademik (TKA) dan Ujian Madrasah seluruh siswa.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-md shadow-emerald-600/10"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Excel</span>
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

      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-200">Tabel Summary Nilai</h3>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-505 text-xs">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Memuat data summary...
          </div>
        ) : !data?.summary || data.summary.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            Tidak ada data summary. Pastikan data siswa dan nilai telah diinput.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-450 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4 text-center">L/P</th>
                  <th className="py-3 px-4 text-center font-bold text-emerald-400">Rata-rata TKA</th>
                  <th className="py-3 px-4 text-center font-bold text-indigo-400">Rata-rata UM</th>
                  <th className="py-3 px-4 text-center font-bold text-indigo-400">Rata-rata UM (Bulat)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs text-slate-350">
                {data.summary.map((student: StudentSummary, index: number) => (
                  <tr key={student.studentId} className="hover:bg-slate-900/10">
                    <td className="py-3 px-4 text-slate-450">{index + 1}</td>
                    <td className="py-3 px-4 font-mono text-slate-450">{student.nis}</td>
                    <td className="py-3 px-4 font-bold text-slate-205">{student.studentName}</td>
                    <td className="py-3 px-4 text-center">{student.gender}</td>
                    <td className="py-3 px-4 text-center font-bold font-mono text-emerald-400">
                      {student.tkaAverage.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono text-indigo-400">
                      {student.examAverage.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono text-indigo-400">
                      {student.examAverageRounded}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
