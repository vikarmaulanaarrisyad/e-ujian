import React, { useState, useRef } from 'react';
import api from '@/lib/api';
import { Loader2, FileBarChart, X, CheckCircle2, Circle, FileText, Download } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface IndividualSknrDownloaderProps {
  studentId: string;
  className?: string;
}

export default function IndividualSknrDownloader({ studentId, className }: IndividualSknrDownloaderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([7, 8, 9, 10, 11]);
  const [downloading, setDownloading] = useState(false);
  const [docData, setDocData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const availableSemesters = [7, 8, 9, 10, 11];

  const handleToggleSemester = (sem: number) => {
    setSelectedSemesters(prev => 
      prev.includes(sem) ? prev.filter(s => s !== sem) : [...prev, sem].sort((a,b) => a - b)
    );
  };

  const handleSelectAll = () => {
    if (selectedSemesters.length === availableSemesters.length) {
      setSelectedSemesters([]);
    } else {
      setSelectedSemesters([...availableSemesters]);
    }
  };

  const handleDownloadClick = async () => {
    if (selectedSemesters.length === 0) {
      alert("Pilih minimal 1 semester!");
      return;
    }

    try {
      setDownloading(true);
      const semestersQuery = selectedSemesters.join(',');
      const res = await api.get(`/documents/student/${studentId}/sknr?semesters=${semestersQuery}`);
      const data = res.data;
      setDocData(data);
      
      // Give React a moment to render the hidden DOM elements
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!printRef.current) {
        throw new Error("Container not found");
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const element = printRef.current.querySelector('.sknr-page') as HTMLElement;
      
      if (!element) {
        throw new Error("Element not rendered");
      }
      
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
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `SKNR_${data.student.name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
      pdf.save(fileName);
      setModalOpen(false); // Close modal on success
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Terjadi kesalahan saat mengunduh PDF SKNR.');
    } finally {
      setDownloading(false);
      setDocData(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        title="Cetak SKNR (Nilai Rapor)"
        className={className || "p-1.5 text-slate-450 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"}
      >
        <FileBarChart className="w-4 h-4" />
      </button>

      {/* Modal for Semester Selection */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-700/50 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden transform animate-in zoom-in-95 duration-300">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-500/20 blur-[60px] pointer-events-none rounded-t-3xl"></div>
            
            <div className="relative flex items-center justify-between px-6 py-5 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-lg leading-tight">Cetak SKNR</h3>
                  <p className="text-xs text-slate-400">Konfigurasi nilai rapor</p>
                </div>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-300">Pilih Semester</p>
                <button 
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {selectedSemesters.length === availableSemesters.length ? 'Batalkan Semua' : 'Pilih Semua'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {availableSemesters.map(sem => {
                  const isSelected = selectedSemesters.includes(sem);
                  return (
                    <label 
                      key={sem} 
                      className={`
                        relative flex items-center justify-center gap-2 p-3 cursor-pointer rounded-2xl border-2 transition-all duration-300 group
                        ${isSelected 
                          ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={isSelected}
                        onChange={() => handleToggleSemester(sem)}
                      />
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
                      )}
                      <span className={`text-sm font-semibold ${isSelected ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-300'}`}>
                        Semester {sem}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  className="w-1/3 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  onClick={handleDownloadClick}
                  disabled={downloading || selectedSemesters.length === 0} 
                  className="w-2/3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyiapkan Dokumen...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Unduh PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden container for rendering SKNR page */}
      {docData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -9999, pointerEvents: 'none' }}>
          <div ref={printRef}>
            <style dangerouslySetInnerHTML={{ __html: `
              .sknr-page {
                background: white;
                width: 210mm;
                min-height: 297mm;
                color: #000;
                font-family: Arial, Helvetica, sans-serif;
                position: relative;
              }
              .page-inner { padding: 2cm 2.5cm; min-height: 297mm; display: flex; flex-direction: column; }
              .kop-surat-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
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
              .kop-line-alamat { font-size: 13px; font-weight: normal; line-height: 1.4; width: 100%; }
              .kop-divider { margin-top: 2px; }
              .kop-divider-thick { height: 3px; background: #000; margin-bottom: 2px; }
              .kop-divider-thin  { height: 1px; background: #000; }
              
              .skl-judul-wrap { text-align: center; margin-top: 24px; margin-bottom: 24px; }
              .skl-judul { display: block; font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
              .skl-nomor { font-size: 14px; }
              
              .identity-section { font-size: 13px; margin-bottom: 24px; }
              .identity-table { border-collapse: collapse; margin-left: 24px; margin-top: 4px; margin-bottom: 12px; }
              .identity-table td { padding: 2px 4px; vertical-align: top; }
              
              .sknr-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; border: 1px solid #000; }
              .sknr-table th, .sknr-table td { border: 1px solid #000; padding: 6px 4px; text-align: center; }
              .sknr-table th { font-weight: bold; background-color: #fff; }
              .sknr-table td.left-align { text-align: left; padding-left: 8px; }
              .sknr-table td.bold { font-weight: bold; }
              
              .closing-text { font-size: 13px; text-align: justify; margin-bottom: 40px; }

              .footer-wrap { display: flex; justify-content: flex-end; gap: 40px; margin-top: auto; padding-top: 20px; }
              .photo-box { width: 3cm; height: 4cm; border: 1px solid black; display: flex; align-items: center; justify-content: center; font-size: 11px; text-align: center; }
              .photo-img { width: 3cm; height: 4cm; object-fit: cover; border: 1px solid black; }
              .ttd-box { width: 250px; text-align: left; font-size: 13px; }
              .ttd-space { height: 80px; }
              .ttd-name { font-weight: bold; text-decoration: underline; }
            `}} />
            
            <div className="sknr-page">
              <div className="page-inner">
                {/* KOP SURAT */}
                <table className="kop-surat-table">
                  <tbody>
                    <tr>
                      <td className="kop-logo-td">
                        {docData.schoolProfile.logoUrl
                          ? <img src={docData.schoolProfile.logoUrl} alt="Logo" crossOrigin="anonymous" />
                          : <div className="kop-logo-placeholder">LOGO<br/>MADRASAH</div>
                        }
                      </td>
                      <td className="kop-text-td">
                        <div className="kop-text-inner">
                          <span className="kop-line-yayasan">{docData.schoolProfile?.foundationName?.toUpperCase() || docData.schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN"}</span>
                          <span className="kop-line-sekolah">{docData.schoolProfile.name || 'MADRASAH IBTIDAIYAH BUSTANUL HUDA 01 DAWUHAN'}</span>
                          <span className="kop-line-akreditasi">
                            TERAKREDITASI A NSM {docData.schoolProfile.nsm || '111233280040'} NPSN {docData.schoolProfile.npsn || '60713609'}
                          </span>
                          <span className="kop-line-alamat">Alamat : {docData.schoolProfile.address}</span>
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

                <div className="skl-judul-wrap">
                  <span className="skl-judul">SURAT KETERANGAN NILAI RAPOR</span>
                  <span className="skl-nomor">NOMOR : {docData.student.sknrNumber || '--diisi nomor surat keluar--'}</span>
                </div>

                <div className="identity-section">
                  <p style={{ marginBottom: '4px' }}>Yang bertanda tangan di bawah ini :</p>
                  <table className="identity-table">
                    <tbody>
                      <tr>
                        <td style={{ width: '150px' }}>Nama</td>
                        <td style={{ width: '10px' }}>:</td>
                        <td>{docData.schoolProfile.headmaster}</td>
                      </tr>
                      <tr>
                        <td>NIP</td>
                        <td>:</td>
                        <td>{docData.schoolProfile.headmasterNip || '-'}</td>
                      </tr>
                      <tr>
                        <td>Jabatan</td>
                        <td>:</td>
                        <td>Kepala Madrasah</td>
                      </tr>
                      <tr>
                        <td>NPSN</td>
                        <td>:</td>
                        <td>{docData.schoolProfile.npsn || '-'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p style={{ marginBottom: '4px' }}>Menerangkan nilai rapor :</p>
                  <table className="identity-table">
                    <tbody>
                      <tr>
                        <td style={{ width: '150px' }}>Nama Peserta Didik</td>
                        <td style={{ width: '10px' }}>:</td>
                        <td>{docData.student.name}</td>
                      </tr>
                      <tr>
                        <td>Tempat, tanggal lahir</td>
                        <td>:</td>
                        <td>{docData.student.placeOfBirth || '-'}, {formatDate(docData.student.dateOfBirth)}</td>
                      </tr>
                      <tr>
                        <td>NISN</td>
                        <td>:</td>
                        <td>{docData.student.nisn}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <table className="sknr-table">
                  <thead>
                    <tr>
                      <th rowSpan={2} style={{ width: '30px' }}>NO</th>
                      <th rowSpan={2}>MATA PELAJARAN</th>
                      <th colSpan={docData.sknrDetails.activeSemesters.length}>NILAI RAPOR SEMESTER</th>
                      <th rowSpan={2} style={{ width: '90px' }}>
                        RATA-RATA<br/>
                        ({docData.sknrDetails.activeSemesters.length > 1 ? 
                          `${Math.min(...docData.sknrDetails.activeSemesters)}-${Math.max(...docData.sknrDetails.activeSemesters)}` 
                          : docData.sknrDetails.activeSemesters[0]
                        })
                      </th>
                    </tr>
                    <tr>
                      {docData.sknrDetails.activeSemesters.map((sem: number) => (
                        <th key={sem} style={{ width: '45px' }}>{sem}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {docData.sknrDetails.subjects.map((subj: any, index: number) => (
                      <tr key={subj.subjectName}>
                        <td>{index + 1}</td>
                        <td className="left-align">{subj.subjectName}</td>
                        {docData.sknrDetails.activeSemesters.map((sem: number) => (
                          <td key={sem}>
                            {subj.scores[sem] !== undefined ? Number(subj.scores[sem]).toFixed(2).replace('.', ',') : '-'}
                          </td>
                        ))}
                        <td>{Number(subj.average).toFixed(2).replace('.', ',')}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2 + docData.sknrDetails.activeSemesters.length} className="bold" style={{ textAlign: 'right', paddingRight: '12px' }}>
                        RATA-RATA
                      </td>
                      <td className="bold">{Number(docData.sknrDetails.totalAverage).toFixed(2).replace('.', ',')}</td>
                    </tr>
                  </tbody>
                </table>

                <p className="closing-text">
                  Demikian Surat Keterangan ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
                </p>

                <div className="footer-wrap">
                  <div>
                    {docData.student.photoUrl ? (
                      <img 
                        src={docData.student.photoUrl.startsWith('http') ? docData.student.photoUrl : `http://localhost:5000${docData.student.photoUrl}`} 
                        alt="Pas Foto" 
                        className="photo-img"
                        crossOrigin="anonymous" 
                      />
                    ) : (
                      <div className="photo-box">
                        <div className="text-center text-slate-500">
                          Pas Photo<br/><br/>3x4<br/><br/>Stempel<br/>Menyentuh<br/>Pas Photo
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ttd-box">
                    <p style={{ marginBottom: '2px' }}>{docData.schoolProfile.city || '................'}, {formatDate(docData.student.graduationDate || new Date().toISOString())}</p>
                    <p>Kepala Madrasah,</p>
                    <div className="ttd-space" />
                    <p className="ttd-name">{docData.schoolProfile.headmaster}</p>
                    <p>NIP. {docData.schoolProfile.headmasterNip || '-'}</p>
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
