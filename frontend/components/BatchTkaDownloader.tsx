import React, { useState, useRef } from 'react';
import api from '@/lib/api';
import { Loader2, Download, ClipboardList } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface BatchTkaDownloaderProps {
  className?: string;
}

export default function BatchTkaDownloader({ className }: BatchTkaDownloaderProps) {
  const [downloading, setDownloading] = useState(false);
  const [batchData, setBatchData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      const res = await api.get('/documents/tka-batch');
      const data = res.data;
      setBatchData(data);
      
      // Give React a moment to render the hidden DOM elements
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
      
      const pages = containerRef.current.querySelectorAll('.tka-page');
      
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
      
      const fileName = `Surat_Pernyataan_TKA_${data.schoolProfile.name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
      pdf.save(fileName);
      
    } catch (err) {
      console.error('Error generating batch PDF:', err);
      alert('Terjadi kesalahan saat mengunduh PDF TKA.');
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
        onClick={handleDownload}
        disabled={downloading}
        className={className || "px-4 py-2.5 bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10 disabled:opacity-70 disabled:cursor-not-allowed"}
      >
        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
        {downloading ? 'Memproses PDF...' : 'Unduh Surat TKA (Massal)'}
      </button>

      {/* Hidden container for rendering PDF pages */}
      {batchData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -9999, pointerEvents: 'none' }}>
          <div ref={containerRef}>
            <style dangerouslySetInnerHTML={{ __html: `
              .tka-page {
                background: white;
                width: 210mm;
                min-height: 297mm;
                color: #000;
                font-family: "Times New Roman", Times, serif;
                position: relative;
              }
              .page-inner { padding: 2cm; min-height: 297mm; display: flex; flex-direction: column; box-sizing: border-box; }
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
            `}} />
            
            {batchData.students.map((student: any, index: number) => (
              <div key={student.id} className="tka-page">
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
                            <span className="kop-line-yayasan">YAYASAN BUSTANUL HUDA DAWUHAN</span>
                            <span className="kop-line-sekolah">{batchData.schoolProfile.name || 'MADRASAH IBTIDAIYAH BUSTANUL HUDA 01 DAWUHAN'}</span>
                            <span className="kop-line-akreditasi">
                              TERAKREDITASI A NSM {batchData.schoolProfile.nsm || '111233280040'} NPSN {batchData.schoolProfile.npsn || '60713609'}
                            </span>
                            <span className="kop-line-alamat">Alamat : {batchData.schoolProfile.address}</span>
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

                {/* TITLE */}
                <div style={{ textAlign: 'center', margin: '30px 0' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', textDecoration: 'underline' }}>
                    SURAT PERNYATAAN NILAI TES KEMAMPUAN AKADEMIK (TKA)
                  </div>
                  <div style={{ fontSize: '14px', marginTop: '5px' }}>
                    Tahun Ajaran {batchData.academicYear}
                  </div>
                </div>

                {/* CONTENT */}
                <div style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', marginBottom: '20px' }}>
                  Yang bertanda tangan di bawah ini Kepala {batchData.schoolProfile.name}, menerangkan bahwa:
                </div>

                <table style={{ width: '100%', fontSize: '14px', marginBottom: '20px', marginLeft: '20px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '150px', padding: '4px 0' }}>Nama Lengkap</td>
                      <td style={{ width: '20px' }}>:</td>
                      <td style={{ fontWeight: 'bold' }}>{student.name}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0' }}>Tempat, Tanggal Lahir</td>
                      <td>:</td>
                      <td>{student.placeOfBirth || '-'}, {formatDate(student.dateOfBirth)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0' }}>NISN</td>
                      <td>:</td>
                      <td>{student.nisn || '-'}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', marginBottom: '20px' }}>
                  Telah mengikuti Tes Kemampuan Akademik (TKA) yang diselenggarakan oleh madrasah dengan hasil nilai sebagai berikut:
                </div>

                {/* GRADES TABLE */}
                <div style={{ padding: '0 40px', marginBottom: '30px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'center' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid black', padding: '8px', width: '50px' }}>No</th>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Mata Pelajaran Ujian</th>
                        <th style={{ border: '1px solid black', padding: '8px', width: '100px' }}>Nilai</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid black', padding: '8px' }}>1</td>
                        <td style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Matematika</td>
                        <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>{student.mathScore || 0}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid black', padding: '8px' }}>2</td>
                        <td style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Bahasa Indonesia</td>
                        <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>{student.indoScore || 0}</td>
                      </tr>
                      <tr>
                        <td colSpan={2} style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>Rata - Rata</td>
                        <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>
                          {(((student.mathScore || 0) + (student.indoScore || 0)) / 2).toFixed(1).replace('.0', '')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', marginBottom: '40px' }}>
                  Demikian surat keterangan hasil nilai TKA ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
                </div>

                {/* SIGNATURE */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <div style={{ width: '250px', textAlign: 'center', fontSize: '14px' }}>
                    <div style={{ marginBottom: '5px' }}>
                      {batchData.schoolProfile.city || 'Bondowoso'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div>Kepala Madrasah,</div>
                    <div style={{ height: '70px' }}></div>
                    <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                      {batchData.schoolProfile.headmaster || '_______________________'}
                    </div>
                    <div>NIP. {batchData.schoolProfile.headmasterNip || '-'}</div>
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
