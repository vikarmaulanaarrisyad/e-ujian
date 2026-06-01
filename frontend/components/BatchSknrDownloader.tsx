import React, { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { Loader2, FileBarChart, X, CheckCircle2, Circle, FileText, Download } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { useAuth } from '@/context/AuthContext';

interface BatchSknrDownloaderProps {
  className?: string;
}

export default function BatchSknrDownloader({ className }: BatchSknrDownloaderProps) {
  const { user } = useAuth();
  const tenantPrefix = user?.tenantId ? `${user.tenantId}_` : '';
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([7, 8, 9, 10, 11]);
  const [downloading, setDownloading] = useState(false);
  const [batchData, setBatchData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => {
    if (!downloading) setModalOpen(false);
  };

  const handleDownload = async () => {
    if (selectedSemesters.length === 0) {
      alert("Pilih minimal 1 semester!");
      return;
    }

    try {
      setDownloading(true);
      
      const semestersQuery = selectedSemesters.join(',');
      const res = await api.get(`/documents/sknr-batch?semesters=${semestersQuery}`);
      const data = res.data;
      setBatchData(data);
      
      // Give React a moment to render the hidden DOM elements
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!containerRef.current) {
        throw new Error("Container not found");
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const pages = containerRef.current.querySelectorAll('.sknr-page');
      
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
      
      const fileName = `SKNR_Batch_${data.schoolProfile.name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
      pdf.save(fileName);
      
      setModalOpen(false);
    } catch (err) {
      console.error('Error generating batch PDF:', err);
      alert('Terjadi kesalahan saat mengunduh PDF SKNR.');
    } finally {
      setDownloading(false);
      setBatchData(null);
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
        onClick={handleOpenModal}
        disabled={downloading}
        className={className || "px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-70 disabled:cursor-not-allowed"}
      >
        <FileBarChart className="w-4 h-4" />
        SKNR (Batch)
      </button>

      {/* Modal for Semester Selection */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-700/50 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden transform animate-in zoom-in-95 duration-300">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-emerald-500/20 blur-[60px] pointer-events-none rounded-t-3xl"></div>
            
            <div className="relative flex items-center justify-between px-6 py-5 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-lg leading-tight">Cetak SKNR (Batch)</h3>
                  <p className="text-xs text-slate-400">Pilih semester untuk seluruh siswa</p>
                </div>
              </div>
              <button 
                onClick={handleCloseModal} 
                disabled={downloading}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-300">Pilih Semester</p>
                <button 
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
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
                          ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
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
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
                      )}
                      <span className={`text-sm font-semibold ${isSelected ? 'text-emerald-300' : 'text-slate-400 group-hover:text-slate-300'}`}>
                        Semester {sem}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  disabled={downloading}
                  className="w-1/3 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  onClick={handleDownload}
                  disabled={downloading || selectedSemesters.length === 0} 
                  className="w-2/3 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Memproses PDF...
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

      {/* Hidden container for rendering SKNR pages */}
      {batchData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -9999, pointerEvents: 'none' }}>
          <div ref={containerRef}>
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

              .footer-wrap { display: flex; justify-content: flex-end; gap: 120px; margin-top: auto; padding-top: 20px; }
              .photo-box { width: 3cm; height: 4cm; border: 1px solid black; display: flex; align-items: center; justify-content: center; font-size: 11px; text-align: center; }
              .photo-img { width: 3cm; height: 4cm; object-fit: cover; border: 1px solid black; }
              .ttd-box { width: 250px; text-align: left; font-size: 13px; }
              .ttd-space { height: 80px; }
              .ttd-name { font-weight: bold; text-decoration: underline; }
            `}} />
            
            {batchData.students.map((studentData: any, idx: number) => (
              <div className="sknr-page" key={studentData.id}>
                <div className="page-inner">
                  {/* KOP SURAT */}
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

                  <div className="skl-judul-wrap">
                    <span className="skl-judul">SURAT KETERANGAN NILAI RAPOR</span>
                    <span className="skl-nomor">NOMOR : {studentData.sknrNumber || '--diisi nomor surat keluar--'}</span>
                  </div>

                  <div className="identity-section">
                    <p style={{ marginBottom: '4px' }}>Yang bertanda tangan di bawah ini :</p>
                    <table className="identity-table">
                      <tbody>
                        <tr>
                          <td style={{ width: '150px' }}>Nama</td>
                          <td style={{ width: '10px' }}>:</td>
                          <td>{batchData.schoolProfile.headmaster}</td>
                        </tr>
                        <tr>
                          <td>NIP</td>
                          <td>:</td>
                          <td>{batchData.schoolProfile.headmasterNip || '-'}</td>
                        </tr>
                        <tr>
                          <td>Jabatan</td>
                          <td>:</td>
                          <td>Kepala Madrasah</td>
                        </tr>
                        <tr>
                          <td>NPSN</td>
                          <td>:</td>
                          <td>{batchData.schoolProfile.npsn || '-'}</td>
                        </tr>
                      </tbody>
                    </table>

                    <p style={{ marginBottom: '4px' }}>Menerangkan nilai rapor :</p>
                    <table className="identity-table">
                      <tbody>
                        <tr>
                          <td style={{ width: '150px' }}>Nama Peserta Didik</td>
                          <td style={{ width: '10px' }}>:</td>
                          <td>{studentData.name}</td>
                        </tr>
                        <tr>
                          <td>Tempat, tanggal lahir</td>
                          <td>:</td>
                          <td>{studentData.placeOfBirth || '-'}, {formatDate(studentData.dateOfBirth)}</td>
                        </tr>
                        <tr>
                          <td>NISN</td>
                          <td>:</td>
                          <td>{studentData.nisn}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <table className="sknr-table">
                    <thead>
                      <tr>
                        <th rowSpan={2} style={{ width: '30px' }}>NO</th>
                        <th rowSpan={2}>MATA PELAJARAN</th>
                        <th colSpan={studentData.sknrDetails.activeSemesters.length}>NILAI RAPOR SEMESTER</th>
                        <th rowSpan={2} style={{ width: '90px' }}>
                          RATA-RATA<br/>
                          ({studentData.sknrDetails.activeSemesters.length > 1 ? 
                            `${Math.min(...studentData.sknrDetails.activeSemesters)}-${Math.max(...studentData.sknrDetails.activeSemesters)}` 
                            : studentData.sknrDetails.activeSemesters[0]
                          })
                        </th>
                      </tr>
                      <tr>
                        {studentData.sknrDetails.activeSemesters.map((sem: number) => (
                          <th key={sem} style={{ width: '45px' }}>{sem}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {studentData.sknrDetails.subjects.map((subj: any, index: number) => (
                        <tr key={subj.subjectName}>
                          <td>{index + 1}</td>
                          <td className="left-align">{subj.subjectName}</td>
                          {studentData.sknrDetails.activeSemesters.map((sem: number) => (
                            <td key={sem}>
                              {subj.scores[sem] !== undefined ? Number(subj.scores[sem]).toFixed(2).replace('.', ',') : '-'}
                            </td>
                          ))}
                          <td>{Number(subj.average).toFixed(2).replace('.', ',')}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={2 + studentData.sknrDetails.activeSemesters.length} className="bold" style={{ textAlign: 'right', paddingRight: '12px' }}>
                          RATA-RATA
                        </td>
                        <td className="bold">{Number(studentData.sknrDetails.totalAverage).toFixed(2).replace('.', ',')}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="closing-text">
                    Demikian Surat Keterangan ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
                  </p>

                  <div className="footer-wrap">
                    <div>
                      {studentData.photoUrl ? (
                        <img 
                          src={studentData.photoUrl.startsWith('http') ? studentData.photoUrl : `http://localhost:5000${studentData.photoUrl}`} 
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
                      <div className="mb-2">
                        {batchData.schoolProfile.city || '................'}, {formatDate(studentData.graduationDate)}<br/>
                        Kepala Madrasah,
                      </div>
                      <div className="ttd-space">
                        {batchData.schoolProfile.signatureUrl && (
                          <img src={batchData.schoolProfile.signatureUrl} alt="Tanda Tangan" style={{ height: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
                        )}
                      </div>
                      <p className="ttd-name">{batchData.schoolProfile.headmaster}</p>
                      <p>NIP. {batchData.schoolProfile.headmasterNip || '-'}</p>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
