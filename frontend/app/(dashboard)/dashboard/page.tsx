'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  BookOpen,
  GraduationCap,
  Award,
  ArrowRight,
  School,
  MapPin,
  Calendar,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await api.get('/students');
      return res.data;
    },
  });

  const { data: recapData, isLoading: isLoadingRecap } = useQuery({
    queryKey: ['recap'],
    queryFn: async () => {
      const res = await api.get('/grades/recap');
      return res.data;
    },
  });

  const totalStudents = students.length;
  const averageRecapScore = recapData?.recap?.length > 0
    ? (recapData.recap.reduce((sum: number, student: any) => sum + student.averageFinalScore, 0) / recapData.recap.length).toFixed(2)
    : 'N/A';

  const stats = [
    {
      name: 'Total Siswa (Kelas 6)',
      value: isLoadingStudents ? '...' : totalStudents,
      description: 'Siswa terdaftar aktif tahun ini',
      icon: Users,
      color: 'from-blue-500 to-indigo-500',
      shadow: 'shadow-blue-500/10'
    },
    {
      name: 'Mata Pelajaran',
      value: '13',
      description: 'Kelompok A, B, dan C',
      icon: BookOpen,
      color: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/10'
    },
    {
      name: 'Rata-rata Nilai Akhir',
      value: isLoadingRecap ? '...' : averageRecapScore,
      description: 'Dari total rekapitulasi kelulusan',
      icon: Award,
      color: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/10'
    },
    {
      name: 'Pembobotan Aktif',
      value: `${recapData?.weight?.reportPercentage || 60}% : ${recapData?.weight?.examPercentage || 40}%`,
      description: 'Rapor vs Ujian Madrasah',
      icon: GraduationCap,
      color: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/10'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/40 border border-indigo-500/10 p-8 md:p-10 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-2xl">
          <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-indigo-500/15 border border-indigo-500/20 text-indigo-400">
            Selamat Datang di SIPANMU
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-4 leading-tight">
            Halo, {user?.name}!
          </h2>
          <p className="text-slate-400 text-sm mt-3.5 leading-relaxed">
            Anda login sebagai <span className="text-indigo-400 font-semibold">{user?.role}</span>. Mulai kelola data siswa, entri nilai rapor semesters 7-11, entri nilai ujian madrasah, dan kalkulasi rekapitulasi kelulusan secara real-time.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link 
              href="/dashboard/students"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs transition-all duration-205 shadow-md shadow-indigo-600/10 flex items-center gap-2 group cursor-pointer"
            >
              <span>Kelola Siswa</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/dashboard/grades/recap"
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-350 font-semibold text-xs transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <span>Lihat Rekap Kelulusan</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.name} 
              className={`bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl ${stat.shadow} transition-all duration-300 hover:-translate-y-1 hover:border-slate-800`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.name}</p>
                  <p className="text-2xl font-bold text-white mt-3.5 tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-3.5 rounded-xl bg-gradient-to-tr ${stat.color} text-white shadow-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4 leading-normal font-medium">{stat.description}</p>
            </div>
          );
        })}
      </div>

      {/* Section Grid: School Profile & Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-7 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <School className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-200">Profil Madrasah</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <School className="w-4.5 h-4.5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Nama Madrasah</span>
                    <span className="text-slate-300 font-semibold">MI Bustanul Huda Dawuhan</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <MapPin className="w-4.5 h-4.5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Alamat</span>
                    <span className="text-slate-400 leading-relaxed block text-xs">Jl. Kyai Gede No. 45, Dawuhan, Bondowoso</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <Briefcase className="w-4.5 h-4.5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Kepala Madrasah</span>
                    <span className="text-slate-300 font-semibold">H. Ahmad Fauzi, S.Pd.I</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Calendar className="w-4.5 h-4.5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">NIP</span>
                    <span className="text-slate-400 text-xs">197508122005011002</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/60 mt-6 pt-5 flex items-center justify-between text-xs text-slate-500">
            <span>NPSN: <span className="text-slate-400 font-bold">60722341</span></span>
            <span>Status Akreditasi: <span className="text-emerald-450 font-bold">A (Unggul)</span></span>
          </div>
        </div>

        <div className="bg-gradient-to-b from-indigo-950/20 to-purple-950/10 border border-slate-800/80 rounded-2xl p-7 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-200">Panduan Pengolahan</h3>
            </div>

            <ul className="space-y-4 text-xs text-slate-400">
              <li className="flex gap-2.5 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Pastikan data siswa telah diimpor/diupdate dengan lengkap sebelum menginput nilai.</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Pilih Mata Pelajaran pada dropdown halaman input nilai untuk memuat grid input.</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Gunakan fitur <strong>Impor Excel</strong> untuk mempercepat input nilai secara massal.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/30 text-[11px] text-indigo-300">
            Rata-rata Nilai Rapor dihitung dari Semester 7 sampai 11 (Kelas 4 Ganjil s/d Kelas 6 Ganjil).
          </div>
        </div>
      </div>
    </div>
  );
}
