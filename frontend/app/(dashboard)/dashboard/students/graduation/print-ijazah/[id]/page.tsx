'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function PrintIjazahPage() {
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
        setError(err.response?.data?.message || 'Gagal mengambil data Ijazah.');
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
        <p>Memuat Format Ijazah...</p>
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

  const { student, schoolProfile, grades, averageFinalScore, academicYear } = data;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const groupA = grades.filter((g: any) => g.subjectGroup === 'KELOMPOK_A');
  const groupB = grades.filter((g: any) => g.subjectGroup === 'KELOMPOK_B' || g.subjectGroup === 'KELOMPOK_C');

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; background: white; margin: 0; padding: 0; }
          .print-container { padding: 1.5cm 2.5cm; }
          .no-print { display: none !important; }
        }
        body { background: #e2e8f0; }
        .print-container { 
          background: white; 
          width: 210mm; 
          min-height: 297mm; 
          margin: 20px auto; 
          padding: 1.5cm 2.5cm;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          color: black;
          font-family: "Times New Roman", Times, serif;
          position: relative;
        }
        .ijazah-table th, .ijazah-table td {
          border: 1px solid black;
          padding: 6px 12px;
        }
        .ijazah-table th {
          text-align: center;
          font-weight: bold;
        }
      `}} />

      {/* Floating back button for non-print view */}
      <div className="fixed bottom-6 right-6 no-print">
        <button onClick={() => window.close()} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl shadow-xl hover:bg-slate-700 transition font-sans text-sm">
          Tutup & Kembali
        </button>
      </div>

      <div className="print-container">
        
        {/* Header Text */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase tracking-wider mb-1">DAFTAR NILAI MADRASAH IBTIDAIYAH</h2>
          <p className="text-md uppercase mb-1">TAHUN PELAJARAN {academicYear}</p>
        </div>

        {/* Student Biodata */}
        <table className="w-full mb-6 text-[14px]">
          <tbody>
            <tr className="align-top">
              <td className="py-1 w-48">Nama Lengkap</td>
              <td className="py-1 w-4">:</td>
              <td className="py-1 font-bold uppercase">{student.name}</td>
            </tr>
            <tr className="align-top">
              <td className="py-1">Tempat dan Tanggal Lahir</td>
              <td className="py-1">:</td>
              <td className="py-1">{student.placeOfBirth || '-'}, {formatDate(student.dateOfBirth)}</td>
            </tr>
            <tr className="align-top">
              <td className="py-1">Nomor Induk Siswa</td>
              <td className="py-1">:</td>
              <td className="py-1">{student.nis}</td>
            </tr>
            <tr className="align-top">
              <td className="py-1">Nomor Induk Siswa Nasional</td>
              <td className="py-1">:</td>
              <td className="py-1">{student.nisn}</td>
            </tr>
          </tbody>
        </table>

        {/* Grades Table */}
        <table className="w-full ijazah-table text-[14px] mb-8 border-collapse">
          <thead>
            <tr>
              <th className="w-12">No</th>
              <th>Mata Pelajaran</th>
              <th className="w-32">Nilai Ujian</th>
            </tr>
          </thead>
          <tbody>
            {/* Kelompok A */}
            <tr className="bg-gray-100 font-bold">
              <td colSpan={3} className="text-left py-2 px-3">Kelompok A</td>
            </tr>
            {groupA.map((g: any, index: number) => (
              <tr key={g.subjectId}>
                <td className="text-center">{index + 1}</td>
                <td>{g.subjectName}</td>
                <td className="text-center font-semibold">{g.finalScore.toFixed(0)}</td>
              </tr>
            ))}

            {/* Kelompok B */}
            <tr className="bg-gray-100 font-bold">
              <td colSpan={3} className="text-left py-2 px-3">Kelompok B</td>
            </tr>
            {groupB.map((g: any, index: number) => (
              <tr key={g.subjectId}>
                <td className="text-center">{groupA.length + index + 1}</td>
                <td>{g.subjectName}</td>
                <td className="text-center font-semibold">{g.finalScore.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td colSpan={2} className="text-center py-3">Rata - Rata</td>
              <td className="text-center text-lg">{averageFinalScore.toFixed(0)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Footer Signatures */}
        <div className="flex justify-between mt-12 px-8">
          <div className="w-48">
            {/* Photo slot */}
            <div className="w-32 h-40 border border-black flex items-center justify-center text-xs text-center p-2 mb-2">
              Pas Foto<br/>3 x 4 cm<br/><br/>Cap Tiga Jari<br/>Tengah Kiri
            </div>
          </div>
          
          <div className="w-64 text-left">
            <p className="mb-1">{schoolProfile.city}, {formatDate(student.graduationDate || new Date().toISOString())}</p>
            <p className="mb-24">Kepala Madrasah,</p>
            <p className="font-bold underline uppercase">{schoolProfile.headmaster}</p>
            <p>NIP. {schoolProfile.headmasterNip || '-'}</p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="absolute bottom-10 left-10 text-[10px] text-gray-500 font-sans">
          No. Ijazah: <span className="font-bold text-black">{student.certificateNumber || '.....................................'}</span>
        </div>

      </div>
    </>
  );
}
