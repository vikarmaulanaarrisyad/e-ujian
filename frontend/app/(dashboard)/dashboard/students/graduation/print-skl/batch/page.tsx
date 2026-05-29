'use client';

import React, { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { Loader2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface StudentData {
  grades?: any[];
  averageExamScore?: number;
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: string;
  placeOfBirth: string | null;
  dateOfBirth: string | null;
  parentName: string | null;
  graduationDate: string | null;
  certificateNumber: string | null;
  sklNumber: string | null;
}

interface BatchSklData {
  students: StudentData[];
  schoolProfile: {
    name: string;
    npsn: string;
    address: string;
    headmaster: string;
    headmasterNip: string;
    city: string | null;
    logoUrl: string | null;
    sklNumberFormat: string | null;
    nsm?: string | null;
    tenant?: { name: string };
  };
  academicYear: string;
}

export default function PrintSKLBatchPage() {
  const [data, setData] = useState<BatchSklData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/documents/skl-batch');
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Gagal mengambil data SKL massal.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownloadBatchPdf = async () => {
    if (!containerRef.current || !data) return;
    
    try {
      setDownloading(true);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const pages = containerRef.current.querySelectorAll('.skl-page');
      
      for (let i = 0; i < pages.length; i++) {
        const element = pages[i] as HTMLElement;
        
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      const fileName = `SKL_Massal_${data.schoolProfile.name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
      pdf.save(fileName);
      
    } catch (err) {
      console.error('Error generating batch PDF:', err);
      alert('Terjadi kesalahan saat mengunduh PDF massal.');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-500 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="font-medium">Memuat dokumen SKL massal...</p>
        <p className="text-sm text-slate-400">Menyiapkan semua SKL siswa lulus</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center max-w-md">
          <p className="text-red-500 font-bold text-lg mb-2">Gagal Memuat Data</p>
          <p className="text-slate-600 text-sm">{error || 'Data tidak ditemukan'}</p>
          <button onClick={() => window.close()} className="mt-6 px-6 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-medium hover:bg-slate-600 transition">
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const { students, schoolProfile, academicYear } = data;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #cbd5e1;
          font-family: "Times New Roman", Times, serif;
          padding-bottom: 80px;
        }

        /* ═══ PAGE ═══ */
        .skl-page {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 24px auto;
          box-shadow: 0 6px 28px rgba(0,0,0,0.16);
          color: #000;
          position: relative;
          page-break-inside: avoid;
        }

        .page-inner {
          padding: 1.8cm 2cm 2cm;
          min-height: 297mm;
          display: flex;
          flex-direction: column;
        }

        /* ═══ KOP SURAT ═══ */
        .kop-surat {
          display: flex;
          align-items: stretch;
          gap: 0;
          padding-bottom: 10px;
        }

        .kop-logo-left {
          width: 88px;
          min-width: 88px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-right: 10px;
        }

        .kop-logo-right {
          width: 88px;
          min-width: 88px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 10px;
        }

        .kop-logo-left img,
        .kop-logo-right img {
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
          text-align: center;
          line-height: 1.4;
        }

        .kop-logo-kemenag-placeholder {
          border-color: #ccc;
          color: #bbb;
          font-size: 9px;
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

        .kop-line-instansi {
          font-size: 11.5px;
          font-weight: normal;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          line-height: 1.4;
        }

        .kop-line-yayasan {
          font-size: 12.5px;
          font-weight: bold;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          line-height: 1.4;
        }

        .kop-line-sekolah {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          line-height: 1.2;
          margin: 3px 0;
        }

        .kop-line-akreditasi {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .kop-line-alamat {
          font-size: 11px;
          font-weight: normal;
          line-height: 1.5;
          max-width: 380px;
        }

        /* Garis kop: tebal + tipis */
        .kop-divider { margin-top: 10px; }
        .kop-divider-thick { height: 3.5px; background: #000; margin-bottom: 1.5px; }
        .kop-divider-thin  { height: 1px;   background: #000; }

        /* ═══ JUDUL ═══ */
        .skl-judul-wrap {
          text-align: center;
          margin-top: 22px;
          margin-bottom: 18px;
        }
        .skl-judul {
          display: block;
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
          text-decoration: underline;
          letter-spacing: 2px;
          margin-bottom: 5px;
        }
        .skl-nomor {
          font-size: 13px;
        }

        /* ═══ BODY ═══ */
        .skl-body {
          flex: 1;
          font-size: 13px;
          line-height: 1.85;
        }
        .skl-para {
          text-align: justify;
          margin-bottom: 10px;
        }

        .identity-table {
          margin: 4px 0 14px 24px;
          border-collapse: collapse;
          width: calc(100% - 24px);
        }
        .identity-table td {
          padding: 2.5px 0;
          vertical-align: top;
          font-size: 13px;
          line-height: 1.6;
        }
        .identity-table .col-label { width: 195px; }
        .identity-table .col-sep   { width: 16px; }

        .lulus-stamp-wrap {
          text-align: center;
          margin: 16px 0 14px;
        }
        
              .skl-nilai-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; font-family: "Times New Roman", Times, serif; }
              .skl-nilai-table th, .skl-nilai-table td { border: 1.5px solid black; padding: 2px 6px; font-size: 13px; }
              .skl-nilai-table th { text-align: center; font-weight: bold; }
              .skl-nilai-table .col-no { width: 40px; text-align: center; }
              .skl-nilai-table .col-mapel { text-align: left; }
              .skl-nilai-table .col-nilai { width: 100px; text-align: center; font-weight: bold; }
        .lulus-stamp {
          display: inline-block;
          font-size: 26px;
          font-weight: 900;
          letter-spacing: 8px;
          border: 2.5px solid #000;
          padding: 9px 52px;
          border-radius: 6px;
        }

        /* ═══ TANDA TANGAN ═══ */
        .ttd-wrap {
          margin-top: auto;
          padding-top: 20px;
          display: flex;
          justify-content: flex-end;
        }
        .ttd-block {
          text-align: center;
          width: 220px;
          font-size: 13px;
          line-height: 1.7;
        }
        .ttd-space { height: 80px; }
        .ttd-name {
          font-weight: bold;
          text-decoration: underline;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ═══ TOOLBAR ═══ */
        .toolbar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: rgba(15,23,42,0.97);
          border-top: 1px solid rgba(99,102,241,0.3);
          padding: 10px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 999;
          font-family: ui-sans-serif, system-ui, sans-serif;
        }
      `}} />

      {/* Toolbar */}
      <div className="toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '6px', background: 'rgba(20,184,166,0.15)', borderRadius: '8px' }}>
            <Download style={{ width: '16px', height: '16px', color: '#2dd4bf' }} />
          </div>
          <div>
            <p style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: '600' }}>Download Massal SKL (PDF)</p>
            <p style={{ color: '#64748b', fontSize: '11px' }}>
              {students.length} siswa lulus · Tahun Pelajaran {academicYear}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownloadBatchPdf}
            disabled={downloading}
            style={{ padding: '8px 22px', background: downloading ? '#0f766e' : '#14b8a6', color: 'white', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: downloading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Memproses PDF...' : `Download Semua (${students.length})`}
          </button>
          <button
            onClick={() => window.close()}
            style={{ padding: '8px 18px', background: '#334155', color: '#e2e8f0', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Pages Container */}
      <div ref={containerRef}>
        {students.map((student) => {
          const sklNumber = student.sklNumber || `........./MI.BH/${new Date().getFullYear()}`;

          return (
            <div key={student.id} className="skl-page">
              <div className="page-inner">

                {/* ── KOP SURAT ── */}
                <div className="kop-surat">
                  <div className="kop-logo-left">
                    {schoolProfile.logoUrl
                      ? <img src={schoolProfile.logoUrl} alt="Logo" crossOrigin="anonymous" />
                      : <div className="kop-logo-placeholder">LOGO<br/>MADRASAH</div>
                    }
                  </div>

                  <div className="kop-text">
                    <span className="kop-line-yayasan">{schoolProfile?.name?.toUpperCase() || schoolProfile?.tenant?.name?.toUpperCase() || "YAYASAN BUSTANUL HUDA DAWUHAN"}</span>
                    <span className="kop-line-sekolah">{schoolProfile.name || 'MADRASAH IBTIDAIYAH BUSTANUL HUDA 01'}</span>
                    <span className="kop-line-akreditasi">
                      Terakreditasi &ldquo;A&rdquo;&ensp;|&ensp;NPSN: {schoolProfile.npsn || '60713609'}&ensp;|&ensp;NSM: {schoolProfile?.nsm || "-"}
                    </span>
                    <span className="kop-line-alamat">{schoolProfile.address}</span>
                  </div>

                  <div className="kop-logo-right">
                    <div className="kop-logo-placeholder kop-logo-kemenag-placeholder">
                      LOGO<br/>KEMENAG
                    </div>
                  </div>
                </div>

                {/* Garis kop */}
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
                      {([
                        ['Nama Lengkap',              <strong key="n" style={{ textTransform: 'uppercase' }}>{student.name}</strong>],
                        ['Tempat, Tanggal Lahir',     `${student.placeOfBirth || '-'}, ${formatDate(student.dateOfBirth)}`],
                        ['Nama Orang Tua / Wali',     student.parentName || '-'],
                        ['Nomor Induk Siswa Nasional (NISN)', student.nisn],
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
                    Dewan Guru {schoolProfile.name || 'Madrasah Ibtidaiyah Bustanul Huda 01'} tentang
                    Penetapan Kelulusan Peserta Didik Tahun Pelajaran {academicYear}, serta
                    memperhatikan pencapaian kompetensi peserta didik pada Kurikulum yang berlaku,
                    maka yang bersangkutan dinyatakan:
                  </p>

                  <div className="lulus-stamp-wrap">
                    <span className="lulus-stamp">L U L U S</span>
                  </div>
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
                      {(student.grades || []).map((g: any, idx: number) => (
                        <tr key={idx}>
                          <td className="col-no">{idx + 1}</td>
                          <td className="col-mapel">{g.subjectName}</td>
                          <td className="col-nilai">{Number(g.examScore).toFixed(2).replace('.', ',')}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold', paddingRight: '12px' }}>RATA-RATA</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{Number(student.averageExamScore).toFixed(2).replace('.', ',')}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="skl-para" style={{ marginTop: '8px' }}>
                    Surat Keterangan Lulus ini bersifat sementara dan dinyatakan berlaku sampai
                    dengan diterbitkannya Ijazah asli. Demikian Surat Keterangan Lulus ini dibuat
                    dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.
                  </p>
                </div>

                {/* ── TANDA TANGAN ── */}
                <div className="ttd-wrap">
                  <div className="ttd-block">
                    <p>{schoolProfile.city || 'Tegal'}, {formatDate(student.graduationDate)}</p>
                    <p>Kepala Madrasah,</p>
                    <div className="ttd-space" />
                    <p className="ttd-name">{schoolProfile.headmaster}</p>
                    <p>NIP. {schoolProfile.headmasterNip || '–'}</p>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
