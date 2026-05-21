'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Edit2, 
  Trash2, 
  X, 
  FileSpreadsheet,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ImagePlus
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
  gender: 'L' | 'P';
  class: string;
  placeOfBirth?: string;
  dateOfBirth?: string;
  parentName?: string;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // States
  const [importing, setImporting] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [formError, setFormError] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Form Field States
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [className, setClassName] = useState('6');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [parentName, setParentName] = useState('');

  // Table States
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Fetch Students
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await api.get('/students');
      return res.data;
    },
  });

  const isGuru = user?.role === 'GURU';

  // Define Columns
  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      {
        accessorKey: 'nis',
        header: 'NIS',
        cell: (info) => <span className="font-mono text-slate-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'nisn',
        header: 'NISN',
        cell: (info) => <span className="font-mono text-slate-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Nama Lengkap',
        cell: (info) => <span className="font-bold text-slate-205">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'gender',
        header: 'L/P',
        cell: (info) => {
          const val = info.getValue() as string;
          return (
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
              val === 'L' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'
            }`}>
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: 'placeOfBirth',
        header: 'Tempat, Tgl Lahir',
        cell: (info) => {
          const student = info.row.original;
          return student.placeOfBirth && student.dateOfBirth
            ? `${student.placeOfBirth}, ${new Date(student.dateOfBirth).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : student.placeOfBirth || (student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('id-ID') : '-');
        },
      },
      {
        accessorKey: 'parentName',
        header: 'Wali / Orang Tua',
        cell: (info) => <span className="text-slate-400">{info.getValue() as string || '-'}</span>,
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: (info) => {
          const student = info.row.original;
          if (isGuru) return null;
          return (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => openEditModal(student)}
                className="p-1 text-slate-450 hover:text-indigo-400 cursor-pointer transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => handleDelete(student.id, student.name)}
                  className="p-1 text-slate-450 hover:text-rose-450 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [isGuru, user]
  );

  // TanStack Table Instance
  const table = useReactTable({
    data: students,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Create Student Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/students', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      showToast('Siswa berhasil ditambahkan!', 'success');
      closeModal();
    },
    onError: (err: any) => {
      if (err.response?.data?.errors) {
        setFormError(err.response.data.errors);
      } else {
        setGeneralError(err.response?.data?.message || 'Gagal menambahkan siswa.');
      }
    }
  });

  // Update Student Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await api.put(`/students/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      showToast('Siswa berhasil diperbarui!', 'success');
      closeModal();
    },
    onError: (err: any) => {
      if (err.response?.data?.errors) {
        setFormError(err.response.data.errors);
      } else {
        setGeneralError(err.response?.data?.message || 'Gagal memperbarui siswa.');
      }
    }
  });

  // Delete Student Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      showToast('Siswa berhasil dihapus.', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Gagal menghapus siswa.', 'error');
    }
  });

  const openAddModal = () => {
    setEditMode(false);
    setSelectedStudentId(null);
    setNis('');
    setNisn('');
    setName('');
    setGender('L');
    setClassName('6');
    setPlaceOfBirth('');
    setDateOfBirth('');
    setParentName('');
    setFormError({});
    setGeneralError(null);
    setModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditMode(true);
    setSelectedStudentId(student.id);
    setNis(student.nis);
    setNisn(student.nisn);
    setName(student.name);
    setGender(student.gender);
    setClassName(student.class);
    setPlaceOfBirth(student.placeOfBirth || '');
    setDateOfBirth(student.dateOfBirth ? student.dateOfBirth.substring(0, 10) : '');
    setParentName(student.parentName || '');
    setFormError({});
    setGeneralError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError({});
    setGeneralError(null);

    const payload = {
      nis,
      nisn,
      name,
      gender,
      class: className,
      placeOfBirth: placeOfBirth || undefined,
      dateOfBirth: dateOfBirth || undefined,
      parentName: parentName || undefined,
    };

    if (editMode && selectedStudentId) {
      updateMutation.mutate({ id: selectedStudentId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string, studentName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data siswa ${studentName}?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Excel Downloads
  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/students/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_siswa.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('Template siswa berhasil diunduh.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh template.', 'error');
    }
  };

  const handleExportStudents = async () => {
    try {
      const response = await api.get('/students/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'data_siswa.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('Data siswa berhasil diekspor.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor data.', 'error');
    }
  };

  // Excel Import
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setImporting(true);
      const res = await api.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(res.data.message || 'Import data siswa berhasil!', 'success');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || 'Gagal mengimpor file.';
      showToast(msg, 'error');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ZIP Photo Upload
  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingZip(true);
      const res = await api.post('/students/upload-photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(res.data.message || 'Upload foto massal berhasil!', 'success');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || 'Gagal mengunggah foto.';
      showToast(msg, 'error');
    } finally {
      setUploadingZip(false);
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and top action bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">Kelola Data Siswa</h2>
          <p className="text-xs text-slate-450 mt-1">Daftar siswa aktif Kelas 6 MI Bustanul Huda Dawuhan.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Template</span>
          </button>
          
          <button
            onClick={handleExportStudents}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer transition-all duration-200"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-450" />
            <span>Ekspor Siswa</span>
          </button>

          {!isGuru && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                className="hidden"
                accept=".xlsx, .xls"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing || uploadingZip}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer transition-all duration-200 disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>{importing ? 'Mengimpor...' : 'Impor Siswa'}</span>
              </button>

              <input
                type="file"
                ref={zipInputRef}
                onChange={handleImportZip}
                className="hidden"
                accept=".zip"
              />
              <button
                onClick={() => zipInputRef.current?.click()}
                disabled={uploadingZip || importing}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer transition-all duration-200 disabled:opacity-50"
              >
                <ImagePlus className="w-4 h-4 text-pink-400" />
                <span>{uploadingZip ? 'Mengunggah...' : 'Upload Foto (ZIP)'}</span>
              </button>

              <button
                onClick={openAddModal}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-md shadow-indigo-600/10"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Siswa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl">
        {/* Search Bar */}
        <div className="relative max-w-md mb-6">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-505">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all duration-200"
            placeholder="Cari siswa (Nama, NIS, NISN, Wali)..."
          />
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-550 text-xs">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Memuat data siswa...
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            Tidak ada data siswa.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="border-b border-slate-800/60 text-slate-450 text-[10px] font-bold uppercase tracking-wider">
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="py-3.5 px-4">
                          {header.isPlaceholder ? null : (
                            <div
                              className={`flex items-center gap-1.5 ${
                                header.column.getCanSort() ? 'cursor-pointer select-none hover:text-slate-200' : ''
                              }`}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <span className="text-slate-500 shrink-0">
                                  {{
                                    asc: <ChevronUp className="w-3.5 h-3.5" />,
                                    desc: <ChevronDown className="w-3.5 h-3.5" />,
                                  }[header.column.getIsSorted() as string] ?? <ChevronsUpDown className="w-3.5 h-3.5" />}
                                </span>
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-slate-900/20 transition-all duration-150">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="py-3.5 px-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-800/60 text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <span>Tampilkan</span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                >
                  {[5, 10, 20, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
                <span>siswa per halaman</span>
              </div>

              <div className="flex items-center gap-4.5">
                <span>
                  Halaman <strong className="text-slate-205">{table.getState().pagination.pageIndex + 1}</strong> dari{' '}
                  <strong className="text-slate-205">{table.getPageCount() || 1}</strong>
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Student Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-slate-900/50">
              <h3 className="font-bold text-slate-205">
                {editMode ? 'Ubah Data Siswa' : 'Tambah Data Siswa Baru'}
              </h3>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {generalError && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-450">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">NIS</label>
                  <input
                    type="text"
                    required
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  {formError.nis && <p className="text-[10px] text-rose-400 mt-1">{formError.nis[0]}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">NISN</label>
                  <input
                    type="text"
                    required
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  {formError.nisn && <p className="text-[10px] text-rose-400 mt-1">{formError.nisn[0]}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
                {formError.name && <p className="text-[10px] text-rose-400 mt-1">{formError.name[0]}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Kelas</label>
                  <input
                    type="text"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Tempat Lahir</label>
                  <input
                    type="text"
                    value={placeOfBirth}
                    onChange={(e) => setPlaceOfBirth(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Nama Wali / Orang Tua</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3.5 pt-4 border-t border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4.5 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/10 flex items-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
