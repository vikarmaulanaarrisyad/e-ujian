import React, { useState, useRef } from 'react';
import api from '@/lib/api';
import { Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface IndividualSklDownloaderProps { withTranscript?: boolean;
  studentId: string;
  className?: string;
}

export default function IndividualSklDownloader({ studentId, withTranscript = false, className }: IndividualSklDownloaderProps) {
  const [downloading, setDownloading] = useState(false);
  const [docData, setDocData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // 1. Fetch individual document data
      const res = await api.get(`/documents/student/${studentId}`);
      const data = res.data;
      setDocData(data);
      
      // Give React a moment to render the hidden DOM elements
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!printRef.current) {
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
      
      const element = printRef.current.querySelector('.skl-page') as HTMLElement;
      
      if (!element) {
        throw new Error("Element not rendered");
      }
      
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
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `SKL_${withTranscript ? 'Nilai_' : ''}${data.student.name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
      pdf.save(fileName);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Terjadi kesalahan saat mengunduh PDF SKL.');
    } finally {
      setDownloading(false);
      setDocData(null); // Clear data to unmount hidden DOM
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
        onClick={handleDownload}
        disabled={downloading}
        title={withTranscript ? 'Download PDF SKL + Nilai' : 'Download PDF SKL'}
        className={className || "p-1.5 text-slate-450 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"}
      >
        {downloading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : (withTranscript ? <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4" />)}
      </button>

      {/* Hidden container for rendering SKL page */}
      {docData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -9999, pointerEvents: 'none' }}>
          <div ref={printRef}>
            <style dangerouslySetInnerHTML={{ __html: `
              .skl-page {
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
              .skl-judul-wrap { text-align: center; margin-top: 26px; margin-bottom: 20px; }
              .skl-judul { display: block; font-size: 18px; font-weight: bold; text-transform: uppercase; text-decoration: underline; letter-spacing: 1.5px; margin-bottom: 5px; }
              .skl-nomor { font-size: 14px; }
              .skl-body { flex: 1; font-size: 15px; line-height: 1.6; }
              .skl-para { text-align: justify; margin-bottom: 12px; }
              .identity-table { margin: 4px 0 16px 24px; border-collapse: collapse; width: calc(100% - 24px); }
              .identity-table td { padding: 4px 0; vertical-align: top; font-size: 15px; line-height: 1.6; }
              .identity-table .col-label { width: 220px; }
              .identity-table .col-sep { width: 16px; }
              .lulus-stamp-wrap { text-align: center; margin: 16px 0 14px; }
              
              .skl-nilai-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 12px; font-family: "Times New Roman", Times, serif; }
              .skl-nilai-table th, .skl-nilai-table td { border: 1.5px solid black; padding: 6px 8px; font-size: 14px; }
              .skl-nilai-table th { text-align: center; font-weight: bold; }
              .skl-nilai-table .col-no { width: 40px; text-align: center; }
              .skl-nilai-table .col-mapel { text-align: left; }
              .skl-nilai-table .col-nilai { width: 100px; text-align: center; font-weight: bold; }
              .lulus-stamp { display: inline-block; font-size: 28px; font-weight: 900; letter-spacing: 8px; border: 3px solid #000; padding: 10px 50px; border-radius: 6px; }
              .ttd-wrap { margin-top: auto; padding-top: 20px; display: flex; justify-content: flex-end; }
              .ttd-block { text-align: center; width: 250px; font-size: 15px; line-height: 1.6; }
              .ttd-space { height: 80px; }
              .ttd-name { font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 0.5px; }
            `}} />
            
            <div className="skl-page">
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
                <div className="skl-judul-wrap">
                  <span className="skl-judul">SURAT KETERANGAN LULUS</span>
                  <span className="skl-nomor">Nomor: {docData.student.sklNumber || `........./MI.BH/${new Date().getFullYear()}`}</span>
                </div>
                <div className="skl-body">
                  <p className="skl-para">
                    Yang bertanda tangan di bawah ini, Kepala {docData.schoolProfile.name || 'Madrasah Ibtidaiyah Bustanul Huda 01 Dawuhan'},
                    Kecamatan {docData.schoolProfile.district || 'Tamanan'}, Kabupaten {docData.schoolProfile.city || 'Bondowoso'}, Provinsi {docData.schoolProfile.province || 'Jawa Timur'}, menerangkan
                    dengan sesungguhnya bahwa peserta didik yang tersebut di bawah ini:
                  </p>
                  <table className="identity-table">
                    <tbody>
                      {([
                        ['Nama Lengkap',              <strong key="n" style={{ textTransform: 'uppercase' }}>{docData.student.name}</strong>],
                        ['Tempat, Tanggal Lahir',     `${docData.student.placeOfBirth || '-'}, ${formatDate(docData.student.dateOfBirth)}`],
                        ['Nama Orang Tua / Wali',     docData.student.parentName || '-'],
                        ['Nomor Induk Siswa Nasional (NISN)', docData.student.nisn],
                      ] as [string, React.ReactNode][]).map(([label, value], i) => (
                        <tr key={i}>
                          <td className="col-label">{label}</td>
                          <td className="col-sep">:</td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="skl-para">
                    telah mengikuti seluruh program pembelajaran dan berdasarkan hasil rapat
                    Dewan Guru {docData.schoolProfile.name || 'Madrasah Ibtidaiyah Bustanul Huda 01'} tentang
                    Penetapan Kelulusan Peserta Didik Tahun Pelajaran {docData.academicYear}, serta
                    memperhatikan pencapaian kompetensi peserta didik pada Kurikulum yang berlaku,
                    maka yang bersangkutan dinyatakan:
                  </p>
                  <div className="lulus-stamp-wrap">
                    <span className="lulus-stamp">L U L U S</span>
                  </div>
                  {withTranscript && (
                    <>
                      <p className="skl-para" style={{ marginBottom: '6px' }}>
                        dengan hasil Ujian Madrasah sebagai berikut:
                      </p>
                      <table className="skl-nilai-table">
                        <thead>
                          <tr>
                            <th className="col-no">No</th>
                            <th className="col-mapel">Mata Pelajaran</th>
                            <th className="col-nilai">Nilai Ujian</th>
                          </tr>
                        </thead>
                        <tbody>
                          {docData.grades.filter((g: any) => g.examScore > 0).map((g: any, idx: number) => (
                            <tr key={idx}>
                              <td className="col-no">{idx + 1}</td>
                              <td className="col-mapel">{g.subjectName}</td>
                              <td className="col-nilai">{Number(g.examScore).toFixed(2).replace('.', ',')}</td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold', paddingRight: '12px' }}>RATA-RATA</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{(() => {
                                const valid = docData.grades.filter((g: any) => g.examScore > 0);
                                const total = valid.reduce((acc: number, curr: any) => acc + Number(curr.examScore), 0);
                                const avg = valid.length > 0 ? total / valid.length : 0;
                                return Number(avg).toFixed(2).replace('.', ',');
                              })()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </>
                  )}
                  <p className="skl-para" style={withTranscript ? { marginTop: '8px' } : undefined}>
                    Surat Keterangan Lulus ini bersifat sementara dan dinyatakan berlaku sampai
                    dengan diterbitkannya Ijazah asli. Demikian Surat Keterangan Lulus ini dibuat
                    dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.
                  </p>
                </div>
                <div className="ttd-wrap">
                  <div className="ttd-block">
                    <p>{docData.schoolProfile.city || 'Bondowoso'}, {formatDate(docData.student.graduationDate)}</p>
                    <p>Kepala Madrasah,</p>
                    <div className="ttd-space" />
                    <p className="ttd-name">{docData.schoolProfile.headmaster}</p>
                    <p>NIP. {docData.schoolProfile.headmasterNip || '–'}</p>
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
