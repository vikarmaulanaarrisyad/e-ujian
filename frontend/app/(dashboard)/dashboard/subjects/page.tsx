'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  BookMarked,
  X,
  AlertTriangle,
  Loader2,
  Layers,
  ArrowUpDown
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  group: 'KELOMPOK_A' | 'KELOMPOK_B' | 'KELOMPOK_C';
  order: number;
}

const GROUP_LABELS = {
  KELOMPOK_A: 'Kelompok A (Nasional)',
  KELOMPOK_B: 'Kelompok B (Muatan Lokal)',
  KELOMPOK_C: 'Kelompok C (Ciri Khas Madrasah)',
};

export default function SubjectsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // State Management
  const [activeTab, setActiveTab] = useState<'ALL' | 'KELOMPOK_A' | 'KELOMPOK_B' | 'KELOMPOK_C'>('ALL');
  const [localSubjects, setLocalSubjects] = useState<Subject[]>([]);
  const [isOrderChanged, setIsOrderChanged] = useState(false);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  // Form States
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formGroup, setFormGroup] = useState<'KELOMPOK_A' | 'KELOMPOK_B' | 'KELOMPOK_C'>('KELOMPOK_A');
  const [formOrder, setFormOrder] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete State
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);

  // Guard: Admin only
  const isAdmin = user?.role === 'ADMIN';

  // Fetch Subjects
  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ['subjects-admin'],
    queryFn: async () => {
      const res = await api.get('/subjects');
      return res.data;
    },
  });

  // Sync server data to local order state
  useEffect(() => {
    if (subjects) {
      setLocalSubjects(subjects);
      setIsOrderChanged(false);
    }
  }, [subjects]);

  // Mutations
  const generateDefaultMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/subjects/generate-default');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      showToast('Berhasil men-generate mata pelajaran default.', 'success');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal men-generate mata pelajaran.';
      showToast(msg, 'error');
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/subjects', payload);
    },
    onSuccess: (res) => {
      showToast(res.data.message || 'Mata pelajaran berhasil dibuat.', 'success');
      queryClient.invalidateQueries({ queryKey: ['subjects-admin'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsFormModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Gagal menyimpan mata pelajaran.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await api.put(`/subjects/${id}`, payload);
    },
    onSuccess: (res) => {
      showToast(res.data.message || 'Mata pelajaran berhasil diperbarui.', 'success');
      queryClient.invalidateQueries({ queryKey: ['subjects-admin'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsFormModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Gagal mengubah mata pelajaran.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/subjects/${id}`);
    },
    onSuccess: (res) => {
      showToast(res.data.message || 'Mata pelajaran berhasil dihapus.', 'success');
      queryClient.invalidateQueries({ queryKey: ['subjects-admin'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsDeleteModalOpen(false);
      setDeletingSubjectId(null);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Gagal menghapus mata pelajaran.', 'error');
      setIsDeleteModalOpen(false);
    }
  });

  const saveOrderMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.put('/subjects/reorder', payload);
    },
    onSuccess: (res) => {
      showToast(res.data.message || 'Urutan mata pelajaran berhasil disimpan.', 'success');
      queryClient.invalidateQueries({ queryKey: ['subjects-admin'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsOrderChanged(false);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Gagal menyimpan urutan.', 'error');
    }
  });

  // Form actions
  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormGroup('KELOMPOK_A');
    setFormOrder(0);
    setEditingSubject(null);
    setFormError(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    // Default order should be max order in KELOMPOK_A + 1
    const groupItems = subjects.filter(s => s.group === 'KELOMPOK_A');
    const maxOrder = groupItems.reduce((max, s) => s.order > max ? s.order : max, 0);
    setFormOrder(maxOrder + 1);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormName(subject.name);
    setFormCode(subject.code);
    setFormGroup(subject.group);
    setFormOrder(subject.order);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleGroupChange = (group: 'KELOMPOK_A' | 'KELOMPOK_B' | 'KELOMPOK_C') => {
    setFormGroup(group);
    // Recalculate default order for selected group
    const groupItems = subjects.filter(s => s.group === group);
    const maxOrder = groupItems.reduce((max, s) => s.order > max ? s.order : max, 0);
    setFormOrder(maxOrder + 1);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formCode.trim()) {
      setFormError('Nama dan Kode mata pelajaran wajib diisi.');
      return;
    }

    const payload = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      group: formGroup,
      order: formOrder,
    };

    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingSubjectId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingSubjectId) {
      deleteMutation.mutate(deletingSubjectId);
    }
  };

  // Reorder Actions
  const handleMove = (index: number, direction: 'UP' | 'DOWN', groupItems: Subject[]) => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === groupItems.length - 1) return;

    const newGroupItems = [...groupItems];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;

    // Swap items in the filtered list
    const temp = newGroupItems[index];
    newGroupItems[index] = newGroupItems[targetIndex];
    newGroupItems[targetIndex] = temp;

    // Reassign order properties sekuensial berdasarkan urutan swap baru
    const updatedWithOrders = newGroupItems.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    // Merge back into localSubjects state
    const otherGroups = localSubjects.filter(s => s.group !== groupItems[0].group);
    const merged = [...otherGroups, ...updatedWithOrders].sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return a.order - b.order;
    });

    setLocalSubjects(merged);
    setIsOrderChanged(true);
  };

  const handleSaveOrderChanges = () => {
    const payload = {
      subjects: localSubjects.map((s) => ({
        id: s.id,
        order: s.order,
      })),
    };
    saveOrderMutation.mutate(payload);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-200">Akses Ditolak</h3>
        <p className="text-xs text-slate-450 mt-1 max-w-sm">Hanya administrator yang memiliki wewenang untuk mengelola mata pelajaran.</p>
      </div>
    );
  }

  // Filter subjects by tab for rendering
  const getFilteredLocalSubjects = (group: 'KELOMPOK_A' | 'KELOMPOK_B' | 'KELOMPOK_C') => {
    return localSubjects.filter(s => s.group === group).sort((a, b) => a.order - b.order);
  };

  const renderSubjectTable = (group: 'KELOMPOK_A' | 'KELOMPOK_B' | 'KELOMPOK_C') => {
    const groupItems = getFilteredLocalSubjects(group);

    if (groupItems.length === 0) {
      return (
        <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
          Belum ada mata pelajaran dalam kelompok ini.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-800/60 text-slate-450 text-[10px] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[80px] text-center">No Urut</th>
              <th className="py-3.5 px-4 w-[120px]">Kode</th>
              <th className="py-3.5 px-4">Nama Mata Pelajaran</th>
              <th className="py-3.5 px-4 w-[160px] text-center">Urutan</th>
              <th className="py-3.5 px-4 w-[120px] text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
            {groupItems.map((subject, index) => (
              <tr key={subject.id} className="hover:bg-slate-900/10 transition-colors">
                <td className="py-3.5 px-4 text-center font-mono text-indigo-400 font-bold">{subject.order}</td>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                  <span className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-indigo-400">
                    {subject.code}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-205">{subject.name}</td>
                <td className="py-2.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleMove(index, 'UP', groupItems)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Naikkan Urutan"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'DOWN', groupItems)}
                      disabled={index === groupItems.length - 1}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Turunkan Urutan"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(subject)}
                      className="p-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/50 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                      title="Edit Pelajaran"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(subject.id)}
                      className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/50 text-rose-450 hover:text-rose-450 transition-colors cursor-pointer"
                      title="Hapus Pelajaran"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2.5">
            <BookMarked className="w-5.5 h-5.5 text-indigo-500" />
            <span>Manajemen Mata Pelajaran</span>
          </h2>
          <p className="text-xs text-slate-450 mt-1">Konfigurasi mata pelajaran, kelompok, dan urutan tampilan rapor & rekap nilai.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isOrderChanged && (
            <button
              onClick={handleSaveOrderChanges}
              disabled={saveOrderMutation.isPending}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-550 disabled:bg-emerald-700/50 border border-emerald-500/30 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 transition-all duration-200"
            >
              {saveOrderMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Simpan Urutan Baru</span>
            </button>
          )}

          <button
            onClick={() => {
              if(window.confirm('Apakah Anda yakin ingin menambahkan mata pelajaran default? Pastikan data mata pelajaran Anda saat ini kosong.')) {
                generateDefaultMutation.mutate();
              }
            }}
            disabled={generateDefaultMutation.isPending || (subjects && subjects.length > 0)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg transition-all duration-200 ${
              (subjects && subjects.length > 0)
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                : 'bg-amber-600 hover:bg-amber-500 border border-amber-500/20 text-white shadow-amber-500/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{generateDefaultMutation.isPending ? 'Men-generate...' : 'Generate Mapel Default'}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-550 border border-indigo-500/20 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pelajaran</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800/60 pb-4">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-400'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
            }`}
          >
            Semua Kelompok
          </button>
          <button
            onClick={() => setActiveTab('KELOMPOK_A')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'KELOMPOK_A'
                ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-400'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
            }`}
          >
            Kelompok A (Nasional)
          </button>
          <button
            onClick={() => setActiveTab('KELOMPOK_B')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'KELOMPOK_B'
                ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-400'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
            }`}
          >
            Kelompok B (Muatan Lokal)
          </button>
          <button
            onClick={() => setActiveTab('KELOMPOK_C')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'KELOMPOK_C'
                ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-400'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
            }`}
          >
            Kelompok C (Madrasah)
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            <Loader2 className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Memuat data mata pelajaran...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Kelompok A Panel */}
            {(activeTab === 'ALL' || activeTab === 'KELOMPOK_A') && (
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                  <h3 className="text-sm font-bold text-slate-100">{GROUP_LABELS.KELOMPOK_A}</h3>
                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-450 px-2 py-0.5 rounded-full font-bold">
                    {getFilteredLocalSubjects('KELOMPOK_A').length} Mapel
                  </span>
                </div>
                {renderSubjectTable('KELOMPOK_A')}
              </div>
            )}

            {/* Kelompok B Panel */}
            {(activeTab === 'ALL' || activeTab === 'KELOMPOK_B') && (
              <div className="space-y-3.5 pt-4">
                <div className="flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                  <h3 className="text-sm font-bold text-slate-100">{GROUP_LABELS.KELOMPOK_B}</h3>
                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-450 px-2 py-0.5 rounded-full font-bold">
                    {getFilteredLocalSubjects('KELOMPOK_B').length} Mapel
                  </span>
                </div>
                {renderSubjectTable('KELOMPOK_B')}
              </div>
            )}

            {/* Kelompok C Panel */}
            {(activeTab === 'ALL' || activeTab === 'KELOMPOK_C') && (
              <div className="space-y-3.5 pt-4">
                <div className="flex items-center gap-2 border-l-2 border-indigo-500 pl-3">
                  <h3 className="text-sm font-bold text-slate-100">{GROUP_LABELS.KELOMPOK_C}</h3>
                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-450 px-2 py-0.5 rounded-full font-bold">
                    {getFilteredLocalSubjects('KELOMPOK_C').length} Mapel
                  </span>
                </div>
                {renderSubjectTable('KELOMPOK_C')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* -------------------- CREATE / EDIT MODAL -------------------- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex h-14 items-center justify-between px-6 border-b border-slate-850 bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-100">
                {editingSubject ? 'Ubah Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSubject} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/25 text-xs text-rose-450 rounded-xl">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Subject Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Mapel</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  placeholder="Contoh: Pendidikan Kewarganegaraan"
                />
              </div>

              {/* Code */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kode Mapel (Singkatan)</label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 font-mono transition-colors"
                  placeholder="Contoh: PPKN"
                />
              </div>

              {/* Group selection */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kelompok Mapel</label>
                <select
                  value={formGroup}
                  onChange={(e) => handleGroupChange(e.target.value as any)}
                  className="block w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                >
                  <option value="KELOMPOK_A">{GROUP_LABELS.KELOMPOK_A}</option>
                  <option value="KELOMPOK_B">{GROUP_LABELS.KELOMPOK_B}</option>
                  <option value="KELOMPOK_C">{GROUP_LABELS.KELOMPOK_C}</option>
                </select>
              </div>

              {/* Order index */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Urutan Awal</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-205 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>

              {/* Form Footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>Simpan Pelajaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- CONFIRM DELETE MODAL -------------------- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex h-14 items-center justify-between px-6 border-b border-slate-850 bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
                <span>Hapus Mata Pelajaran</span>
              </h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-350 leading-relaxed">
                Apakah Anda yakin ingin menghapus mata pelajaran ini?
              </p>
              <div className="p-3 bg-rose-500/10 border border-rose-500/10 rounded-xl text-[11px] text-rose-400 font-medium">
                Peringatan: Menghapus mata pelajaran ini juga akan menghapus semua data nilai rapor dan nilai ujian yang terkait secara permanen. Tindakan ini tidak dapat dibatalkan!
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-550 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {deleteMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>Ya, Hapus</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
