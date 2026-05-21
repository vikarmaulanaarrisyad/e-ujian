'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  ChevronDown,
} from 'lucide-react';

interface MissingReportGrade {
  studentId: string;
  studentName: string;
  nis: string;
  nisn: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectGroup: string;
  missingSemesters: number[];
}

interface MissingExamGrade {
  studentId: string;
  studentName: string;
  nis: string;
  nisn: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectGroup: string;
}

interface Summary {
  totalStudents: number;
  totalSubjects: number;
  totalReportSlots: number;
  filledReportSlots: number;
  missingReportSlots: number;
  totalExamSlots: number;
  filledExamSlots: number;
  missingExamSlots: number;
  reportCompletionPct: number;
  examCompletionPct: number;
}

type TabType = 'rapor' | 'ujian';

const SEMESTER_LABELS: Record<number, string> = {
  7: 'Smt 7',
  8: 'Smt 8',
  9: 'Smt 9',
  10: 'Smt 10',
  11: 'Smt 11',
};

function CircularProgress({ pct, color }: { pct: number; color: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-800" />
      <circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

export default function MissingGradesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('rapor');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['missingGrades'],
    queryFn: async () => {
      const res = await api.get('/grades/missing');
      return res.data as {
        academicYear: { year: string; semester: string };
        summary: Summary;
        missingReportGrades: MissingReportGrade[];
        missingExamGrades: MissingExamGrade[];
      };
    },
  });

  const summary = data?.summary;

  // Build unique subject lists for filter dropdowns
  const reportSubjects = useMemo(() => {
    const map = new Map<string, string>();
    data?.missingReportGrades.forEach((g) => map.set(g.subjectId, g.subjectName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  const examSubjects = useMemo(() => {
    const map = new Map<string, string>();
    data?.missingExamGrades.forEach((g) => map.set(g.subjectId, g.subjectName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  // Filtered report grades
  const filteredReport = useMemo(() => {
    let list = data?.missingReportGrades ?? [];
    if (filterSubjectId) list = list.filter((g) => g.subjectId === filterSubjectId);
    if (filterSemester) list = list.filter((g) => g.missingSemesters.includes(Number(filterSemester)));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (g) => g.studentName.toLowerCase().includes(q) || g.nis.includes(q)
      );
    }
    return list;
  }, [data, filterSubjectId, filterSemester, searchQuery]);

  // Filtered exam grades
  const filteredExam = useMemo(() => {
    let list = data?.missingExamGrades ?? [];
    if (filterSubjectId) list = list.filter((g) => g.subjectId === filterSubjectId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (g) => g.studentName.toLowerCase().includes(q) || g.nis.includes(q)
      );
    }
    return list;
  }, [data, filterSubjectId, searchQuery]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setFilterSubjectId('');
    setFilterSemester('');
    setSearchQuery('');
  };

  const allComplete =
    summary && summary.missingReportSlots === 0 && summary.missingExamSlots === 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">Nilai Belum Masuk</h2>
          <p className="text-xs text-slate-450 mt-1">
            Pantau siswa yang nilainya belum diinput — rapor (Smt 7–11) dan ujian madrasah.
          </p>
        </div>
        {data?.academicYear && (
          <div className="px-4 py-2 rounded-xl bg-indigo-950/40 border border-indigo-900/50 text-xs font-semibold text-indigo-300">
            TP {data.academicYear.year} &mdash; {data.academicYear.semester}
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="py-24 text-center text-slate-500 text-xs">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          Menghitung kelengkapan nilai...
        </div>
      )}

      {/* ── Error ── */}
      {isError && (
        <div className="py-16 text-center text-rose-400 text-xs border border-dashed border-rose-900/50 rounded-xl bg-rose-950/20">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-60" />
          Gagal memuat data. Pastikan tahun ajaran aktif sudah dikonfigurasi.
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {/* ── All Complete Banner ── */}
          {allComplete ? (
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900/30 to-teal-900/20 border border-emerald-800/50 rounded-2xl p-7 flex items-center gap-5 shadow-xl">
              <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-300">Semua Nilai Sudah Lengkap! 🎉</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Seluruh nilai rapor dan ujian untuk semua siswa dan mata pelajaran telah diinput.
                </p>
              </div>
            </div>
          ) : (
            /* ── Summary Cards ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Rapor Missing */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex items-center gap-4">
                <div className="relative shrink-0">
                  <CircularProgress pct={summary!.reportCompletionPct} color="#f97316" />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-orange-400">
                    {summary!.reportCompletionPct}%
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rapor Kurang</p>
                  <p className="text-2xl font-extrabold text-orange-400 mt-1">
                    {summary!.missingReportSlots.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    dari {summary!.totalReportSlots.toLocaleString('id-ID')} slot
                  </p>
                </div>
              </div>

              {/* Ujian Missing */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex items-center gap-4">
                <div className="relative shrink-0">
                  <CircularProgress pct={summary!.examCompletionPct} color="#e11d48" />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-rose-400">
                    {summary!.examCompletionPct}%
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ujian Kurang</p>
                  <p className="text-2xl font-extrabold text-rose-400 mt-1">
                    {summary!.missingExamSlots.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    dari {summary!.totalExamSlots.toLocaleString('id-ID')} slot
                  </p>
                </div>
              </div>

              {/* Rapor Filled */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex items-center gap-4">
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                  <BookOpen className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rapor Terisi</p>
                  <p className="text-2xl font-extrabold text-indigo-400 mt-1">
                    {summary!.filledReportSlots.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">nilai rapor tersimpan</p>
                </div>
              </div>

              {/* Exam Filled */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex items-center gap-4">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                  <GraduationCap className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ujian Terisi</p>
                  <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                    {summary!.filledExamSlots.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">nilai ujian tersimpan</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Detail Panel ── */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-800/60">
              <button
                onClick={() => handleTabChange('rapor')}
                className={`flex items-center gap-2.5 px-6 py-4 text-xs font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === 'rapor'
                    ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Nilai Rapor
                {summary && summary.missingReportSlots > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-400 text-[10px] font-bold">
                    {summary.missingReportSlots}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('ujian')}
                className={`flex items-center gap-2.5 px-6 py-4 text-xs font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === 'ujian'
                    ? 'border-rose-500 text-rose-400 bg-rose-500/5'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Nilai Ujian
                {summary && summary.missingExamSlots > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[10px] font-bold">
                    {summary.missingExamSlots}
                  </span>
                )}
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Filter Bar */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama siswa atau NIS..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                {/* Subject Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  <select
                    value={filterSubjectId}
                    onChange={(e) => setFilterSubjectId(e.target.value)}
                    className="pl-9 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Semua Mata Pelajaran</option>
                    {(activeTab === 'rapor' ? reportSubjects : examSubjects).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* Semester Filter (rapor only) */}
                {activeTab === 'rapor' && (
                  <div className="relative">
                    <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    <select
                      value={filterSemester}
                      onChange={(e) => setFilterSemester(e.target.value)}
                      className="pl-9 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">Semua Semester</option>
                      {[7, 8, 9, 10, 11].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  </div>
                )}

                {/* Result count */}
                <div className="ml-auto text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                  {activeTab === 'rapor'
                    ? `${filteredReport.length} baris ditemukan`
                    : `${filteredExam.length} baris ditemukan`}
                </div>
              </div>

              {/* ── Table: Nilai Rapor ── */}
              {activeTab === 'rapor' && (
                <>
                  {filteredReport.length === 0 ? (
                    <div className="py-14 text-center border border-dashed border-slate-800 rounded-xl">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3 opacity-70" />
                      <p className="text-xs text-slate-500">
                        {data.missingReportGrades.length === 0
                          ? 'Semua nilai rapor sudah lengkap!'
                          : 'Tidak ada hasil yang cocok dengan filter.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800/60">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-slate-900/60 border-b border-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <th className="py-3 px-4">NIS</th>
                            <th className="py-3 px-4">Nama Siswa</th>
                            <th className="py-3 px-4">Mata Pelajaran</th>
                            <th className="py-3 px-4">Kelompok</th>
                            <th className="py-3 px-4">Semester yang Kosong</th>
                            <th className="py-3 px-4 text-center">Jml Kosong</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-xs">
                          {filteredReport.map((item, idx) => (
                            <tr
                              key={`${item.studentId}-${item.subjectId}`}
                              className={`transition-colors hover:bg-slate-900/30 ${idx % 2 === 0 ? '' : 'bg-slate-900/10'}`}
                            >
                              <td className="py-3 px-4 font-mono text-slate-450">{item.nis}</td>
                              <td className="py-3 px-4 font-semibold text-slate-200">{item.studentName}</td>
                              <td className="py-3 px-4 text-slate-350">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[9px] font-bold">
                                    {item.subjectCode}
                                  </span>
                                  {item.subjectName}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-950/50 border border-indigo-900/50 text-indigo-400">
                                  {item.subjectGroup.replace('KELOMPOK_', 'Kel. ')}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {item.missingSemesters.map((sem) => (
                                    <span
                                      key={sem}
                                      className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-950/40 border border-orange-900/50 text-orange-400"
                                    >
                                      {SEMESTER_LABELS[sem]}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${
                                    item.missingSemesters.length === 5
                                      ? 'bg-rose-900/40 text-rose-400 border border-rose-800/50'
                                      : 'bg-orange-900/30 text-orange-400 border border-orange-800/40'
                                  }`}
                                >
                                  {item.missingSemesters.length}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* ── Table: Nilai Ujian ── */}
              {activeTab === 'ujian' && (
                <>
                  {filteredExam.length === 0 ? (
                    <div className="py-14 text-center border border-dashed border-slate-800 rounded-xl">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3 opacity-70" />
                      <p className="text-xs text-slate-500">
                        {data.missingExamGrades.length === 0
                          ? 'Semua nilai ujian sudah lengkap!'
                          : 'Tidak ada hasil yang cocok dengan filter.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800/60">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-900/60 border-b border-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <th className="py-3 px-4">NIS</th>
                            <th className="py-3 px-4">Nama Siswa</th>
                            <th className="py-3 px-4">Mata Pelajaran</th>
                            <th className="py-3 px-4">Kelompok</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-xs">
                          {filteredExam.map((item, idx) => (
                            <tr
                              key={`${item.studentId}-${item.subjectId}`}
                              className={`transition-colors hover:bg-slate-900/30 ${idx % 2 === 0 ? '' : 'bg-slate-900/10'}`}
                            >
                              <td className="py-3 px-4 font-mono text-slate-450">{item.nis}</td>
                              <td className="py-3 px-4 font-semibold text-slate-200">{item.studentName}</td>
                              <td className="py-3 px-4 text-slate-350">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[9px] font-bold">
                                    {item.subjectCode}
                                  </span>
                                  {item.subjectName}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-950/50 border border-indigo-900/50 text-indigo-400">
                                  {item.subjectGroup.replace('KELOMPOK_', 'Kel. ')}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-rose-950/40 border border-rose-900/50 text-rose-400">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Belum Diinput
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Bottom Stats ── */}
          {!allComplete && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Siswa</p>
                  <p className="text-lg font-bold text-slate-200 mt-0.5">{summary!.totalStudents}</p>
                </div>
              </div>
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Mata Pelajaran</p>
                  <p className="text-lg font-bold text-slate-200 mt-0.5">{summary!.totalSubjects}</p>
                </div>
              </div>
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Kelengkapan Rapor</p>
                  <p className="text-lg font-bold text-slate-200 mt-0.5">
                    {summary!.filledReportSlots} / {summary!.totalReportSlots}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
