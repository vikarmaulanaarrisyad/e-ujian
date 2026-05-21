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
  FileText,
  Hash,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import BatchSklDownloader from '@/components/BatchSklDownloader';
import IndividualSklDownloader from '@/components/IndividualSklDownloader';

interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  isGraduated: boolean;
  graduationDate: string | null;
  certificateNumber: string | null;
  sklNumber: string | null;
  isAlumni: boolean;
  alumniYear: string | null;
}

export default function AlumniPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Fetch Alumni
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['alumni'],
    queryFn: async () => {
      const res = await api.get('/students?alumni=true');
      return res.data;
    },
  });

  // Calculate summary
  const summary = useMemo(() => {
    const total = students.length;
    const withSkl = students.filter(s => s.sklNumber).length;
    return {
      total,
      withSkl,
    };
  }, [students]);

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
        accessorKey: 'alumniYear',
        header: 'Tahun Lulus',
        cell: (info) => {
          const val = info.getValue() as string;
          return val ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
            {val}
          </span> : <span className="text-slate-500">-</span>;
        },
      },
      {
        accessorKey: 'sklNumber',
        header: 'No. SKL',
        cell: (info) => {
          const val = info.getValue() as string;
          return val
            ? <span className="font-mono text-[11px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{val}</span>
            : <span className="text-slate-600 text-[11px]">—</span>;
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
              <IndividualSklDownloader studentId={student.id} />
              <a
                href={`/dashboard/students/graduation/print-ijazah/${student.id}`}
                target="_blank"
                rel="noreferrer"
                title="Cetak Ijazah"
                className="p-1.5 text-slate-450 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
              </a>
            </div>
          );
        },
      },
    ],
    [user]
  );

  const table = useReactTable({
    data: students, // filteredStudents -> students directly
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">Data Alumni</h2>
          <p className="text-xs text-slate-450 mt-1">Daftar siswa lulusan tahun-tahun sebelumnya. Anda tetap dapat mencetak ulang SKL atau Ijazah.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
            <>
              {/* Batch Print SKL (Direct Download) */}
              <BatchSklDownloader />
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 shrink-0">
            <Hash className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">No. SKL</p>
            <p className="text-2xl font-extrabold text-teal-400 mt-0.5">{summary.withSkl}<span className="text-sm text-slate-500 font-normal">/{summary.total}</span></p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Alumni</p>
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
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Memuat data...
          </div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="py-20 text-center">
            <GraduationCap className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-400">Belum Ada Data Alumni</p>
            <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto">
              {globalFilter
                ? 'Tidak ada alumni yang cocok dengan pencarian.'
                : 'Belum ada siswa yang diarsipkan. Gunakan tombol "Arsip Lulusan" di halaman Kelulusan untuk memindahkan siswa lulus ke sini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
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
    </div>
  );
}
