import React, { useState, useRef } from 'react';
import api from '@/lib/api';
import { Loader2, Users, X } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface BatchBeritaAcaraDownloaderProps {
  className?: string;
}

export default function BatchBeritaAcaraDownloader({ className }: BatchBeritaAcaraDownloaderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [batchData, setBatchData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Form State
  const [nomorSurat, setNomorSurat] = useState('');
  const [tanggalAcara, setTanggalAcara] = useState('');
  const [waktuAcara, setWaktuAcara] = useState('08.00 WIB - Selesai');
  const [tempatAcara, setTempatAcara] = useState('Ruang Guru');
  const [jumlahPeserta, setJumlahPeserta] = useState('');
  const [namaNotulen, setNamaNotulen] = useState('');
  const [nipNotulen, setNipNotulen] = useState('');

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => {
    if (!downloading) setModalOpen(false);
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggalAcara || !waktuAcara || !tempatAcara || !jumlahPeserta || !namaNotulen) {
      alert('Mohon lengkapi data yang wajib diisi (*).');
      return;
    }

    try {
      setDownloading(true);
      
      // 1. Fetch data
      const res = await api.get('/documents/skl-batch');
      const data = res.data;
      setBatchData(data);
      
      // Give React a moment to render the hidden DOM elements (especially tables)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!containerRef.current) {
        throw new Error("Container not found");
      }

      // 2. Generate PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const pages = containerRef.current.querySelectorAll('.berita-acara-page');
      
      if (pages.length === 0) {
        alert("Tidak ada data siswa lulus untuk di-download.");
        setDownloading(false);
        setBatchData(null);
        return;
      }
      
      for (let i = 0; i < pages.length; i++) {
        const element = pages[i] as HTMLElement;
        
        const imgData = await toJpeg(element, {
          cacheBust: true,
          backgroundColor: '#ffffff',
          pixelRatio: 2, 
          quality: 0.85,  
          style: {
            margin: '0',
            transform: 'none',
          }
        });
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
      
      const fileName = `Berita_Acara_Kelulusan_${data.schoolProfile.name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
      pdf.save(fileName);
      
      setModalOpen(false);
    } catch (err) {
      console.error('Error generating batch PDF:', err);
      alert('Terjadi kesalahan saat mengunduh PDF Berita Acara.');
    } finally {
      setDownloading(false);
      setBatchData(null); // Clear data to unmount hidden DOM
    }
  };

  const formatTanggalHariIni = () => {
    return new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const formatTanggalFormal = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
    });
  };

  // Helper untuk mendapatkan chunk
  const chunkArray = (array: any[], size: number) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  };

  const createStudentChunks = (students: any[]) => {
    if (!students || students.length === 0) return [];
    const chunks = [];
    const MAX_ROWS = 40;
    const HEADER_COST = 6;
    const FOOTER_COST = 6;
    
    let currentChunk = [];
    let currentCost = HEADER_COST;
    
    for (let i = 0; i < students.length; i++) {
      let isLast = (i === students.length - 1);
      let nextCost = currentCost + 1;
      
      if (isLast) {
        if (nextCost + FOOTER_COST <= MAX_ROWS) {
           currentChunk.push(students[i]);
           chunks.push(currentChunk);
           break;
        } else {
           chunks.push(currentChunk);
           chunks.push([students[i]]); 
           break;
        }
      }
      if (nextCost <= MAX_ROWS) {
        currentChunk.push(students[i]);
        currentCost = nextCost;
      } else {
        chunks.push(currentChunk);
        currentChunk = [students[i]];
        currentCost = 1; 
      }
    }
    return chunks;
  };

  const createAttendanceChunks = (rows: number[]) => {
    if (!rows || rows.length === 0) return [];
    const chunks = [];
    const MAX_ROWS = 28;
    const HEADER_COST = 6;
    const FOOTER_COST = 5;
    
    let currentChunk = [];
    let currentCost = HEADER_COST;
    
    for (let i = 0; i < rows.length; i++) {
      let isLast = (i === rows.length - 1);
      let nextCost = currentCost + 1;
      
      if (isLast) {
        if (nextCost + FOOTER_COST <= MAX_ROWS) {
           currentChunk.push(rows[i]);
           chunks.push(currentChunk);
           break;
        } else {
           chunks.push(currentChunk);
           chunks.push([rows[i]]); 
           break;
        }
      }
      if (nextCost <= MAX_ROWS) {
        currentChunk.push(rows[i]);
        currentCost = nextCost;
      } else {
        chunks.push(currentChunk);
        currentChunk = [rows[i]];
        currentCost = 1; 
      }
    }
    return chunks;
  };

  const studentChunks = batchData ? createStudentChunks(batchData.students) : [];
  
  const numPeserta = parseInt(jumlahPeserta) || 0;
  const attendanceRows = Array.from({ length: numPeserta }, (_, i) => i + 1);
  const attendanceChunks = createAttendanceChunks(attendanceRows);

  const getStartIndex = (chunks: any[][], chunkIndex: number) => {
    let count = 0;
    for (let i = 0; i < chunkIndex; i++) {
      count += chunks[i].length;
    }
    return count;
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={downloading}
        className={className || "px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-70 disabled:cursor-not-allowed"}
      >
        <Users className="w-4 h-4" />
        Berita Acara Rapat
      </button>

      {/* Modal Input Detail Rapat */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Cetak Berita Acara Rapat
              </h3>
              <button
                onClick={handleCloseModal}
                disabled={downloading}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <form id="berita-acara-form" onSubmit={handleDownload} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Nomor Surat (Opsional)</label>
                  <input
                    type="text"
                    value={nomorSurat}
                    onChange={(e) => setNomorSurat(e.target.value)}
                    placeholder="Contoh: 045/MI.BH/2026"
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Tanggal Rapat <span className="text-rose-400">*</span></label>
                    <input
                      type="date"
                      value={tanggalAcara}
                      onChange={(e) => setTanggalAcara(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Waktu Rapat <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={waktuAcara}
                      onChange={(e) => setWaktuAcara(e.target.value)}
                      placeholder="Misal: 08.00 WIB - Selesai"
                      required
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Tempat Rapat <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={tempatAcara}
                      onChange={(e) => setTempatAcara(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Peserta Hadir (Orang) <span className="text-rose-400">*</span></label>
                    <input
                      type="number"
                      value={jumlahPeserta}
                      onChange={(e) => setJumlahPeserta(e.target.value)}
                      required
                      placeholder="Misal: 15"
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Nama Notulis / Sekretaris <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={namaNotulen}
                      onChange={(e) => setNamaNotulen(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">NIP Notulis (Opsional)</label>
                    <input
                      type="text"
                      value={nipNotulen}
                      onChange={(e) => setNipNotulen(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={downloading}
                className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                form="berita-acara-form"
                disabled={downloading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-70"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                {downloading ? 'Memproses PDF...' : 'Download PDF Berita Acara'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden container for rendering Berita Acara pages */}
      {batchData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -9999, pointerEvents: 'none' }}>
          <div ref={containerRef}>
            <style dangerouslySetInnerHTML={{ __html: `
              .berita-acara-page {
                background: white;
                width: 210mm;
                min-height: 297mm;
                color: #000;
                font-family: "Times New Roman", Times, serif;
                position: relative;
              }
              .page-inner { padding: 2cm; min-height: 297mm; display: flex; flex-direction: column; }
              .kop-surat-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-family: "Times New Roman", Times, serif; }
              .kop-surat-table td { vertical-align: middle; padding: 0; }
              .kop-logo-td { width: 105px; text-align: left; }
              .kop-logo-td img { width: 95px; height: 95px; object-fit: contain; }
              .kop-logo-placeholder { width: 95px; height: 95px; border: 1.5px dashed #999; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #999; letter-spacing: 1px; text-align: center; line-height: 1.4; }
              .kop-text-td { text-align: center; }
              .kop-text-inner { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
              .kop-right-spacer { width: 105px; }
              .kop-line-yayasan { font-size: 16px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.3; }
              .kop-line-sekolah { font-size: 20px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.2; margin: 2px 0 2px; }
              .kop-line-akreditasi { font-size: 14px; font-weight: bold; letter-spacing: 0.3px; text-transform: uppercase; }
              .kop-line-alamat { font-size: 13px; font-weight: normal; font-style: italic; line-height: 1.4; width: 100%; }
              .kop-divider { margin-top: 2px; }
              .kop-divider-thick { height: 3px; background: #000; margin-bottom: 2px; }
              .kop-divider-thin  { height: 1px; background: #000; }
              
              .ba-title-wrap { text-align: center; margin-top: 24px; margin-bottom: 24px; }
              .ba-title { display: block; font-size: 16px; font-weight: bold; text-transform: uppercase; text-decoration: underline; letter-spacing: 0.5px; margin-bottom: 4px; }
              .ba-nomor { font-size: 14px; }
              
              .ba-body { font-size: 15px; line-height: 1.6; text-align: justify; }
              
              .event-details-table { margin: 16px 0 16px 24px; font-size: 15px; line-height: 1.6; }
              .event-details-table td { padding: 4px 0; vertical-align: top; }
              .event-label-col { width: 140px; }
              .event-sep-col { width: 16px; }
              
              .signatures-wrap { margin-top: 60px; display: flex; justify-content: space-between; padding: 0 20px; }
              .ttd-block { text-align: center; width: 250px; font-size: 15px; line-height: 1.6; position: relative; }
              .ttd-space { height: 80px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 10; }
              .ttd-name { font-weight: bold; text-decoration: underline; letter-spacing: 0.5px; }
              
              .attachment-title { text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
              .student-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
              .student-table th, .student-table td { border: 1px solid #000; padding: 6px 8px; }
              .student-table th { background-color: #f8f9fa; font-weight: bold; text-align: center; }
              .col-no { width: 40px; text-align: center; }
              .col-nisn { width: 120px; text-align: center; }
              .col-name { text-align: left; }
              .col-ket { width: 120px; text-align: center; }
            `}} />
            
            {/* Halaman 1: Berita Acara */}
            <div className="berita-acara-page">
              <div className="page-inner">
                {/* Kop Surat */}
                <table className="kop-surat-table">
                  <tbody>
                    <tr>
                      <td className="kop-logo-td">
                        {batchData.schoolProfile.logoUrl
                          ? <img src={batchData.schoolProfile.logoUrl} alt="Logo" crossOrigin="anonymous" />
                          : <div className="kop-logo-placeholder">LOGO<br/>MADRASAH</div>
                        }
                      </td>
                      <td className="kop-text-td">
                        <div className="kop-text-inner">
                          <span className="kop-line-yayasan">{batchData.schoolProfile?.foundationName?.toUpperCase() || batchData.schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN"}</span>
                          <span className="kop-line-sekolah">{batchData.schoolProfile.name || 'MADRASAH IBTIDAIYAH BUSTANUL HUDA 01 DAWUHAN'}</span>
                          <span className="kop-line-akreditasi">
                            TERAKREDITASI A NSM {batchData.schoolProfile.nsm || '111233280040'} NPSN {batchData.schoolProfile.npsn || '60713609'}
                          </span>
                          <span className="kop-line-alamat">{batchData.schoolProfile.address}</span>
                        </div>
                      </td>
                      <td className="kop-right-spacer"></td>
                    </tr>
                  </tbody>
                </table>
                <div className="kop-divider">
                  <div className="kop-divider-thick" />
                  <div className="kop-divider-thin" />
                </div>
                
                {/* Header Berita Acara */}
                <div className="ba-title-wrap">
                  <span className="ba-title">BERITA ACARA RAPAT KELULUSAN SISWA</span>
                  <span className="ba-nomor">Nomor: {nomorSurat || '........................'}</span>
                </div>

                {/* Isi Berita Acara */}
                <div className="ba-body">
                  <p>
                    Pada hari ini, <strong>{new Date(tanggalAcara).toLocaleDateString('id-ID', { weekday: 'long' })}</strong> tanggal <strong>{new Date(tanggalAcara).getDate()}</strong> bulan <strong>{new Date(tanggalAcara).toLocaleDateString('id-ID', { month: 'long' })}</strong> tahun <strong>{new Date(tanggalAcara).getFullYear()}</strong>, kami yang bertanda tangan di bawah ini:
                  </p>
                  
                  <table className="event-details-table">
                    <tbody>
                      <tr>
                        <td className="event-label-col">Waktu</td>
                        <td className="event-sep-col">:</td>
                        <td>{waktuAcara}</td>
                      </tr>
                      <tr>
                        <td className="event-label-col">Tempat</td>
                        <td className="event-sep-col">:</td>
                        <td>{tempatAcara}</td>
                      </tr>
                      <tr>
                        <td className="event-label-col">Acara</td>
                        <td className="event-sep-col">:</td>
                        <td>Rapat Pleno Penentuan Kelulusan Peserta Didik Tahun Pelajaran {batchData.academicYear}</td>
                      </tr>
                      <tr>
                        <td className="event-label-col">Hadir Sebanyak</td>
                        <td className="event-sep-col">:</td>
                        <td>{jumlahPeserta} Orang (Daftar Hadir Terlampir)</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <p style={{ marginTop: '16px' }}>
                    Telah melaksanakan rapat pleno penentuan kelulusan siswa {batchData.schoolProfile.name || 'Madrasah'} Tahun Pelajaran {batchData.academicYear}. 
                  </p>
                  <p style={{ marginTop: '16px' }}>
                    Berdasarkan hasil kriteria kelulusan peserta didik, penyelesaian seluruh program pembelajaran, perolehan nilai sikap/perilaku minimal baik, dan lulus ujian madrasah, maka Rapat Pleno Dewan Guru memutuskan menetapkan kelulusan peserta didik sebagaimana terlampir pada Lampiran Berita Acara ini.
                  </p>
                  <p style={{ marginTop: '16px' }}>
                    Terdapat sejumlah <strong>{batchData.students.length}</strong> peserta didik yang dinyatakan <strong>LULUS</strong> pada tahun ajaran ini.
                  </p>
                  <p style={{ marginTop: '16px' }}>
                    Demikian Berita Acara Rapat Kelulusan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
                  </p>
                </div>

                {/* Tanda Tangan */}
                <div className="signatures-wrap">
                  <div className="ttd-block">
                    <p>Mengetahui,</p>
                    <p>Notulis / Sekretaris</p>
                    <div className="ttd-space" />
                    <p className="ttd-name">{namaNotulen}</p>
                    <p>NIP. {nipNotulen || '–'}</p>
                  </div>
                  <div className="ttd-block">
                    <p>{batchData.schoolProfile.city || 'Bondowoso'}, {formatTanggalFormal(tanggalAcara).split(', ')[1] || formatTanggalHariIni()}</p>
                    <p>Kepala Madrasah,</p>
                    <div className="ttd-space">
                      {batchData.schoolProfile.signatureUrl && (
                        <img src={batchData.schoolProfile.signatureUrl} alt="Tanda Tangan" style={{ height: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
                      )}
                    </div>
                    <p className="ttd-name">{batchData.schoolProfile.headmaster}</p>
                    <p>NIP. {batchData.schoolProfile.headmasterNip || '–'}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Halaman 2+: Lampiran Daftar Siswa Lulus */}
            {studentChunks.map((chunk, chunkIndex) => {
              const startIndex = getStartIndex(studentChunks, chunkIndex);
              
              return (
              <div key={chunkIndex} className="berita-acara-page">
                <div className="page-inner">
                  {chunkIndex === 0 && (
                    <div className="attachment-title">
                      LAMPIRAN BERITA ACARA RAPAT PENENTUAN KELULUSAN<br/>
                      TENTANG KELULUSAN PESERTA DIDIK TAHUN PELAJARAN {batchData.academicYear}<br/>
                      {batchData.schoolProfile.name || 'MADRASAH IBTIDAIYAH BUSTANUL HUDA 01 DAWUHAN'}
                    </div>
                  )}

                  <table className="student-table" style={chunkIndex > 0 ? { marginTop: '20px' } : {}}>
                    <thead>
                      <tr>
                        <th className="col-no">No</th>
                        <th className="col-nisn">NISN</th>
                        <th className="col-name">Nama Peserta Didik</th>
                        <th className="col-ket">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunk.map((student: any, idx: number) => {
                        const globalIndex = startIndex + idx + 1;
                        return (
                          <tr key={student.id}>
                            <td className="col-no">{globalIndex}</td>
                            <td className="col-nisn">{student.nisn}</td>
                            <td className="col-name" style={{ textTransform: 'uppercase' }}>{student.name}</td>
                            <td className="col-ket font-bold">LULUS</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Tanda tangan Kepala Madrasah di bagian bawah halaman lampiran (opsional, tapi sering diminta) */}
                  {chunkIndex === studentChunks.length - 1 && (
                    <div className="signatures-wrap" style={{ marginTop: '40px' }}>
                      <div className="ttd-block"></div>
                      <div className="ttd-block">
                        <p>Kepala Madrasah,</p>
                        <div className="ttd-space">
                          {batchData.schoolProfile.signatureUrl && (
                            <img src={batchData.schoolProfile.signatureUrl} alt="Tanda Tangan" style={{ height: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
                          )}
                        </div>
                        <p className="ttd-name">{batchData.schoolProfile.headmaster}</p>
                        <p>NIP. {batchData.schoolProfile.headmasterNip || '–'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

            {/* Halaman 3+: Lampiran Daftar Hadir */}
            {attendanceChunks.map((chunk, chunkIndex) => (
              <div key={`attendance-${chunkIndex}`} className="berita-acara-page">
                <div className="page-inner">
                  {chunkIndex === 0 && (
                    <>
                      <div className="attachment-title">
                        DAFTAR HADIR RAPAT PLENO PENENTUAN KELULUSAN<br/>
                        TAHUN PELAJARAN {batchData.academicYear}<br/>
                        {batchData.schoolProfile.name || 'MADRASAH IBTIDAIYAH BUSTANUL HUDA 01 DAWUHAN'}
                      </div>
                      
                      <div style={{ display: 'flex', justifyItems: 'center', gap: '40px', marginBottom: '16px', fontSize: '14px' }}>
                        <div style={{ flex: 1 }}><strong>Hari / Tanggal:</strong> {formatTanggalFormal(tanggalAcara)}</div>
                        <div style={{ flex: 1 }}><strong>Waktu:</strong> {waktuAcara}</div>
                        <div style={{ flex: 1 }}><strong>Tempat:</strong> {tempatAcara}</div>
                      </div>
                    </>
                  )}

                  <table className="student-table" style={chunkIndex > 0 ? { marginBottom: '0', marginTop: '20px' } : { marginBottom: '0' }}>
                    <thead>
                      <tr>
                        <th className="col-no">No</th>
                        <th style={{ textAlign: 'left', width: '250px' }}>Nama Lengkap</th>
                        <th style={{ textAlign: 'left', width: '150px' }}>Jabatan</th>
                        <th colSpan={2} style={{ textAlign: 'center', width: '200px' }}>Tanda Tangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunk.map((rowNum: number) => {
                        const isEven = rowNum % 2 === 0;
                        return (
                          <tr key={rowNum}>
                            <td className="col-no">{rowNum}</td>
                            <td></td>
                            <td></td>
                            <td style={{ width: '100px', height: '35px', borderRight: 'none', verticalAlign: 'top', paddingTop: '6px' }}>
                              {!isEven && <span>{rowNum}. ....................</span>}
                            </td>
                            <td style={{ width: '100px', height: '35px', borderLeft: 'none', verticalAlign: 'bottom', paddingBottom: '6px' }}>
                              {isEven && <span>{rowNum}. ....................</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Tanda tangan Kepala Madrasah di bagian bawah halaman lampiran */}
                  {chunkIndex === attendanceChunks.length - 1 && (
                    <div className="signatures-wrap" style={{ marginTop: '40px' }}>
                      <div className="ttd-block"></div>
                      <div className="ttd-block">
                        <p>Kepala Madrasah,</p>
                        <div className="ttd-space">
                          {batchData.schoolProfile.signatureUrl && (
                            <img src={batchData.schoolProfile.signatureUrl} alt="Tanda Tangan" style={{ height: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
                          )}
                        </div>
                        <p className="ttd-name">{batchData.schoolProfile.headmaster}</p>
                        <p>NIP. {batchData.schoolProfile.headmasterNip || '–'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

          </div>
        </div>
      )}
    </>
  );
}
