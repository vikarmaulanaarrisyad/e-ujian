'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import Link from 'next/link';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Users,
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Building2,
  DatabaseBackup,
  ShieldCheck
} from 'lucide-react';

interface DashboardStats {
  type: 'SUPER_ADMIN' | 'ADMIN';
  totalTenants?: number;
  totalUsers?: number;
  totalStudents?: number;
  activeAcademicYear?: {
    year: string;
    semester: 'ODD' | 'EVEN';
  } | null;
  students?: {
    total: number;
    male: number;
    female: number;
  };
  graduation?: {
    graduated: number;
    notGraduated: number;
    passRate: number;
  };
  averages?: {
    report: number;
    exam: number;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (error) {
        showToast('Gagal memuat statistik dashboard.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Menyiapkan Dashboard Anda...</p>
      </div>
    );
  }

  // ==========================================
  // VIEW: SUPER_ADMIN
  // ==========================================
  if (stats?.type === 'SUPER_ADMIN') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl border border-amber-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Super Administrator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              Selamat Datang, {user?.name}! 👋
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-2xl">
              Pusat kendali utama sistem e-Ijazah multi-tenant. Pantau seluruh lembaga, pengguna, dan kelola database secara terpusat.
            </p>
          </div>
        </div>

        {/* Top Statistic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-xl flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Lembaga (Tenant)</p>
              <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats.totalTenants}</h3>
            </div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-xl flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
            <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengguna Admin</p>
              <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats.totalUsers}</h3>
            </div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-xl flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Siswa Terdaftar (Global)</p>
              <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats.totalStudents}</h3>
            </div>
          </div>
        </div>

        {/* Quick Actions for Superadmin */}
        <div className="bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-xl">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6">Aksi Cepat Superadmin</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/dashboard/tenants" className="flex items-center gap-4 p-5 bg-slate-800/50 hover:bg-indigo-950/40 border border-slate-700/50 hover:border-indigo-500/50 rounded-2xl transition-all cursor-pointer group">
              <div className="p-3 bg-slate-900 group-hover:bg-indigo-500/20 text-slate-400 group-hover:text-indigo-400 rounded-xl transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">Kelola Lembaga</h4>
                <p className="text-xs text-slate-500 mt-0.5">Tambah, edit, atau hapus tenant</p>
              </div>
            </Link>

            <Link href="/dashboard/backup" className="flex items-center gap-4 p-5 bg-slate-800/50 hover:bg-emerald-950/40 border border-slate-700/50 hover:border-emerald-500/50 rounded-2xl transition-all cursor-pointer group">
              <div className="p-3 bg-slate-900 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 rounded-xl transition-colors">
                <DatabaseBackup className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">Backup & Restore</h4>
                <p className="text-xs text-slate-500 mt-0.5">Amankan data seluruh sistem</p>
              </div>
            </Link>

            <Link href="/dashboard/subjects" className="flex items-center gap-4 p-5 bg-slate-800/50 hover:bg-amber-950/40 border border-slate-700/50 hover:border-amber-500/50 rounded-2xl transition-all cursor-pointer group">
              <div className="p-3 bg-slate-900 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 rounded-xl transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 group-hover:text-amber-300 transition-colors">Mata Pelajaran Master</h4>
                <p className="text-xs text-slate-500 mt-0.5">Atur mata pelajaran default</p>
              </div>
            </Link>
          </div>
        </div>

      </div>
    );
  }

  // ==========================================
  // VIEW: ADMIN (Tenant)
  // ==========================================
  const genderData = [
    { name: 'Laki-laki', value: stats?.students?.male || 0, color: '#3b82f6' }, // Blue
    { name: 'Perempuan', value: stats?.students?.female || 0, color: '#ec4899' }, // Pink
  ];

  const graduationData = [
    { name: 'Lulus', value: stats?.graduation?.graduated || 0, color: '#10b981' }, // Emerald
    { name: 'Belum Lulus', value: stats?.graduation?.notGraduated || 0, color: '#f43f5e' }, // Rose
  ];

  const averageData = [
    { name: 'Rata-rata Rapor', score: stats?.averages?.report || 0 },
    { name: 'Rata-rata Ujian', score: stats?.averages?.exam || 0 },
  ];

  const isAcademicYearActive = stats?.activeAcademicYear !== null && stats?.activeAcademicYear !== undefined;
  const currentSemester = stats?.activeAcademicYear?.semester === 'ODD' ? 'Ganjil' : 'Genap';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Selamat Datang, {user?.name}! 👋
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-2xl">
            Sistem Informasi Pengolahan Nilai & Ijazah. Kelola data nilai siswa secara efisien dan rapi.
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-start md:items-end mt-4 md:mt-0">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Tahun Ajaran Aktif</p>
          {isAcademicYearActive ? (
            <div className="flex items-center gap-2 bg-indigo-950/40 px-4 py-2 rounded-xl border border-indigo-900/50 shadow-inner">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-sm font-bold text-indigo-100">{stats?.activeAcademicYear?.year}</p>
                <p className="text-[10px] text-indigo-300">Semester {currentSemester}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-rose-950/40 px-4 py-2 rounded-xl border border-rose-900/50 shadow-inner">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <p className="text-xs font-bold text-rose-300">Belum ada Tahun Ajaran Aktif</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-xl flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Siswa</p>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats?.students?.total || 0}</h3>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-xl flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telah Lulus</p>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats?.graduation?.graduated || 0}</h3>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-xl flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Kelulusan</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-3xl font-extrabold text-slate-100">{(stats?.graduation?.passRate || 0).toFixed(1)}%</h3>
              {stats && stats.graduation && stats.graduation.passRate > 50 ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-500" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-xl flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Nilai</p>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{(stats?.averages?.exam || 0).toFixed(1)}</h3>
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Chart: Status Kelulusan (Pie) */}
        <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-xl flex flex-col h-[400px]">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6">Status Kelulusan Siswa</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={graduationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {graduationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1rem', color: '#f1f5f9' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Rata-rata Nilai (Bar) & Demografi (Pie) */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-xl flex-1 flex flex-col min-h-[190px]">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">Demografi Siswa (Gender)</h3>
            <div className="flex-1 w-full flex items-center justify-center mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                    stroke="none"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-xl flex-1 flex flex-col min-h-[190px]">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">Perbandingan Nilai Madrasah</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={averageData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                  <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} />
                  <RechartsTooltip 
                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#f1f5f9' }} 
                  />
                  <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
