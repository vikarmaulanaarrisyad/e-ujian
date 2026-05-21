'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, Printer } from 'lucide-react';

interface StudentData {
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
  };
  academicYear: string;
}

export default function PrintSKLBatchPage() {
  const [data, setData] = useState<BatchSklData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (data && !loading && !error) {
      setTimeout(() => {
        window.print();
      }, 800);
    }
  }, [data, loading, error]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
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
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-red-500 font-bold text-lg mb-2">Gagal Memuat Data</p>
          <p className="text-slate-600 text-sm">{error || 'Data tidak ditemukan'}</p>
          <button
            onClick={() => window.close()}
            className="mt-6 px-6 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-medium hover:bg-slate-600 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const { students, schoolProfile, academicYear } = data;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white;
            margin: 0;
            padding: 0;
          }
          .skl-page {
            page-break-after: always;
            page-break-inside: avoid;
          }
          .skl-page:last-child {
            page-break-after: avoid;
          }
          .no-print {
            display: none !important;
          }
          .print-wrapper {
            padding: 2cm 2.5cm;
          }
        }

        body {
          background: #e2e8f0;
          margin: 0;
          padding: 0;
        }

        /* No-print toolbar */
        .no-print {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(148, 163, 184, 0.15);
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-between;
          gap: 16px;
          z-index: 100;
          font-family: ui-sans-serif, system-ui, sans-serif;
        }

        .skl-page {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          color: black;
          font-family: "Times New Roman", Times, serif;
          position: relative;
          overflow: hidden;
        }

        .print-wrapper {
          padding: 2cm 2.5cm;
          min-height: 297mm;
          display: flex;
          flex-direction: column;
        }

        .kop-surat {
          border-bottom: 3px solid black;
          padding-bottom: 10px;
          margin-bottom: 20px;
          position: relative;
        }
        .kop-surat::after {
          content: "";
          position: absolute;
          bottom: -5px;
          left: 0;
          right: 0;
          border-bottom: 3px solid black;
        }
        .kop-surat::before {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 0;
          right: 0;
          border-bottom: 1px solid black;
        }

        .kop-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: center;
        }

        .kop-logo {
          width: 90px;
          height: 90px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kop-logo img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .kop-logo-placeholder {
          width: 100%;
          height: 100%;
          border: 1px dashed #aaa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: #888;
        }

        .kop-text {
          flex: 1;
          padding: 0 16px;
        }

        .kop-spacer {
          width: 90px;
          flex-shrink: 0;
        }

        .lulus-stamp {
          display: inline-block;
          border: 2px solid black;
          padding: 10px 48px;
          border-radius: 8px;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 0.25em;
          margin: 24px 0;
        }

        .identity-table td {
          padding: 4px 0;
          vertical-align: top;
          font-size: 14px;
        }

        .identity-table td:first-child {
          width: 200px;
        }

        .identity-table td:nth-child(2) {
          width: 16px;
        }

        .content-body {
          flex: 1;
        }

        .signature-block {
          margin-top: 64px;
          display: flex;
          justify-content: flex-end;
        }

        .signature-inner {
          width: 240px;
          text-align: center;
          font-size: 14px;
        }

        .signature-space {
          height: 88px;
        }

        p.skl-para {
          text-align: justify;
          line-height: 1.7;
          font-size: 14px;
          margin: 0 0 16px 0;
        }

        h1.skl-title {
          font-size: 18px;
          font-weight: bold;
          text-decoration: underline;
          text-transform: uppercase;
          margin: 0 0 4px 0;
        }

        p.skl-nomor {
          font-size: 13px;
          margin: 0 0 24px 0;
        }
      `}} />

      {/* Toolbar (no-print) */}
      <div className="no-print flex items-center justify-between px-6 py-3 bg-slate-900 border-t border-slate-700 text-white font-sans fixed bottom-0 left-0 right-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center">
            <Printer className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Cetak Massal SKL</p>
            <p className="text-xs text-slate-400">{students.length} siswa lulus · Tahun Pelajaran {academicYear}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak Semua ({students.length})
          </button>
          <button
            onClick={() => window.close()}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Extra bottom padding for toolbar */}
      <div style={{ paddingBottom: '80px' }}>
        {students.map((student) => {
          const sklNumber = student.sklNumber || `___/MI.BH/${new Date().getFullYear()}`;
          
          return (
            <div key={student.id} className="skl-page">
              <div className="print-wrapper">
                {/* KOP Surat */}
                <div className="kop-surat">
                  <div className="kop-inner">
                    <div className="kop-logo">
                      {schoolProfile.logoUrl ? (
                        <img src={schoolProfile.logoUrl} alt="Logo Madrasah" />
                      ) : (
                        <div className="kop-logo-placeholder">LOGO</div>
                      )}
                    </div>

                    <div className="kop-text">
                      <p style={{ fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        YAYASAN BUSTANUL HUDA DAWUHAN
                      </p>
                      <p style={{ fontWeight: '900', fontSize: '20px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                        {schoolProfile.name || 'MI BUSTANUL HUDA 01 DAWUHAN'}
                      </p>
                      <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '3px' }}>
                        TERAKREDITASI A &nbsp;&nbsp; NPSN : {schoolProfile.npsn || '60713609'} &nbsp;&nbsp; NSM : 111233280040
                      </p>
                      <p style={{ fontSize: '12px' }}>{schoolProfile.address}</p>
                    </div>

                    <div className="kop-spacer" />
                  </div>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h1 className="skl-title">Surat Keterangan Lulus</h1>
                  <p className="skl-nomor">Nomor: {sklNumber}</p>
                </div>

                {/* Body */}
                <div className="content-body">
                  <p className="skl-para">
                    Yang bertanda tangan di bawah ini, Kepala Madrasah Ibtidaiyah Bustanul Huda,
                    menerangkan dengan sesungguhnya bahwa:
                  </p>

                  <table className="identity-table" style={{ marginLeft: '32px', marginBottom: '20px', width: 'calc(100% - 32px)' }}>
                    <tbody>
                      <tr>
                        <td>Nama Lengkap</td>
                        <td>:</td>
                        <td style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{student.name}</td>
                      </tr>
                      <tr>
                        <td>Tempat, Tanggal Lahir</td>
                        <td>:</td>
                        <td>{student.placeOfBirth || '-'}, {formatDate(student.dateOfBirth)}</td>
                      </tr>
                      <tr>
                        <td>Nama Orang Tua / Wali</td>
                        <td>:</td>
                        <td>{student.parentName || '-'}</td>
                      </tr>
                      <tr>
                        <td>Nomor Induk Siswa (NIS)</td>
                        <td>:</td>
                        <td>{student.nis}</td>
                      </tr>
                      <tr>
                        <td>Nomor Induk Siswa Nasional</td>
                        <td>:</td>
                        <td>{student.nisn}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="skl-para">
                    Berdasarkan hasil rapat Dewan Guru Madrasah Ibtidaiyah Bustanul Huda tentang
                    penetapan kelulusan tahun pelajaran {academicYear}, serta memperhatikan pencapaian
                    hasil belajar peserta didik pada Kurikulum yang berlaku, maka siswa tersebut di
                    atas dinyatakan:
                  </p>

                  <div style={{ textAlign: 'center' }}>
                    <span className="lulus-stamp">L U L U S</span>
                  </div>

                  <p className="skl-para">
                    Demikian Surat Keterangan Lulus ini dibuat dengan sebenarnya untuk dapat
                    dipergunakan sebagaimana mestinya hingga diterbitkannya Ijazah asli.
                  </p>
                </div>

                {/* Signature */}
                <div className="signature-block">
                  <div className="signature-inner">
                    <p style={{ marginBottom: '4px' }}>
                      {schoolProfile.city || 'Bondowoso'}, {formatDate(student.graduationDate)}
                    </p>
                    <p style={{ marginBottom: 0 }}>Kepala Madrasah,</p>
                    <div className="signature-space" />
                    <p style={{ fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase', marginBottom: '2px' }}>
                      {schoolProfile.headmaster}
                    </p>
                    <p>NIP. {schoolProfile.headmasterNip || '-'}</p>
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
