import React, { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { Loader2, Mail, X } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { useAuth } from '@/context/AuthContext';

interface BatchInvitationDownloaderProps {
  className?: string;
}

export default function BatchInvitationDownloader({ className }: BatchInvitationDownloaderProps) {
  const { user } = useAuth();
  const tenantPrefix = user?.tenantId ? `${user.tenantId}_` : '';
  const [modalOpen, setModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [batchData, setBatchData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Form State
  const [nomorSurat, setNomorSurat] = useState('');
  const [hal, setHal] = useState('Undangan Pengumuman Kelulusan');
  const [tanggalAcara, setTanggalAcara] = useState('');
  const [waktuAcara, setWaktuAcara] = useState('08.00 WIB - Selesai');
  const [tempatAcara, setTempatAcara] = useState('Halaman Madrasah');

  // Load from localStorage on mount
  useEffect(() => {
    if (!user?.tenantId) return;
    const savedNomor = localStorage.getItem(`${tenantPrefix}inv_nomorSurat`);
    const savedHal = localStorage.getItem(`${tenantPrefix}inv_hal`);
    const savedTgl = localStorage.getItem(`${tenantPrefix}inv_tanggalAcara`);
    const savedWaktu = localStorage.getItem(`${tenantPrefix}inv_waktuAcara`);
    const savedTempat = localStorage.getItem(`${tenantPrefix}inv_tempatAcara`);
    
    if (savedNomor) setNomorSurat(savedNomor);
    if (savedHal) setHal(savedHal);
    if (savedTgl) setTanggalAcara(savedTgl);
    if (savedWaktu) setWaktuAcara(savedWaktu);
    if (savedTempat) setTempatAcara(savedTempat);
  }, [user?.tenantId, tenantPrefix]);

  // Save to localStorage when values change
  useEffect(() => { if (user?.tenantId) localStorage.setItem(`${tenantPrefix}inv_nomorSurat`, nomorSurat); }, [nomorSurat, user?.tenantId, tenantPrefix]);
  useEffect(() => { if (user?.tenantId) localStorage.setItem(`${tenantPrefix}inv_hal`, hal); }, [hal, user?.tenantId, tenantPrefix]);
  useEffect(() => { if (user?.tenantId) localStorage.setItem(`${tenantPrefix}inv_tanggalAcara`, tanggalAcara); }, [tanggalAcara, user?.tenantId, tenantPrefix]);
  useEffect(() => { if (user?.tenantId) localStorage.setItem(`${tenantPrefix}inv_waktuAcara`, waktuAcara); }, [waktuAcara, user?.tenantId, tenantPrefix]);
  useEffect(() => { if (user?.tenantId) localStorage.setItem(`${tenantPrefix}inv_tempatAcara`, tempatAcara); }, [tempatAcara, user?.tenantId, tenantPrefix]);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => {
    if (!downloading) setModalOpen(false);
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggalAcara || !waktuAcara || !tempatAcara) {
      alert('Mohon lengkapi Tanggal, Waktu, dan Tempat acara.');
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
      
      const pages = containerRef.current.querySelectorAll('.invitation-page');
      
      if (pages.length === 0) {
        alert("Tidak ada data siswa lulus untuk di-download.");
        setDownloading(false);
        setBatchData(null);
        return;
      }
      
      for (let i = 0; i < pages.length; i++) {
        const element = pages[i] as HTMLElement;
        
        // Use toJpeg instead of toPng to reduce file size massively
        const imgData = await toJpeg(element, {
          cacheBust: true,
          backgroundColor: '#ffffff',
          pixelRatio: 2, // High resolution
          quality: 0.85,  // Good quality JPEG compression
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
      
      const schoolName = data?.schoolProfile?.name || 'Madrasah';
      const fileName = `Undangan_Kelulusan_${schoolName.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
      pdf.save(fileName);
      
      setModalOpen(false);
    } catch (err: any) {
      console.error('Error generating batch PDF:', err);
      const msg = err.response?.data?.message || 'Terjadi kesalahan saat mengunduh PDF undangan kelulusan.';
      alert(msg);
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

  // Convert Date input format 'YYYY-MM-DD' to something formal 'Senin, 15 Juni 2026'
  const formatTanggalFormal = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
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
        className={className || "px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-600/10 disabled:opacity-70 disabled:cursor-not-allowed"}
      >
        <Mail className="w-4 h-4" />
        Cetak Undangan
      </button>

      {/* Modal Input Detail Acara */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                Cetak Undangan Kelulusan
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
              <form id="invitation-form" onSubmit={handleDownload} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Nomor Surat (Opsional)</label>
                  <input
                    type="text"
                    value={nomorSurat}
                    onChange={(e) => setNomorSurat(e.target.value)}
                    placeholder="Contoh: 045/MI.BH/2026"
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Hal (Perihal)</label>
                  <input
                    type="text"
                    value={hal}
                    onChange={(e) => setHal(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Tanggal Acara <span className="text-rose-400">*</span></label>
                    <input
                      type="date"
                      value={tanggalAcara}
                      onChange={(e) => setTanggalAcara(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Waktu Acara <span className="text-rose-400">*</span></label>
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
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Tempat Acara <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    value={tempatAcara}
                    onChange={(e) => setTempatAcara(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
                form="invitation-form"
                disabled={downloading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {downloading ? 'Memproses PDF...' : 'Download PDF Undangan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden container for rendering Invitation pages */}
      {batchData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -9999, pointerEvents: 'none' }}>
          <div ref={containerRef}>
            <style dangerouslySetInnerHTML={{ __html: `
              .invitation-page {
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
              
              .invitation-header-table { width: 100%; margin-top: 24px; font-size: 15px; }
              .invitation-header-table td { vertical-align: top; padding: 2px 0; line-height: 1.5; }
              .meta-col { width: 350px; }
              .date-col { text-align: right; }
              
              .recipient-block { margin-top: 16px; font-size: 15px; line-height: 1.6; }
              
              .invitation-body { margin-top: 32px; font-size: 15px; line-height: 1.6; text-align: justify; }
              
              .event-details-table { margin: 16px 0 16px 40px; font-size: 15px; line-height: 1.6; }
              .event-details-table td { padding: 4px 0; vertical-align: top; }
              .event-label-col { width: 120px; }
              .event-sep-col { width: 16px; }
              
              .ttd-wrap { margin-top: 40px; display: flex; justify-content: flex-end; }
              .ttd-block { text-align: left; width: 250px; font-size: 15px; line-height: 1.6; }
              .ttd-space { height: 80px; }
              .ttd-name { font-weight: bold; text-decoration: underline; letter-spacing: 0.5px; }
            `}} />
            
            {batchData.students.map((student: any) => {
              return (
                <div key={student.id} className="invitation-page">
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
                              <span className="kop-line-yayasan">YAYASAN BUSTANUL HUDA DAWUHAN</span>
                              <span className="kop-line-sekolah">{batchData.schoolProfile.name || 'MADRASAH IBTIDAIYAH BUSTANUL HUDA 01 DAWUHAN'}</span>
                              <span className="kop-line-akreditasi">
                                TERAKREDITASI {batchData.schoolProfile.accreditation || 'A'} NSM {batchData.schoolProfile.nsm || '111233280040'} NPSN {batchData.schoolProfile.npsn || '60713609'}
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
                    
                    {/* Header Surat (Nomor, Hal, Tanggal) */}
                    <table className="invitation-header-table">
                      <tbody>
                        <tr>
                          <td className="meta-col">
                            Nomor &nbsp; &nbsp; : {nomorSurat || '........................'}<br/>
                            Lampiran &nbsp;: -<br/>
                            Hal &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; : <strong>{hal}</strong>
                          </td>
                          <td className="date-col">
                            {batchData.schoolProfile.city || 'Bondowoso'}, {formatTanggalHariIni()}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Penerima */}
                    <div className="recipient-block">
                      Yth. Bapak/Ibu Wali Murid dari:<br/>
                      <strong>{student.name}</strong><br/>
                      Di -<br/>
                      &nbsp; &nbsp; &nbsp;Tempat
                    </div>

                    {/* Isi Surat */}
                    <div className="invitation-body">
                      <p>
                        Assalamu'alaikum Warahmatullahi Wabarakatuh
                      </p>
                      <p style={{ marginTop: '16px' }}>
                        Puji syukur kehadirat Allah SWT atas segala limpahan rahmat dan karunia-Nya. 
                        Shalawat serta salam senantiasa tercurahkan kepada junjungan kita Nabi Muhammad SAW.
                      </p>
                      <p style={{ marginTop: '16px' }}>
                        Sehubungan dengan telah berakhirmya kegiatan belajar mengajar Tahun Pelajaran {batchData.academicYear} dan telah dilaksanakannya rapat kelulusan Dewan Guru {batchData.schoolProfile.name || 'Madrasah'}, maka kami mengharap kehadiran Bapak/Ibu Wali Murid pada:
                      </p>
                      
                      <table className="event-details-table">
                        <tbody>
                          <tr>
                            <td className="event-label-col">Hari, Tanggal</td>
                            <td className="event-sep-col">:</td>
                            <td><strong>{formatTanggalFormal(tanggalAcara)}</strong></td>
                          </tr>
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
                            <td>{hal}</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <p style={{ marginTop: '16px' }}>
                        Mengingat pentingnya acara ini, kami mohon Bapak/Ibu Wali Murid dapat hadir tepat pada waktunya.
                      </p>
                      <p style={{ marginTop: '16px' }}>
                        Demikian surat undangan ini kami sampaikan, atas perhatian dan kehadiran Bapak/Ibu kami ucapkan terima kasih.
                      </p>
                      <p style={{ marginTop: '16px' }}>
                        Wassalamu'alaikum Warahmatullahi Wabarakatuh
                      </p>
                    </div>

                    {/* Tanda Tangan */}
                    <div className="ttd-wrap">
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
