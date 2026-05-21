'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function PrintSKLPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (data && !loading && !error) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [data, loading, error]);

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; background: white; margin: 0; padding: 0; }
          .print-container { padding: 2cm 2.5cm; }
          .no-print { display: none !important; }
        }
        body { background: #e2e8f0; }
        .print-container { 
          background: white; 
          width: 210mm; 
          min-height: 297mm; 
          margin: 20px auto; 
          padding: 2cm 2.5cm;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          color: black;
          font-family: "Times New Roman", Times, serif;
          position: relative;
        }
        .kop-surat {
          border-bottom: 3px solid black;
          padding-bottom: 10px;
          margin-bottom: 25px;
          text-align: center;
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
      `}} />

      {/* Floating back button for non-print view */}
      <div className="fixed bottom-6 right-6 no-print">
        <button onClick={() => window.close()} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl shadow-xl hover:bg-slate-700 transition font-sans text-sm">
          Tutup & Kembali
        </button>
      </div>

      <div className="print-container">
        {/* KOP Surat */}
        <div className="kop-surat">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="w-24 h-24 shrink-0 relative flex items-center justify-center">
              {schoolProfile.logoUrl ? (
                <img src={schoolProfile.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="w-full h-full border border-dashed border-gray-400 flex items-center justify-center">
                  <span className="text-xs text-gray-400">LOGO</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center px-4">
              <h2 className="text-xl font-bold uppercase tracking-wider mb-1">YAYASAN BUSTANUL HUDA DAWUHAN</h2>
              <h1 className="text-2xl font-extrabold uppercase tracking-widest mb-2">{schoolProfile.name || 'MI BUSTANUL HUDA 01 DAWUHAN'}</h1>
              <p className="text-[13px] font-semibold mb-1">TERAKREDITASI A &nbsp;&nbsp; NPSN : {schoolProfile.npsn || '60713609'} &nbsp;&nbsp; NSM : 111233280040</p>
              <p className="text-sm">{schoolProfile.address}</p>
            </div>
            
            {/* Empty space for balance */}
            <div className="w-24 h-24 shrink-0"></div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold uppercase underline mb-1">Surat Keterangan Lulus</h3>
          <p className="text-sm">Nomor: B.________/MI.BH/____/{new Date().getFullYear()}</p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-justify leading-relaxed text-[15px]">
          <p>
            Yang bertanda tangan di bawah ini, Kepala Madrasah Ibtidaiyah Bustanul Huda, 
            menerangkan dengan sesungguhnya bahwa:
          </p>

          <table className="w-full ml-8 mb-6">
            <tbody>
              <tr className="align-top">
                <td className="py-1.5 w-48">Nama Lengkap</td>
                <td className="py-1.5 w-4">:</td>
                <td className="py-1.5 font-bold uppercase">{student.name}</td>
              </tr>
              <tr className="align-top">
                <td className="py-1.5">Tempat, Tanggal Lahir</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5">{student.placeOfBirth || '-'}, {formatDate(student.dateOfBirth)}</td>
              </tr>
              <tr className="align-top">
                <td className="py-1.5">Nama Orang Tua / Wali</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5">{student.parentName || '-'}</td>
              </tr>
              <tr className="align-top">
                <td className="py-1.5">Nomor Induk Siswa (NIS)</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5">{student.nis}</td>
              </tr>
              <tr className="align-top">
                <td className="py-1.5">Nomor Induk Siswa Nasional</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5">{student.nisn}</td>
              </tr>
            </tbody>
          </table>

          <p>
            Berdasarkan hasil rapat Dewan Guru Madrasah Ibtidaiyah Bustanul Huda tentang penetapan kelulusan tahun pelajaran {academicYear}, 
            serta memperhatikan pencapaian hasil belajar peserta didik pada Kurikulum yang berlaku, maka siswa tersebut di atas dinyatakan:
          </p>

          <div className="text-center my-8">
            <span className="text-3xl font-extrabold tracking-[0.25em] border-2 border-black px-12 py-3 rounded-lg inline-block">L U L U S</span>
          </div>

          <p>
            Demikian Surat Keterangan Lulus ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya 
            hingga diterbitkannya Ijazah asli.
          </p>
        </div>

        {/* Signature */}
        <div className="mt-20 flex justify-end">
          <div className="w-64 text-center">
            <p className="mb-1">{schoolProfile.city || 'Bondowoso'}, {formatDate(student.graduationDate || new Date().toISOString())}</p>
            <p className="mb-24">Kepala Madrasah,</p>
            <p className="font-bold underline uppercase">{schoolProfile.headmaster}</p>
            <p>NIP. {schoolProfile.headmasterNip || '-'}</p>
          </div>
        </div>

      </div>
    </>
  );
}
