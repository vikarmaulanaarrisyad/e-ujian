'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  X,
  AlertCircle,
  Save,
  CheckSquare,
  Printer,
  FileText
} from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';

interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  isGraduated: boolean;
  graduationDate: string | null;
  certificateNumber: string | null;
}

export default function GraduationPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'graduated' | 'not_graduated'>('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isGraduated, setIsGraduated] = useState(false);
  const [graduationDate, setGraduationDate] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Batch modal state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchDate, setBatchDate] = useState('');

  // Fetch Students
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await api.get('/students');
      return res.data;
    },
  });

  const filteredStudents = useMemo(() => {
    let result = students;
    if (statusFilter === 'graduated') {
      result = result.filter((s) => s.isGraduated);
    } else if (statusFilter === 'not_graduated') {
      result = result.filter((s) => !s.isGraduated);
    }
    return result;
  }, [students, statusFilter]);

  const summary = useMemo(() => {
    const total = students.length;
    const graduated = students.filter(s => s.isGraduated).length;
    return {
      total,
      graduated,
      notGraduated: total - graduated,
      percentage: total > 0 ? Math.round((graduated / total) * 100) : 0,
    };
  }, [students]);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; data: any }) => {
      return await api.patch(`/students/${payload.id}/graduation`, payload.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      showToast('Status kelulusan berhasil diperbarui!', 'success');
      setModalOpen(false);
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.message || 'Gagal memperbarui status.');
    },
  });

  // Batch Update Mutation
  const batchMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/students/graduation/batch', payload);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      showToast(res.data.message || 'Berhasil meluluskan siswa!', 'success');
      setBatchModalOpen(false);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Gagal meluluskan siswa.', 'error');
    },
  });

  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      {
        accessorKey: 'nis',
        header: 'NIS',
        cell: (info) => <span className="font-mono text-slate-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Nama Lengkap',
        cell: (info) => <span className="font-bold text-slate-200">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'isGraduated',
        header: 'Status',
        cell: (info) => {
          const isGrad = info.getValue() as boolean;
          return isGrad ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Lulus
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
              <XCircle className="w-3 h-3" />
              Belum Lulus
            </span>
          );
        },
      },
      {
        accessorKey: 'graduationDate',
        header: 'Tgl Lulus',
        cell: (info) => {
          const val = info.getValue() as string;
          return val ? <span className="text-slate-300">{new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">-</span>;
        },
      },
      {
        accessorKey: 'certificateNumber',
        header: 'No. Ijazah',
        cell: (info) => {
          const val = info.getValue() as string;
          return val ? <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{val}</span> : <span className="text-slate-500">-</span>;
        },
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: (info) => {
          const student = info.row.original;
          if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') return null;
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openModal(student)}
                title="Edit Kelulusan"
                className="p-1.5 text-slate-450 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              
              {student.isGraduated && (
                <>
                  <a
                    href={`/dashboard/students/graduation/print-skl/${student.id}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Cetak SKL"
                    className="p-1.5 text-slate-450 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                  </a>
                  <a
                    href={`/dashboard/students/graduation/print-ijazah/${student.id}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Cetak Ijazah"
                    className="p-1.5 text-slate-450 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                  </a>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [user]
  );

  const table = useReactTable({
    data: filteredStudents,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const openModal = (student: Student) => {
    setSelectedStudent(student);
    setIsGraduated(student.isGraduated);
    setGraduationDate(student.graduationDate ? student.graduationDate.substring(0, 10) : '');
    setCertificateNumber(student.certificateNumber || '');
    setModalError(null);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    updateMutation.mutate({
      id: selectedStudent.id,
      data: {
        isGraduated,
        graduationDate: isGraduated ? graduationDate : null,
        certificateNumber: isGraduated ? certificateNumber : null,
      },
    });
  };

  const handleBatchGraduate = () => {
    const studentIds = students.filter(s => !s.isGraduated).map(s => s.id);
    if (studentIds.length === 0) {
      showToast('Semua siswa sudah berstatus lulus.', 'info');
      return;
    }
    batchMutation.mutate({
      studentIds,
      isGraduated: true,
      graduationDate: batchDate,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">Kelulusan Siswa</h2>
          <p className="text-xs text-slate-450 mt-1">Kelola status kelulusan dan nomor seri ijazah siswa.</p>
        </div>
        
        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
          <button
            onClick={() => { setBatchDate(new Date().toISOString().substring(0, 10)); setBatchModalOpen(true); }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/10"
          >
            <CheckSquare className="w-4 h-4" />
            Luluskan Semua
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl flex items-center gap-4">
          <div className="relative shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-800" />
              <circle cx="36" cy="36" r="28" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 28} strokeDashoffset={(2 * Math.PI * 28) * (1 - summary.percentage / 100)} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-400">{summary.percentage}%</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Persentase</p>
            <p className="text-lg font-extrabold text-emerald-400 mt-0.5">Kelulusan</p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            <GraduationCap className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lulus</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">{summary.graduated}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
            <XCircle className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Belum Lulus</p>
            <p className="text-2xl font-extrabold text-slate-300 mt-0.5">{summary.notGraduated}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Siswa</p>
            <p className="text-2xl font-extrabold text-indigo-400 mt-0.5">{summary.total}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800/60 flex flex-wrap gap-3 items-center justify-between bg-slate-900/50">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Cari siswa..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="graduated">Lulus</option>
              <option value="not_graduated">Belum Lulus</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Memuat data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-slate-800/60 bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {hg.headers.map((h) => (
                      <th key={h.id} className="py-3 px-4">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900/30 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {modalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <h3 className="font-bold text-slate-100">Status Kelulusan Siswa</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {modalError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-450">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs text-slate-400">Nama Lengkap</p>
                <p className="font-bold text-slate-200">{selectedStudent.name}</p>
                <p className="text-[10px] font-mono text-slate-500">NIS: {selectedStudent.nis}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={isGraduated} onChange={() => setIsGraduated(true)} className="text-emerald-500 bg-slate-950 border-slate-700" />
                    <span className="text-xs text-slate-300 font-semibold">Lulus</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!isGraduated} onChange={() => setIsGraduated(false)} className="text-slate-500 bg-slate-950 border-slate-700" />
                    <span className="text-xs text-slate-400">Belum Lulus</span>
                  </label>
                </div>
              </div>

              {isGraduated && (
                <div className="space-y-4 pt-4 border-t border-slate-800/60 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Kelulusan</label>
                    <input
                      type="date"
                      value={graduationDate}
                      onChange={(e) => setGraduationDate(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                      required={isGraduated}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nomor Seri Ijazah</label>
                    <input
                      type="text"
                      value={certificateNumber}
                      onChange={(e) => setCertificateNumber(e.target.value)}
                      placeholder="MI.BH.2025/..."
                      className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                    <p className="text-[10px] text-slate-500 mt-1.5">Nomor seri bersifat unik per siswa.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold">Batal</button>
                <button type="submit" disabled={updateMutation.isPending} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                  {updateMutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Modal */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-900/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-emerald-950/20">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckSquare className="w-5 h-5" />
                <h3 className="font-bold text-sm">Luluskan Semua Siswa</h3>
              </div>
              <button onClick={() => setBatchModalOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>Anda akan mengubah status <strong className="text-emerald-400">Semua Siswa yang belum lulus ({summary.notGraduated} siswa)</strong> menjadi <strong>LULUS</strong>.</p>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Tanggal Kelulusan Massal</label>
                <input
                  type="date"
                  value={batchDate}
                  onChange={(e) => setBatchDate(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button type="button" onClick={() => setBatchModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold">Batal</button>
                <button onClick={handleBatchGraduate} disabled={batchMutation.isPending || !batchDate} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  {batchMutation.isPending ? 'Memproses...' : 'Ya, Luluskan Semua'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
