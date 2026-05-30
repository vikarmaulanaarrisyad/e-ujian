import React, { useState, useRef } from 'react';
import api from '@/lib/api';
import { Loader2, Printer } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface IndividualIjazahDownloaderProps {
  studentId: string;
  className?: string;
}

export default function IndividualIjazahDownloader({ studentId, className }: IndividualIjazahDownloaderProps) {
  const [downloading, setDownloading] = useState(false);
  const [docData, setDocData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      const res = await api.get(`/documents/student/${studentId}`);
      const data = res.data;
      setDocData(data);
      
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
      
      const element = printRef.current.querySelector('.ijazah-page') as HTMLElement;
      
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
      
      const fileName = `Ijazah_${data.student.name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
      pdf.save(fileName);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Terjadi kesalahan saat mengunduh PDF Ijazah.');
    } finally {
      setDownloading(false);
      setDocData(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={downloading}
        title="Download PDF Ijazah"
        className={className || "p-1.5 text-slate-450 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"}
      >
        {downloading ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Printer className="w-4 h-4" />}
      </button>

      {docData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -9999, pointerEvents: 'none' }}>
          <div ref={printRef}>
            <style dangerouslySetInnerHTML={{ __html: `
              .ijazah-page {
                background: white; 
                width: 210mm; 
                min-height: 297mm; 
                color: black;
                font-family: "Times New Roman", Times, serif;
                position: relative;
              }
              .page-inner { padding: 1.5cm 2.5cm; min-height: 297mm; display: flex; flex-direction: column; }
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
              .kop-divider { margin-top: 2px; margin-bottom: 24px; }
              .kop-divider-thick { height: 3px; background: #000; margin-bottom: 2px; }
              .kop-divider-thin  { height: 1px; background: #000; }
              
              .biodata-table { width: 100%; margin-bottom: 24px; font-size: 14px; }
              .biodata-table td { padding: 4px 0; vertical-align: top; }
              .biodata-label { width: 190px; }
              .biodata-sep { width: 16px; }

              .ijazah-table { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 32px; }
              .ijazah-table th, .ijazah-table td { border: 1px solid black; padding: 6px 12px; }
              .ijazah-table th { text-align: center; font-weight: bold; }
              .ijazah-table .group-row { background: #f3f4f6; font-weight: bold; }

              .footer-wrap { display: flex; justify-content: space-between; margin-top: 48px; padding-left: 160px; padding-right: 32px; }
              .photo-box { width: 3cm; height: 4cm; border: 2px solid black; display: flex; align-items: center; justify-content: center; font-size: 12px; text-align: center; padding: 8px; margin-bottom: 8px; }
              .photo-img { width: 3cm; height: 4cm; object-fit: cover; border: 2px solid black; margin-bottom: 8px; }
              .ttd-box { width: 250px; text-align: left; }
              .ttd-box p { margin: 0; }
              .ttd-space { height: 96px; }
              .ttd-name { font-weight: bold; text-decoration: underline; }
              .cert-number { position: absolute; bottom: 40px; left: 40px; font-size: 10px; color: #6b7280; font-family: sans-serif; }
              .cert-number span { font-weight: bold; color: black; }
            `}} />
            
            <div className="ijazah-page">
              <div className="page-inner">
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

                <table className="biodata-table">
                  <tbody>
                    <tr>
                      <td className="biodata-label">Nama Lengkap</td>
                      <td className="biodata-sep">:</td>
                      <td className="font-bold uppercase">{docData.student.name}</td>
                    </tr>
                    <tr>
                      <td>Tempat dan Tanggal Lahir</td>
                      <td>:</td>
                      <td>{docData.student.placeOfBirth || '-'}, {formatDate(docData.student.dateOfBirth)}</td>
                    </tr>
                    <tr>
                      <td>Nomor Induk Siswa Nasional</td>
                      <td>:</td>
                      <td>{docData.student.nisn}</td>
                    </tr>
                  </tbody>
                </table>

                <table className="ijazah-table">
                  <thead>
                    <tr>
                      <th style={{ width: '48px' }}>No</th>
                      <th>Mata Pelajaran</th>
                      <th style={{ width: '128px' }}>Nilai Ujian</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="group-row">
                      <td colSpan={3} style={{ textAlign: 'left', padding: '8px 12px' }}>Kelompok A</td>
                    </tr>
                    {docData.grades.filter((g: any) => g.subjectGroup === 'KELOMPOK_A').map((g: any, i: number) => (
                      <tr key={g.subjectId}>
                        <td style={{ textAlign: 'center' }}>{i + 1}</td>
                        <td>{g.subjectName}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{g.finalScore.toFixed(0)}</td>
                      </tr>
                    ))}

                    <tr className="group-row">
                      <td colSpan={3} style={{ textAlign: 'left', padding: '8px 12px' }}>Kelompok B</td>
                    </tr>
                    {docData.grades.filter((g: any) => g.subjectGroup === 'KELOMPOK_B' || g.subjectGroup === 'KELOMPOK_C').map((g: any, i: number) => (
                      <tr key={g.subjectId}>
                        <td style={{ textAlign: 'center' }}>{docData.grades.filter((gx: any) => gx.subjectGroup === 'KELOMPOK_A').length + i + 1}</td>
                        <td>{g.subjectName}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{g.finalScore.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 'bold' }}>
                      <td colSpan={2} style={{ textAlign: 'center', padding: '12px' }}>Rata - Rata</td>
                      <td style={{ textAlign: 'center', fontSize: '18px' }}>{docData.averageFinalScore.toFixed(0)}</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="footer-wrap">
                  <div style={{ width: '192px' }}>
                    {docData.student.photoUrl ? (
                      <img 
                        src={docData.student.photoUrl.startsWith('http') ? docData.student.photoUrl : `http://localhost:5000${docData.student.photoUrl}`} 
                        alt="Pas Foto" 
                        className="photo-img"
                        crossOrigin="anonymous" 
                      />
                    ) : (
                      <div className="photo-box">
                        Pas Foto<br/>3 x 4 cm<br/><br/>Cap Tiga Jari<br/>Tengah Kiri
                      </div>
                    )}
                  </div>
                  
                  <div className="ttd-box">
                    <p style={{ marginBottom: '4px' }}>{docData.schoolProfile.city}, {formatDate(docData.student.graduationDate || new Date().toISOString())}</p>
                    <p>Kepala Madrasah,</p>
                    <div className="ttd-space" />
                    <p className="ttd-name">{docData.schoolProfile.headmaster}</p>
                    <p>NIP. {docData.schoolProfile.headmasterNip || '-'}</p>
                  </div>
                </div>

                <div className="cert-number">
                  No. Ijazah: <span>{docData.student.certificateNumber || '.....................................'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
