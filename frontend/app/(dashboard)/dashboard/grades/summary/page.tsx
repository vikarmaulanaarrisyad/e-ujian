'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Download, FileText, Loader2, BookOpenCheck, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';

interface StudentSummary {
  studentId: string;
  nis: string;
  nisn: string;
  studentName: string;
  gender: string;
  tkaTotal?: number;
  tkaScores?: Record<string, number>;
  tkaAverage: number;
  examTotal?: number;
  examAverage: number;
  examAverageRounded: number;
  subjectScores?: Record<string, number>;
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
  const [isDownloadingRankingUM, setIsDownloadingRankingUM] = useState(false);
  const [isDownloadingSummaryUM, setIsDownloadingSummaryUM] = useState(false);

  // Table States
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = React.useMemo<ColumnDef<StudentSummary>[]>(
    () => [
      {
        id: 'no',
        header: 'No',
        cell: (info) => <span className="text-slate-450">{info.row.index + 1}</span>,
        enableSorting: false,
      },
      {
        accessorKey: 'nis',
        header: 'NIS',
        cell: (info) => <span className="font-mono text-slate-450">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'studentName',
        header: 'Nama Lengkap',
        cell: (info) => <span className="font-bold text-slate-205">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'gender',
        header: 'L/P',
        cell: (info) => <div className="text-center w-full">{info.getValue() as string}</div>,
      },
      {
        accessorKey: 'tkaAverage',
        header: () => <div className="text-center w-full font-bold text-emerald-400">Rata-rata TKA</div>,
        cell: (info) => (
          <div className="text-center w-full font-bold font-mono text-emerald-400">
            {(info.getValue() as number).toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: 'examAverage',
        header: () => <div className="text-center w-full font-bold text-indigo-400">Rata-rata UM</div>,
        cell: (info) => (
          <div className="text-center w-full font-bold font-mono text-indigo-400">
            {(info.getValue() as number).toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: 'examAverageRounded',
        header: () => <div className="text-center w-full font-bold text-indigo-400">Rata-rata UM (Bulat)</div>,
        cell: (info) => (
          <div className="text-center w-full font-bold font-mono text-indigo-400">
            {info.getValue() as number}
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: data?.summary || [],
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleDownloadPDF = async () => {
    if (!data?.summary || data.summary.length === 0) {
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
      doc.text(data?.schoolProfile?.foundationName?.toUpperCase() || data?.schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN", pageWidth / 2, 14, { align: 'center' });
      
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
      doc.text('LAPORAN SUMMARY TKA', pageWidth / 2, 48, { align: 'center' });
      
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(`Tahun Pelajaran: ${data?.academicYear?.year || '...'} | Semester: ${data?.academicYear?.semester === 'EVEN' ? 'GENAP' : 'GANJIL'}`, pageWidth / 2, 54, { align: 'center' });
      
      // Prepare Table Data
      const tkaSubjects = data?.tkaSubjects || [];
      const headers = [
        'No', 'NIS', 'Nama Lengkap', 'L/P',
        ...tkaSubjects.map((s: string) => s.replace(/_/g, ' ')),
        'Jumlah TKA', 'Rata-rata TKA'
      ];
      
      const body = data.summary.map((student: StudentSummary, index: number) => {
        const rowData: any[] = [
          index + 1,
          student.nis,
          student.studentName,
          student.gender,
        ];
        
        tkaSubjects.forEach((subjType: string) => {
          const score = student.tkaScores?.[subjType];
          rowData.push(score !== undefined ? score.toFixed(2).replace('.', ',') : '-');
        });
        
        rowData.push(
          student.tkaTotal !== undefined ? student.tkaTotal.toFixed(2).replace('.', ',') : '-',
          student.tkaAverage.toFixed(2).replace('.', ',')
        );
        
        return rowData;
      });

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
      const fileName = `Summary_TKA_${data?.academicYear?.year ? data.academicYear.year.replace('/', '_') : 'summary'}.pdf`;
      doc.save(fileName);
      showToast('PDF berhasil diunduh.', 'success');
      
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat menggenerate PDF.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadRankingUM_PDF = async () => {
    if (!data?.summary || data.summary.length === 0) {
      showToast('Tidak ada data untuk diunduh', 'error');
      return;
    }
    
    setIsDownloadingRankingUM(true);
    
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
      doc.text(data?.schoolProfile?.foundationName?.toUpperCase() || data?.schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN", pageWidth / 2, 14, { align: 'center' });
      
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
      doc.text('RANKING UJIAN MADRASAH', pageWidth / 2, 48, { align: 'center' });
      
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(`Tahun Pelajaran: ${data?.academicYear?.year || '...'} | Semester: ${data?.academicYear?.semester === 'EVEN' ? 'GENAP' : 'GANJIL'}`, pageWidth / 2, 54, { align: 'center' });
      
      // Prepare Table Data
      const subjects = data?.subjects || [];
      const headers = [
        'Peringkat', 'NIS', 'Nama Lengkap', 'L/P',
        ...subjects.map((s: any) => s.code),
        'Jumlah', 'Rata-rata UM', 'Rata-rata UM (Bulat)'
      ];
      
      const sortedSummary = [...data.summary].sort((a: StudentSummary, b: StudentSummary) => b.examAverage - a.examAverage);

      const body = sortedSummary.map((student: StudentSummary, index: number) => {
        const rowData: any[] = [
          index + 1,
          student.nis,
          student.studentName,
          student.gender,
        ];

        subjects.forEach((subj: any) => {
          rowData.push(student.subjectScores?.[subj.id] ?? '-');
        });

        rowData.push(
          student.examTotal ?? '-',
          student.examAverage.toFixed(2),
          student.examAverageRounded
        );

        return rowData;
      });

      // Draw Table
      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 60,
        theme: 'grid',
        styles: { font: 'times', fontSize: 7, textColor: 0, halign: 'center' },
        headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          2: { halign: 'left', cellWidth: 40 }, // Nama Lengkap
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
      const fileName = `Ranking_UM_${data?.academicYear?.year ? data.academicYear.year.replace('/', '_') : 'summary'}.pdf`;
      doc.save(fileName);
      showToast('Ranking UM PDF berhasil diunduh.', 'success');
      
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat menggenerate PDF Ranking UM.', 'error');
    } finally {
      setIsDownloadingRankingUM(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/grades/summary/export', { responseType: 'blob' });
      const fileName = `summary_tka_${data?.academicYear?.year ? data.academicYear.year.replace('/', '_') : 'summary'}.xlsx`;

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

  const handleExportRankingUM_Excel = async () => {
    try {
      const response = await api.get('/grades/summary/export?ranking=UM', { responseType: 'blob' });
      const fileName = `ranking_um_${data?.academicYear?.year ? data.academicYear.year.replace('/', '_') : 'summary'}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('Berhasil mengunduh Ranking UM ke Excel.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal mengekspor Ranking UM.', 'error');
    }
  };

  const handleDownloadSummaryUM_PDF = async () => {
    try {
      setIsDownloadingSummaryUM(true);
      
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
      doc.text(data?.schoolProfile?.foundationName?.toUpperCase() || data?.schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN", pageWidth / 2, 14, { align: 'center' });
      
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
      doc.text('SUMMARY UJIAN MADRASAH', pageWidth / 2, 48, { align: 'center' });
      
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(`Tahun Pelajaran: ${data?.academicYear?.year || '...'} | Semester: ${data?.academicYear?.semester === 'EVEN' ? 'GENAP' : 'GANJIL'}`, pageWidth / 2, 54, { align: 'center' });
      
      // Prepare Table Data
      const subjects = data?.subjects || [];
      const headers = [
        'NIS', 'Nama Lengkap', 'L/P',
        ...subjects.map((s: any) => s.code),
        'Jumlah', 'Rata-rata UM', 'Rata-rata UM (Bulat)'
      ];
      
      const sortedSummary = [...data.summary].sort((a: StudentSummary, b: StudentSummary) => a.studentName.localeCompare(b.studentName));

      const body = sortedSummary.map((student: StudentSummary) => {
        const rowData: any[] = [
          student.nis,
          student.studentName,
          student.gender,
        ];

        subjects.forEach((subj: any) => {
          rowData.push(student.subjectScores?.[subj.id] ?? '-');
        });

        rowData.push(
          student.examTotal ?? '-',
          student.examAverage.toFixed(2),
          student.examAverageRounded
        );

        return rowData;
      });

      // Draw Table
      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 60,
        theme: 'grid',
        styles: { font: 'times', fontSize: 7, textColor: 0, halign: 'center' },
        headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          1: { halign: 'left', cellWidth: 40 }, // Nama Lengkap
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
      const fileName = `Summary_UM_${data?.academicYear?.year ? data.academicYear.year.replace('/', '_') : 'summary'}.pdf`;
      doc.save(fileName);
      showToast('Summary UM PDF berhasil diunduh.', 'success');
      
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat menggenerate PDF Summary UM.', 'error');
    } finally {
      setIsDownloadingSummaryUM(false);
    }
  };

  const handleExportSummaryUM_Excel = async () => {
    try {
      const response = await api.get('/grades/summary/export?ranking=UM_SUMMARY', { responseType: 'blob' });
      const fileName = `summary_um_${data?.academicYear?.year ? data.academicYear.year.replace('/', '_') : 'summary'}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('Berhasil mengunduh Summary UM ke Excel.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal mengekspor Summary UM.', 'error');
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
          <div className="flex flex-col gap-2 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">TKA</span>
            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-md shadow-emerald-600/10"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-md shadow-indigo-600/10 disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                <span>{isDownloading ? 'Memproses...' : 'PDF'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Summary UM (Abjad)</span>
            <div className="flex gap-2">
              <button
                onClick={handleExportSummaryUM_Excel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-md shadow-emerald-600/10"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={handleDownloadSummaryUM_PDF}
                disabled={isDownloadingSummaryUM}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-md shadow-indigo-600/10 disabled:opacity-50"
              >
                {isDownloadingSummaryUM ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                <span>{isDownloadingSummaryUM ? 'Memproses...' : 'PDF'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Ranking UM (Peringkat)</span>
            <div className="flex gap-2">
              <button
                onClick={handleExportRankingUM_Excel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-md shadow-emerald-600/10"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={handleDownloadRankingUM_PDF}
                disabled={isDownloadingRankingUM}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-md shadow-indigo-600/10 disabled:opacity-50"
              >
                {isDownloadingRankingUM ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                <span>{isDownloadingRankingUM ? 'Memproses...' : 'PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-200">Tabel Summary Nilai</h3>
          </div>
          
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-505">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors"
              placeholder="Cari nama, NIS..."
            />
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
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-800/60">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="bg-slate-900/60 border-b border-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="py-3 px-4">
                          {header.isPlaceholder ? null : (
                            <div
                              className={`flex items-center justify-between gap-1.5 ${
                                header.column.getCanSort() ? 'cursor-pointer select-none hover:text-slate-200' : ''
                              }`}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <span className="text-slate-500 shrink-0">
                                  {{
                                    asc: <ChevronUp className="w-3.5 h-3.5" />,
                                    desc: <ChevronDown className="w-3.5 h-3.5" />,
                                  }[header.column.getIsSorted() as string] ?? <ChevronsUpDown className="w-3.5 h-3.5" />}
                                </span>
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {table.getRowModel().rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-slate-900/30 ${idx % 2 === 0 ? '' : 'bg-slate-900/10'}`}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="py-3 px-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-800/60 text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <span>Tampilkan</span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                >
                  {[5, 10, 20, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
                <span>baris per halaman</span>
              </div>

              <div className="flex items-center gap-4.5">
                <span>
                  Halaman <strong className="text-slate-205">{table.getState().pagination.pageIndex + 1}</strong> dari{' '}
                  <strong className="text-slate-205">{table.getPageCount() || 1}</strong>
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
