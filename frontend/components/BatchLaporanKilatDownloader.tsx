import React, { useState, useRef, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { Loader2, FileText, X } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface BatchLaporanKilatDownloaderProps {
  className?: string;
}

export default function BatchLaporanKilatDownloader({ className }: BatchLaporanKilatDownloaderProps) {
  const { user } = useAuth();
  const tenantPrefix = user?.tenantId ? `${user.tenantId}_` : '';
  const [modalOpen, setModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Form State
  const [nomorSurat, setNomorSurat] = useState('');
  const [tanggalDitetapkan, setTanggalDitetapkan] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    if (!user?.tenantId) return;
    const savedNomor = localStorage.getItem(`${tenantPrefix}laporankilat_nomorSurat`);
    const savedTglDitetapkan = localStorage.getItem(`${tenantPrefix}laporankilat_tanggalDitetapkan`);
    if (savedNomor) setNomorSurat(savedNomor);
    if (savedTglDitetapkan) setTanggalDitetapkan(savedTglDitetapkan);
    else setTanggalDitetapkan(new Date().toISOString().substring(0, 10)); // Default today
  }, [user?.tenantId, tenantPrefix]);

  // Save to localStorage when values change
  useEffect(() => {
    if (user?.tenantId) localStorage.setItem(`${tenantPrefix}laporankilat_nomorSurat`, nomorSurat);
  }, [nomorSurat, user?.tenantId, tenantPrefix]);

  useEffect(() => {
    if (user?.tenantId) localStorage.setItem(`${tenantPrefix}laporankilat_tanggalDitetapkan`, tanggalDitetapkan);
  }, [tanggalDitetapkan, user?.tenantId, tenantPrefix]);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => {
    if (!downloading) setModalOpen(false);
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggalDitetapkan) {
      alert('Mohon lengkapi Tanggal Pembuatan Surat.');
      return;
    }

    try {
      setDownloading(true);
      
      // 1. Fetch data
      const [studentsRes, schoolRes] = await Promise.all([
        api.get('/students'),
        api.get('/school')
      ]);

      const students = studentsRes.data;
      const schoolProfile = schoolRes.data;

      // Ensure active academic year is fetched
      let academicYear = '2023/2024'; // Fallback
      try {
        const yearRes = await api.get('/academic-years');
        const activeYear = yearRes.data?.find((y: any) => y.isActive);
        if (activeYear?.year) {
          academicYear = activeYear.year;
        }
      } catch (e) {
        console.warn("Failed to fetch active academic year", e);
      }

      // Calculate statistics
      let stats = {
        totalL: 0, totalP: 0, totalAll: 0,
        lulusL: 0, lulusP: 0, lulusAll: 0,
        tidakLulusL: 0, tidakLulusP: 0, tidakLulusAll: 0
      };

      students.forEach((s: any) => {
        const isLaki = s.gender === 'L' || s.gender === 'Laki-laki' || s.gender === 'LAKI-LAKI';
        const isPerempuan = s.gender === 'P' || s.gender === 'Perempuan' || s.gender === 'PEREMPUAN';
        
        stats.totalAll++;
        if (isLaki) stats.totalL++;
        if (isPerempuan) stats.totalP++;

        if (s.isGraduated) {
          stats.lulusAll++;
          if (isLaki) stats.lulusL++;
          if (isPerempuan) stats.lulusP++;
        } else {
          stats.tidakLulusAll++;
          if (isLaki) stats.tidakLulusL++;
          if (isPerempuan) stats.tidakLulusP++;
        }
      });

      setReportData({
        schoolProfile,
        students,
        stats,
        academicYear
      });
      
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
      
      const pages = containerRef.current.querySelectorAll('.laporan-kilat-page');
      
      if (pages.length === 0) {
        alert("Tidak dapat merender laporan.");
        setDownloading(false);
        setReportData(null);
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
      
      const fileName = `Laporan_Kilat_Kelulusan_${schoolProfile.name?.replace(/\s+/g, '_') || 'Sekolah'}_${new Date().getFullYear()}.pdf`;
      pdf.save(fileName);
      
      setModalOpen(false);
    } catch (err) {
      console.error('Error generating laporan kilat:', err);
      alert('Terjadi kesalahan saat mengunduh PDF Laporan Kilat.');
    } finally {
      setDownloading(false);
      setReportData(null); // Clear data to unmount hidden DOM
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

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={downloading}
        className={className || "px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 active:bg-fuchsia-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-fuchsia-600/10 disabled:opacity-70 disabled:cursor-not-allowed"}
      >
        <FileText className="w-4 h-4" />
        Laporan Kilat
      </button>

      {/* Modal Input Laporan Kilat */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-fuchsia-400" />
                Cetak Laporan Kilat
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
              <form id="laporan-kilat-form" onSubmit={handleDownload} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Nomor Surat (Opsional)</label>
                  <input
                    type="text"
                    value={nomorSurat}
                    onChange={(e) => setNomorSurat(e.target.value)}
                    placeholder="Contoh: 047/MI.BH/2026"
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Tanggal Surat <span className="text-rose-400">*</span></label>
                  <input
                    type="date"
                    value={tanggalDitetapkan}
                    onChange={(e) => setTanggalDitetapkan(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all [color-scheme:dark]"
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
                form="laporan-kilat-form"
                disabled={downloading}
                className="px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 active:bg-fuchsia-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-fuchsia-600/20 disabled:opacity-70"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {downloading ? 'Memproses PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden container for rendering pages */}
      {reportData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -9999, pointerEvents: 'none' }}>
          <div ref={containerRef}>
            <style dangerouslySetInnerHTML={{ __html: `
              .laporan-kilat-page {
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
              
              .sk-title-wrap { text-align: center; margin-top: 20px; margin-bottom: 30px; }
              .sk-title { display: block; font-size: 16px; font-weight: bold; text-transform: uppercase; line-height: 1.3; text-decoration: underline; }
              .sk-nomor { font-size: 14px; font-weight: normal; }
              
              .sk-body { font-size: 14px; line-height: 1.5; text-align: justify; margin-bottom: 30px; }
              
              .stat-table { width: 100%; border-collapse: collapse; font-size: 14px; margin: 20px auto; max-width: 500px; }
              .stat-table th, .stat-table td { border: 1px solid #000; padding: 8px 12px; text-align: center; }
              .stat-table th { background-color: #f8f9fa; font-weight: bold; }
              .stat-table td:first-child { text-align: left; font-weight: bold; }
              
              .signatures-wrap { margin-top: 60px; display: flex; justify-content: flex-end; padding: 0 20px; }
              .ttd-block { text-align: left; width: 250px; font-size: 15px; line-height: 1.6; position: relative; }
              .ttd-space { height: 80px; display: flex; align-items: center; justify-content: flex-start; position: relative; z-index: 10; margin-left: -10px; }
              .ttd-name { font-weight: bold; text-decoration: underline; letter-spacing: 0.5px; }
            `}} />
            
            <div className="laporan-kilat-page">
              <div className="page-inner">
                {/* Kop Surat */}
                <table className="kop-surat-table">
                  <tbody>
                    <tr>
                      <td className="kop-logo-td">
                        {reportData.schoolProfile.logoUrl
                          ? <img src={reportData.schoolProfile.logoUrl} alt="Logo" crossOrigin="anonymous" />
                          : <div className="kop-logo-placeholder">LOGO<br/>MADRASAH</div>
                        }
                      </td>
                      <td className="kop-text-td">
                        <div className="kop-text-inner">
                          <span className="kop-line-yayasan">{reportData.schoolProfile?.foundationName?.toUpperCase() || reportData.schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN"}</span>
                          <span className="kop-line-sekolah">{reportData.schoolProfile.name || 'MADRASAH IBTIDAIYAH BUSTANUL HUDA 01 DAWUHAN'}</span>
                          <span className="kop-line-akreditasi">
                            TERAKREDITASI {reportData.schoolProfile.accreditation || 'A'} NSM {reportData.schoolProfile.nsm || '111233280040'} NPSN {reportData.schoolProfile.npsn || '60713609'}
                          </span>
                          <span className="kop-line-alamat">{reportData.schoolProfile.address}</span>
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
                
                {/* Header Laporan */}
                <div className="sk-title-wrap">
                  <span className="sk-title">LAPORAN KILAT KELULUSAN</span>
                  <span className="sk-title" style={{ textDecoration: 'none' }}>TAHUN PELAJARAN {reportData.academicYear}</span>
                  {nomorSurat && <span className="sk-nomor">Nomor: {nomorSurat}</span>}
                </div>

                {/* Isi Laporan */}
                <div className="sk-body">
                  <p style={{ textIndent: '30px' }}>
                    Berdasarkan hasil Rapat Pleno Dewan Guru {reportData.schoolProfile.name || 'Madrasah'} tentang Penentuan Kelulusan Peserta Didik Tahun Pelajaran {reportData.academicYear}, dengan ini kami melaporkan rekapitulasi kelulusan peserta didik kelas akhir sebagai berikut:
                  </p>

                  <table className="stat-table">
                    <thead>
                      <tr>
                        <th rowSpan={2} style={{ verticalAlign: 'middle' }}>Keterangan</th>
                        <th colSpan={3}>Jumlah Peserta Didik</th>
                      </tr>
                      <tr>
                        <th style={{ width: '20%' }}>Laki-laki</th>
                        <th style={{ width: '20%' }}>Perempuan</th>
                        <th style={{ width: '20%' }}>Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Peserta Ujian / Siswa Kelas Akhir</td>
                        <td>{reportData.stats.totalL}</td>
                        <td>{reportData.stats.totalP}</td>
                        <td>{reportData.stats.totalAll}</td>
                      </tr>
                      <tr>
                        <td>Lulus</td>
                        <td>{reportData.stats.lulusL}</td>
                        <td>{reportData.stats.lulusP}</td>
                        <td>{reportData.stats.lulusAll}</td>
                      </tr>
                      <tr>
                        <td>Tidak Lulus</td>
                        <td>{reportData.stats.tidakLulusL}</td>
                        <td>{reportData.stats.tidakLulusP}</td>
                        <td>{reportData.stats.tidakLulusAll}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <p style={{ textIndent: '30px' }}>
                    Demikian Laporan Kilat Kelulusan ini kami buat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
                  </p>
                </div>

                {/* Tanda Tangan */}
                <div className="signatures-wrap">
                  <div className="ttd-block">
                    <table style={{ width: '100%', marginBottom: '4px' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '90px', whiteSpace: 'nowrap' }}>Dibuat di</td>
                          <td style={{ width: '10px' }}>:</td>
                          <td>{reportData.schoolProfile.city || 'Bondowoso'}</td>
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
                      {reportData.schoolProfile.signatureUrl && (
                        <img src={reportData.schoolProfile.signatureUrl} alt="Tanda Tangan" style={{ height: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
                      )}
                    </div>
                    <p className="ttd-name">{reportData.schoolProfile.headmaster}</p>
                    <p>NIP. {reportData.schoolProfile.headmasterNip || '–'}</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
