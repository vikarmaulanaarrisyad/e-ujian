import React, { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { Loader2, FileCheck, X } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface BatchSkKelulusanDownloaderProps {
  className?: string;
}

export default function BatchSkKelulusanDownloader({ className }: BatchSkKelulusanDownloaderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [batchData, setBatchData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Form State
  const [nomorSurat, setNomorSurat] = useState('');
  const [tanggalDitetapkan, setTanggalDitetapkan] = useState('');
  const [tanggalRapat, setTanggalRapat] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const savedNomor = localStorage.getItem('sk_nomorSurat');
    const savedTglDitetapkan = localStorage.getItem('sk_tanggalDitetapkan');
    const savedTglRapat = localStorage.getItem('sk_tanggalRapat');
    if (savedNomor) setNomorSurat(savedNomor);
    if (savedTglDitetapkan) setTanggalDitetapkan(savedTglDitetapkan);
    if (savedTglRapat) setTanggalRapat(savedTglRapat);
  }, []);

  // Save to localStorage when values change
  useEffect(() => {
    localStorage.setItem('sk_nomorSurat', nomorSurat);
  }, [nomorSurat]);

  useEffect(() => {
    localStorage.setItem('sk_tanggalDitetapkan', tanggalDitetapkan);
  }, [tanggalDitetapkan]);

  useEffect(() => {
    localStorage.setItem('sk_tanggalRapat', tanggalRapat);
  }, [tanggalRapat]);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => {
    if (!downloading) setModalOpen(false);
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggalDitetapkan || !tanggalRapat) {
      alert('Mohon lengkapi Tanggal Ditetapkan dan Tanggal Rapat.');
      return;
    }

    try {
      setDownloading(true);
      
      // 1. Fetch data
      const res = await api.get('/documents/skl-batch');
      const data = res.data;
      setBatchData(data);
      
      // Give React a moment to render the hidden DOM elements
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
      
      const pages = containerRef.current.querySelectorAll('.sk-kelulusan-page');
      
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
      
      const fileName = `SK_Kelulusan_${data.schoolProfile.name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
      pdf.save(fileName);
      
      setModalOpen(false);
    } catch (err) {
      console.error('Error generating batch PDF:', err);
      alert('Terjadi kesalahan saat mengunduh PDF SK Kelulusan.');
    } finally {
      setDownloading(false);
      setBatchData(null); // Clear data to unmount hidden DOM
    }
  };

  const formatTanggalFormal = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
    });
  };

  // Helper untuk mendapatkan chunk dengan algoritma dinamis
  const createChunks = (students: any[]) => {
    if (!students || students.length === 0) return [];
    
    const chunks = [];
    const MAX_ROWS = 40; // Kapasitas baris maksimal untuk A4
    const HEADER_COST = 6; // Biaya baris untuk attachment-title
    const FOOTER_COST = 6; // Biaya baris untuk Tanda Tangan

    let currentChunk = [];
    let currentCost = HEADER_COST; // Halaman pertama lampiran selalu ada header

    for (let i = 0; i < students.length; i++) {
      let isLastStudent = (i === students.length - 1);
      let nextCost = currentCost + 1;
      
      if (isLastStudent) {
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
        currentCost = 1; // Halaman berikutnya tidak ada header
      }
    }
    return chunks;
  };

  const studentChunks = batchData ? createChunks(batchData.students) : [];

  const getStartIndex = (chunkIndex: number) => {
    let count = 0;
    for (let i = 0; i < chunkIndex; i++) {
      count += studentChunks[i].length;
    }
    return count;
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={downloading}
        className={className || "px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-amber-600/10 disabled:opacity-70 disabled:cursor-not-allowed"}
      >
        <FileCheck className="w-4 h-4" />
        SK Kelulusan
      </button>

      {/* Modal Input SK */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                Cetak SK Kelulusan
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
              <form id="sk-kelulusan-form" onSubmit={handleDownload} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Nomor SK (Opsional)</label>
                  <input
                    type="text"
                    value={nomorSurat}
                    onChange={(e) => setNomorSurat(e.target.value)}
                    placeholder="Contoh: 046/MI.BH/2026"
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Tanggal Ditetapkan <span className="text-rose-400">*</span></label>
                  <input
                    type="date"
                    value={tanggalDitetapkan}
                    onChange={(e) => setTanggalDitetapkan(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all [color-scheme:dark]"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Tanggal Rapat Kelulusan <span className="text-rose-400">*</span></label>
                  <input
                    type="date"
                    value={tanggalRapat}
                    onChange={(e) => setTanggalRapat(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all [color-scheme:dark]"
                  />
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
                form="sk-kelulusan-form"
                disabled={downloading}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-600/20 disabled:opacity-70"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                {downloading ? 'Memproses PDF...' : 'Download PDF SK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden container for rendering SK pages */}
      {batchData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -9999, pointerEvents: 'none' }}>
          <div ref={containerRef}>
            <style dangerouslySetInnerHTML={{ __html: `
              .sk-kelulusan-page {
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
              
              .sk-title-wrap { text-align: center; margin-top: 20px; margin-bottom: 20px; }
              .sk-title { display: block; font-size: 15px; font-weight: bold; text-transform: uppercase; line-height: 1.3; }
              .sk-nomor { font-size: 14px; font-weight: normal; }
              
              .sk-body { font-size: 14px; line-height: 1.5; text-align: justify; }
              .sk-section { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
              .sk-section td { vertical-align: top; padding: 2px 0; }
              .sk-label-col { width: 120px; font-weight: bold; }
              .sk-sep-col { width: 15px; text-align: center; }
              .sk-content-col { padding-left: 5px; }
              
              .sk-list { padding-left: 20px; margin: 0; }
              .sk-list li { margin-bottom: 4px; text-align: justify; }
              
              .signatures-wrap { margin-top: 40px; display: flex; justify-content: flex-end; padding: 0 20px; }
              .ttd-block { text-align: left; width: 250px; font-size: 15px; line-height: 1.6; position: relative; }
              .ttd-space { height: 80px; display: flex; align-items: center; justify-content: flex-start; position: relative; z-index: 10; margin-left: -10px; }
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
            
            {/* Halaman 1: SK Kelulusan */}
            <div className="sk-kelulusan-page">
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
                
                {/* Header SK */}
                <div className="sk-title-wrap">
                  <span className="sk-title">KEPUTUSAN KEPALA {batchData.schoolProfile.name?.toUpperCase() || 'MADRASAH'}</span>
                  <span className="sk-nomor">Nomor: {nomorSurat || '........................'}</span>
                  <br/>
                  <span className="sk-title">TENTANG</span>
                  <span className="sk-title">PENETAPAN KELULUSAN PESERTA DIDIK TAHUN PELAJARAN {batchData.academicYear}</span>
                </div>

                {/* Isi SK */}
                <div className="sk-body">
                  <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '16px' }}>
                    KEPALA {batchData.schoolProfile.name?.toUpperCase() || 'MADRASAH'}
                  </div>

                  <table className="sk-section">
                    <tbody>
                      <tr>
                        <td className="sk-label-col">Menimbang</td>
                        <td className="sk-sep-col">:</td>
                        <td className="sk-content-col">
                          <ol className="sk-list" type="a">
                            <li>Bahwa proses pembelajaran Tahun Pelajaran {batchData.academicYear} telah selesai dilaksanakan;</li>
                            <li>Bahwa untuk memberikan legalitas kelulusan peserta didik, perlu ditetapkan Keputusan Kepala Madrasah tentang Penetapan Kelulusan Peserta Didik Tahun Pelajaran {batchData.academicYear}.</li>
                          </ol>
                        </td>
                      </tr>
                      <tr>
                        <td className="sk-label-col">Mengingat</td>
                        <td className="sk-sep-col">:</td>
                        <td className="sk-content-col">
                          <ol className="sk-list" type="1">
                            <li>Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;</li>
                            <li>Peraturan Pemerintah Nomor 4 Tahun 2022 tentang Perubahan Atas Peraturan Pemerintah Nomor 57 Tahun 2021 tentang Standar Nasional Pendidikan;</li>
                            <li>Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 21 Tahun 2022 tentang Standar Penilaian Pendidikan;</li>
                            <li>Keputusan Direktur Jenderal Pendidikan Islam tentang Prosedur Operasional Standar Penyelenggaraan Ujian Madrasah;</li>
                          </ol>
                        </td>
                      </tr>
                      <tr>
                        <td className="sk-label-col">Memperhatikan</td>
                        <td className="sk-sep-col">:</td>
                        <td className="sk-content-col">
                          Hasil Keputusan Rapat Pleno Dewan Guru {batchData.schoolProfile.name || 'Madrasah'} tanggal {formatTanggalFormal(tanggalRapat)} tentang Penentuan Kelulusan Peserta Didik Tahun Pelajaran {batchData.academicYear}.
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '20px 0 10px 0' }}>
                    MEMUTUSKAN
                  </div>

                  <table className="sk-section">
                    <tbody>
                      <tr>
                        <td className="sk-label-col">Menetapkan</td>
                        <td className="sk-sep-col">:</td>
                        <td className="sk-content-col" style={{ fontWeight: 'bold' }}>
                          KEPUTUSAN KEPALA MADRASAH TENTANG PENETAPAN KELULUSAN PESERTA DIDIK TAHUN PELAJARAN {batchData.academicYear}.
                        </td>
                      </tr>
                      <tr>
                        <td className="sk-label-col">KESATU</td>
                        <td className="sk-sep-col">:</td>
                        <td className="sk-content-col">
                          Menetapkan nama-nama peserta didik yang tercantum dalam lampiran keputusan ini dinyatakan <strong>LULUS</strong> dari satuan pendidikan {batchData.schoolProfile.name || 'Madrasah'}.
                        </td>
                      </tr>
                      <tr>
                        <td className="sk-label-col">KEDUA</td>
                        <td className="sk-sep-col">:</td>
                        <td className="sk-content-col">
                          Peserta didik yang dinyatakan lulus berhak menerima Surat Keterangan Lulus (SKL) dan Ijazah sesuai dengan peraturan perundang-undangan yang berlaku.
                        </td>
                      </tr>
                      <tr>
                        <td className="sk-label-col">KETIGA</td>
                        <td className="sk-sep-col">:</td>
                        <td className="sk-content-col">
                          Keputusan ini mulai berlaku sejak tanggal ditetapkan, dan apabila di kemudian hari terdapat kekeliruan dalam keputusan ini, akan diperbaiki sebagaimana mestinya.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tanda Tangan */}
                <div className="signatures-wrap">
                  <div className="ttd-block">
                    <table style={{ width: '100%', marginBottom: '4px' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '80px' }}>Ditetapkan di</td>
                          <td style={{ width: '10px' }}>:</td>
                          <td>{batchData.schoolProfile.city || 'Bondowoso'}</td>
                        </tr>
                        <tr>
                          <td>Pada tanggal</td>
                          <td>:</td>
                          <td>{formatTanggalFormal(tanggalDitetapkan)}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ borderBottom: '1px solid black', width: '220px', marginBottom: '8px' }}></div>
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
              const startIndex = getStartIndex(chunkIndex);
              
              return (
              <div key={chunkIndex} className="sk-kelulusan-page">
                <div className="page-inner">
                  {chunkIndex === 0 && (
                    <div className="attachment-title" style={{ textAlign: 'left', lineHeight: '1.4' }}>
                      LAMPIRAN KEPUTUSAN KEPALA MADRASAH<br/>
                      NOMOR: {nomorSurat || '........................'}<br/>
                      TANGGAL: {formatTanggalFormal(tanggalDitetapkan)}<br/>
                      TENTANG: PENETAPAN KELULUSAN PESERTA DIDIK TAHUN PELAJARAN {batchData.academicYear}
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
                  
                  {/* Tanda tangan Kepala Madrasah di bagian bawah halaman lampiran terakhir */}
                  {chunkIndex === studentChunks.length - 1 && (
                    <div className="signatures-wrap" style={{ marginTop: '40px' }}>
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

          </div>
        </div>
      )}
    </>
  );
}
