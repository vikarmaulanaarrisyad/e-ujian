'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PrintSKLPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await api.get(`/documents/student/${id}`);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Gagal mengambil data SKL.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    
    try {
      setDownloading(true);
      
      const element = printRef.current;
      
      // html2canvas needs the element to be visible and correctly scaled
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true, // To load images from different origins if needed
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // A4 dimensions: 210 x 297 mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `SKL_${data?.student?.name || 'Siswa'}_${new Date().getFullYear()}.pdf`;
      pdf.save(fileName);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Terjadi kesalahan saat mengunduh PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
        <p>Memuat Dokumen SKL...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200 text-center max-w-md">
          <p className="text-red-500 font-bold mb-2">Error</p>
          <p className="text-slate-600 text-sm">{error || 'Data tidak ditemukan'}</p>
        </div>
      </div>
    );
  }

  const { student, schoolProfile, academicYear } = data;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const sklNumber = student.sklNumber || `........./MI.BH/${new Date().getFullYear()}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman:wght@400;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #cbd5e1;
          font-family: "Times New Roman", Times, serif;
        }

        .page-wrapper {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 24px auto 80px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          position: relative;
          color: #000;
        }

        .page-inner {
          padding: 1.8cm 2cm 2cm;
        }

        /* ═══ KOP SURAT ═══ */
        .kop-surat {
          display: flex;
          align-items: stretch;
          gap: 0;
          margin-bottom: 0;
          padding-bottom: 10px;
        }

        .kop-logo-wrap {
          width: 88px;
          min-width: 88px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-right: 10px;
        }

        .kop-logo-wrap img {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }

        .kop-logo-placeholder {
          width: 80px;
          height: 80px;
          border: 1.5px dashed #999;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #999;
          letter-spacing: 1px;
        }

        .kop-logo-right {
          width: 88px;
          min-width: 88px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 10px;
        }

        .kop-text {
          flex: 1;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }

        .kop-instansi {
          font-size: 11.5px;
          font-weight: normal;
          letter-spacing: 0.5px;
          line-height: 1.4;
          text-transform: uppercase;
          color: #222;
        }

        .kop-yayasan {
          font-size: 12.5px;
          font-weight: bold;
          letter-spacing: 0.5px;
          line-height: 1.4;
          text-transform: uppercase;
          color: #000;
        }

        .kop-sekolah {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          line-height: 1.2;
          color: #000;
          margin-top: 2px;
          margin-bottom: 2px;
        }

        .kop-akreditasi {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.3px;
          color: #111;
          margin-top: 1px;
        }

        .kop-alamat {
          font-size: 11px;
          font-weight: normal;
          color: #222;
          line-height: 1.5;
          max-width: 380px;
        }

        /* Garis kop: tebal di atas, tipis di bawah */
        .kop-divider {
          margin-top: 10px;
          border: none;
        }
        .kop-divider-thick {
          height: 3.5px;
          background: #000;
          margin-bottom: 1.5px;
        }
        .kop-divider-thin {
          height: 1px;
          background: #000;
        }

        /* ═══ JUDUL SKL ═══ */
        .skl-judul-wrap {
          margin-top: 22px;
          margin-bottom: 20px;
          text-align: center;
        }

        .skl-judul {
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
          text-decoration: underline;
          letter-spacing: 2px;
          display: block;
          margin-bottom: 5px;
        }

        .skl-nomor {
          font-size: 13px;
          letter-spacing: 0.3px;
        }

        /* ═══ BODY ═══ */
        .skl-body {
          font-size: 13px;
          line-height: 1.85;
          color: #000;
        }

        .skl-para {
          text-align: justify;
          margin-bottom: 12px;
        }

        .identity-table {
          margin: 4px 0 16px 24px;
          border-collapse: collapse;
          width: calc(100% - 24px);
        }

        .identity-table td {
          padding: 3px 0;
          vertical-align: top;
          font-size: 13px;
        }

        .identity-table .col-label { width: 195px; }
        .identity-table .col-sep   { width: 16px; font-weight: normal; }
        .identity-table .col-value { }

        .lulus-stamp-wrap {
          text-align: center;
          margin: 18px 0 16px;
        }

        .lulus-stamp {
          display: inline-block;
          font-size: 26px;
          font-weight: 900;
          letter-spacing: 8px;
          border: 2.5px solid #000;
          padding: 10px 52px;
          border-radius: 6px;
        }

        /* ═══ TANDA TANGAN ═══ */
        .ttd-wrap {
          margin-top: 28px;
          display: flex;
          justify-content: flex-end;
        }

        .ttd-block {
          text-align: center;
          width: 220px;
          font-size: 13px;
          line-height: 1.7;
        }

        .ttd-space {
          height: 82px;
        }

        .ttd-name {
          font-weight: bold;
          text-decoration: underline;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ═══ NO PRINT TOOLBAR ═══ */
        .no-print {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: rgba(15, 23, 42, 0.97);
          border-top: 1px solid rgba(99,102,241,0.3);
          padding: 12px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 999;
          font-family: ui-sans-serif, system-ui, sans-serif;
        }
      `}} />

      {/* Floating Toolbar */}
      <div className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>
            SKL — <strong style={{ color: '#e2e8f0' }}>{student.name}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            style={{ padding: '8px 20px', background: downloading ? '#6366f1' : '#4f46e5', color: 'white', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: downloading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Menyiapkan PDF...' : 'Download PDF'}
          </button>
          <button
            onClick={() => window.close()}
            style={{ padding: '8px 20px', background: '#334155', color: '#e2e8f0', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Document */}
      <div className="flex justify-center w-full">
        <div className="page-wrapper" ref={printRef}>
          <div className="page-inner">

            {/* ── KOP SURAT ── */}
            <div className="kop-surat">
              {/* Logo kiri */}
              <div className="kop-logo-wrap">
                {schoolProfile.logoUrl
                  ? <img src={schoolProfile.logoUrl} alt="Logo Madrasah" crossOrigin="anonymous" />
                  : <div className="kop-logo-placeholder">LOGO</div>
                }
              </div>

              {/* Teks tengah */}
              <div className="kop-text">
                <span className="kop-yayasan">{schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN"}</span>
                <span className="kop-sekolah">{schoolProfile.name || 'MADRASAH IBTIDAIYAH BUSTANUL HUDA 01'}</span>
                <span className="kop-akreditasi">
                  Terakreditasi &ldquo;A&rdquo;&ensp;|&ensp;NPSN: {schoolProfile.npsn || '60713609'}&ensp;|&ensp;NSM: {schoolProfile?.nsm || "-"}
                </span>
                <span className="kop-alamat">{schoolProfile.address}</span>
              </div>

              {/* Sisi kanan — kosong untuk keseimbangan (bisa diisi logo Kemenag jika ada) */}
              <div className="kop-logo-right">
                <div className="kop-logo-placeholder" style={{ fontSize: '9px', color: '#bbb', borderColor: '#ddd' }}>
                  KEMENAG
                </div>
              </div>
            </div>

            {/* Garis pemisah kop */}
            <div className="kop-divider">
              <div className="kop-divider-thick" />
              <div className="kop-divider-thin" />
            </div>

            {/* ── JUDUL ── */}
            <div className="skl-judul-wrap">
              <span className="skl-judul">SURAT KETERANGAN LULUS</span>
              <span className="skl-nomor">Nomor: {sklNumber}</span>
            </div>

            {/* ── BODY ── */}
            <div className="skl-body">
              <p className="skl-para">
                Yang bertanda tangan di bawah ini, Kepala {schoolProfile.name || 'Madrasah Ibtidaiyah Bustanul Huda 01 Dawuhan'},
                Kecamatan Tamanan, Kabupaten Bondowoso, Provinsi Jawa Timur, menerangkan
                dengan sesungguhnya bahwa peserta didik yang tersebut di bawah ini:
              </p>

              <table className="identity-table">
                <tbody>
                  {[
                    ['Nama Lengkap',              <strong style={{ textTransform: 'uppercase' }}>{student.name}</strong>],
                    ['Tempat, Tanggal Lahir',     `${student.placeOfBirth || '-'}, ${formatDate(student.dateOfBirth)}`],
                    ['Nama Orang Tua / Wali',     student.parentName || '-'],
                    ['Nomor Induk Siswa (NIS)',   student.nis],
                    ['Nomor Induk Siswa Nasional (NISN)', student.nisn],
                  ].map(([label, value], i) => (
                    <tr key={i}>
                      <td className="col-label">{label}</td>
                      <td className="col-sep">:</td>
                      <td className="col-value">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="skl-para">
                telah mengikuti seluruh program pembelajaran dan berdasarkan hasil rapat Dewan
                Guru {schoolProfile.name || 'Madrasah Ibtidaiyah Bustanul Huda 01'} tentang
                Penetapan Kelulusan Peserta Didik Tahun Pelajaran {academicYear}, serta
                memperhatikan pencapaian kompetensi peserta didik pada Kurikulum yang berlaku,
                maka yang bersangkutan dinyatakan:
              </p>

              <div className="lulus-stamp-wrap">
                <span className="lulus-stamp">L U L U S</span>
              </div>

              <p className="skl-para">
                Surat Keterangan Lulus ini bersifat sementara dan dinyatakan berlaku sampai
                dengan diterbitkannya Ijazah asli. Demikian Surat Keterangan Lulus ini dibuat
                dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.
              </p>
            </div>

            {/* ── TANDA TANGAN ── */}
            <div className="ttd-wrap">
              <div className="ttd-block">
                <p>{schoolProfile.city || 'Bondowoso'}, {formatDate(student.graduationDate)}</p>
                <p>Kepala Madrasah,</p>
                <div className="ttd-space" />
                <p className="ttd-name">{schoolProfile.headmaster}</p>
                <p>NIP. {schoolProfile.headmasterNip || '–'}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

