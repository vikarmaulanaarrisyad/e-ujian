import React, { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { Loader2, UserCheck, X } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface BatchAttendanceParentsDownloaderProps {
  className?: string;
}

export default function BatchAttendanceParentsDownloader({ className }: BatchAttendanceParentsDownloaderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [batchData, setBatchData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Form State
  const [tanggalAcara, setTanggalAcara] = useState('');
  const [waktuAcara, setWaktuAcara] = useState('08.00 WIB - Selesai');
  const [tempatAcara, setTempatAcara] = useState('Aula Madrasah');
  const [agenda, setAgenda] = useState('Pengumuman Kelulusan dan Penyerahan SKL');
  const [paperSize, setPaperSize] = useState<'A4' | 'F4'>('A4');

  // Load from localStorage on mount
  useEffect(() => {
    const savedTgl = localStorage.getItem('dh_tanggalAcara');
    const savedWaktu = localStorage.getItem('dh_waktuAcara');
    const savedTempat = localStorage.getItem('dh_tempatAcara');
    const savedAgenda = localStorage.getItem('dh_agenda');
    const savedPaper = localStorage.getItem('dh_paperSize');
    
    if (savedTgl) setTanggalAcara(savedTgl);
    if (savedWaktu) setWaktuAcara(savedWaktu);
    if (savedTempat) setTempatAcara(savedTempat);
    if (savedAgenda) setAgenda(savedAgenda);
    if (savedPaper) setPaperSize(savedPaper as 'A4' | 'F4');
  }, []);

  // Save to localStorage when values change
  useEffect(() => { localStorage.setItem('dh_tanggalAcara', tanggalAcara); }, [tanggalAcara]);
  useEffect(() => { localStorage.setItem('dh_waktuAcara', waktuAcara); }, [waktuAcara]);
  useEffect(() => { localStorage.setItem('dh_tempatAcara', tempatAcara); }, [tempatAcara]);
  useEffect(() => { localStorage.setItem('dh_agenda', agenda); }, [agenda]);
  useEffect(() => { localStorage.setItem('dh_paperSize', paperSize); }, [paperSize]);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => {
    if (!downloading) setModalOpen(false);
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggalAcara || !waktuAcara || !tempatAcara || !agenda) {
      alert('Mohon lengkapi semua data acara.');
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
        format: paperSize === 'F4' ? [215.9, 330.2] : 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const pages = containerRef.current.querySelectorAll('.attendance-page');
      
      if (pages.length === 0) {
        alert("Tidak ada data siswa untuk di-download.");
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
      
      const fileName = `Daftar_Hadir_Wali_${data.schoolProfile.name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
      pdf.save(fileName);
      
      setModalOpen(false);
    } catch (err) {
      console.error('Error generating batch PDF:', err);
      alert('Terjadi kesalahan saat mengunduh PDF Daftar Hadir.');
    } finally {
      setDownloading(false);
      setBatchData(null); // Clear data to unmount hidden DOM
    }
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

  // Helper untuk mendapatkan chunk dengan algoritma dinamis
  const createChunks = (students: any[], paperSize: 'A4' | 'F4') => {
    if (!students || students.length === 0) return [];
    
    const chunks = [];
    const MAX_ROWS = paperSize === 'F4' ? 42 : 36; // Kapasitas baris maksimal
    const HEADER_COST = 9; // Biaya baris untuk Kop Surat + Detail Acara
    const FOOTER_COST = 6; // Biaya baris untuk Tanda Tangan

    let currentChunk = [];
    let currentCost = HEADER_COST; // Halaman pertama selalu ada header

    for (let i = 0; i < students.length; i++) {
      let isLastStudent = (i === students.length - 1);
      let nextCost = currentCost + 1;
      
      if (isLastStudent) {
        // Cek apakah muat ditambah footer di halaman ini
        if (nextCost + FOOTER_COST <= MAX_ROWS) {
           currentChunk.push(students[i]);
           chunks.push(currentChunk);
           break;
        } else {
           // Tidak muat untuk footer, paksa pindah halaman
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

  const studentChunks = batchData ? createChunks(batchData.students, paperSize) : [];

  const getStartIndex = (chunkIndex: number) => {
    let count = 0;
    for (let i = 0; i < chunkIndex; i++) {
      count += studentChunks[i].length;
    }
    return count;
  };

  const pageWidthMM = paperSize === 'F4' ? 215.9 : 210;
  const pageHeightMM = paperSize === 'F4' ? 330.2 : 297;

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={downloading}
        className={className || "px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-600/10 disabled:opacity-70 disabled:cursor-not-allowed"}
      >
        <UserCheck className="w-4 h-4" />
        Daftar Hadir Wali
      </button>

      {/* Modal Input Detail Rapat */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-400" />
                Cetak Daftar Hadir Wali Murid
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
              <form id="attendance-form" onSubmit={handleDownload} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Agenda Kegiatan <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Tanggal <span className="text-rose-400">*</span></label>
                    <input
                      type="date"
                      value={tanggalAcara}
                      onChange={(e) => setTanggalAcara(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Waktu <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={waktuAcara}
                      onChange={(e) => setWaktuAcara(e.target.value)}
                      placeholder="Misal: 08.00 WIB - Selesai"
                      required
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Tempat Kegiatan <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    value={tempatAcara}
                    onChange={(e) => setTempatAcara(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Ukuran Kertas <span className="text-rose-400">*</span></label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value as 'A4' | 'F4')}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="A4">A4 (210 x 297 mm)</option>
                    <option value="F4">F4 / Folio (215.9 x 330.2 mm)</option>
                  </select>
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
                form="attendance-form"
                disabled={downloading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                {downloading ? 'Memproses PDF...' : 'Download Daftar Hadir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden container for rendering Daftar Hadir pages */}
      {batchData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -9999, pointerEvents: 'none' }}>
          <div ref={containerRef}>
            <style dangerouslySetInnerHTML={{ __html: `
              .attendance-page {
                background: white;
                width: ${pageWidthMM}mm;
                min-height: ${pageHeightMM}mm;
                color: #000;
                font-family: "Times New Roman", Times, serif;
                position: relative;
                box-sizing: border-box;
              }
              .page-inner { padding: 2cm; min-height: ${pageHeightMM}mm; display: flex; flex-direction: column; box-sizing: border-box; }
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
              
              .attendance-title { text-align: center; font-size: 16px; font-weight: bold; margin-top: 24px; margin-bottom: 24px; text-transform: uppercase; text-decoration: underline; }
              
              .event-details-table { margin-bottom: 20px; font-size: 14px; width: 100%; }
              .event-details-table td { padding: 4px 8px; vertical-align: top; }
              .event-label { font-weight: bold; width: 110px; white-space: nowrap; }
              .event-sep { width: 10px; text-align: center; }
              
              .student-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
              .student-table th, .student-table td { border: 1px solid #000; padding: 6px 8px; vertical-align: middle; }
              .student-table th { background-color: #f8f9fa; font-weight: bold; text-align: center; padding: 10px 8px; }
              .col-no { width: 40px; text-align: center; }
              
              .signatures-wrap { margin-top: 40px; display: flex; justify-content: flex-end; padding-right: 20px; }
              .ttd-block { text-align: left; width: 250px; font-size: 15px; line-height: 1.6; position: relative; }
              .ttd-space { height: 80px; display: flex; align-items: center; justify-content: flex-start; position: relative; z-index: 10; margin-left: -10px; }
              .ttd-name { font-weight: bold; text-decoration: underline; letter-spacing: 0.5px; }
            `}} />
            
            {studentChunks.map((chunk, chunkIndex) => {
              const startIndex = getStartIndex(chunkIndex);
              
              return (
                <div key={chunkIndex} className="attendance-page">
                  <div className="page-inner">
                    {/* Kop Surat & Detail Acara hanya di halaman pertama */}
                    {chunkIndex === 0 && (
                      <>
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

                  <div className="attendance-title">
                    DAFTAR HADIR WALI MURID
                  </div>

                  <table className="event-details-table">
                    <tbody>
                      <tr>
                        <td className="event-label">Agenda</td>
                        <td className="event-sep">:</td>
                        <td>{agenda}</td>
                        <td className="event-label">Hari/Tanggal</td>
                        <td className="event-sep">:</td>
                        <td>{formatTanggalFormal(tanggalAcara)}</td>
                      </tr>
                      <tr>
                        <td className="event-label">Waktu</td>
                        <td className="event-sep">:</td>
                        <td>{waktuAcara}</td>
                        <td className="event-label">Tempat</td>
                        <td className="event-sep">:</td>
                        <td>{tempatAcara}</td>
                      </tr>
                    </tbody>
                  </table>
                  </>
                )}

                <table className="student-table" style={chunkIndex > 0 ? { marginTop: '20px' } : {}}>
                  <thead>
                    <tr>
                        <th className="col-no">No</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>NISN</th>
                        <th style={{ textAlign: 'left' }}>Nama Siswa</th>
                        <th style={{ textAlign: 'left', width: '180px' }}>Nama Wali Murid</th>
                        <th colSpan={2} style={{ textAlign: 'center', width: '160px' }}>Tanda Tangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunk.map((student: any, idx: number) => {
                        const globalIndex = startIndex + idx + 1;
                        const isEven = globalIndex % 2 === 0;
                        return (
                          <tr key={student.id}>
                            <td className="col-no">{globalIndex}</td>
                            <td style={{ textAlign: 'center', fontWeight: '500' }}>{student.nisn || '-'}</td>
                            <td style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{student.name}</td>
                            <td>................................................</td>
                            <td style={{ width: '80px', height: '36px', borderRight: 'none', verticalAlign: 'top', paddingTop: '8px' }}>
                              {!isEven && <span>{globalIndex}. ....................</span>}
                            </td>
                            <td style={{ width: '80px', height: '36px', borderLeft: 'none', verticalAlign: 'bottom', paddingBottom: '8px' }}>
                              {isEven && <span>{globalIndex}. ....................</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Tanda tangan Kepala Madrasah di bagian bawah halaman terakhir */}
                  {chunkIndex === studentChunks.length - 1 && (
                    <div className="signatures-wrap">
                      <div className="ttd-block">
                        <p>{batchData.schoolProfile.city || 'Bondowoso'}, {formatTanggalFormal(tanggalAcara).split(', ')[1]}</p>
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
