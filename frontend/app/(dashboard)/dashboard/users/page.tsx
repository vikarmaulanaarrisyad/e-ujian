'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { Users, Plus, Edit, Trash2, Shield, User, Loader2, Save, X, KeyRound } from 'lucide-react';

interface UserData {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'GURU' | 'STAFF';
  createdAt: string;
  tenant?: { name: string };
}

export default function UsersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'GURU',
  });

  const isAdmin = user?.role === 'ADMIN';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      showToast('Gagal memuat data pengguna.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleOpenModal = (mode: 'CREATE' | 'EDIT', userData?: UserData) => {
    setModalMode(mode);
    if (mode === 'EDIT' && userData) {
      setEditingId(userData.id);
      setFormData({
        username: userData.username,
        password: '', // Blank for edit unless changing
        name: userData.name,
        role: userData.role,
      });
    } else {
      setEditingId(null);
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'GURU',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === 'CREATE') {
        if (!formData.password) {
          showToast('Password wajib diisi untuk pengguna baru.', 'error');
          setIsSubmitting(false);
          return;
        }
        await api.post('/users', formData);
        showToast('Pengguna berhasil ditambahkan.', 'success');
      } else {
        const updateData: any = {
          username: formData.username,
          name: formData.name,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await api.put(`/users/${editingId}`, updateData);
        showToast('Pengguna berhasil diperbarui.', 'success');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Terjadi kesalahan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
    try {
      await api.delete(`/users/${id}`);
      showToast('Pengguna berhasil dihapus.', 'success');
      fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus pengguna.', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Shield className="w-16 h-16 text-rose-500 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-slate-200">Akses Ditolak</h2>
        <p className="text-slate-400 mt-2 text-sm max-w-md">Halaman ini hanya dapat diakses oleh Administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" />
            Manajemen Akses Pengguna
          </h2>
          <p className="text-xs text-slate-450 mt-1">Kelola akun admin, guru, dan staf untuk login ke dalam sistem.</p>
        </div>
        <button
          onClick={() => handleOpenModal('CREATE')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 w-fit"
        >
          <Plus className="w-4 h-4" />
          Tambah Pengguna Baru
        </button>
      </div>

      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-xs">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            Memuat data pengguna...
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl m-6">
            Belum ada data pengguna lainnya.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-800/60 bg-slate-950/30 text-slate-450 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Nama Pengguna</th>
                  <th className="py-4 px-6">Username / ID Login</th>
                  <th className="py-4 px-6">Role / Hak Akses</th>
                  <th className="py-4 px-6">Dibuat Pada</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-200 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      {u.name}
                      {u.id === user?.id && (
                         <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] rounded font-bold ml-2">ANDA</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-400">
                      {u.username}
                      {u.tenant?.name && (
                        <div className="text-[10px] text-slate-500 mt-1.5 font-sans">
                          <span className="bg-slate-800/60 px-2 py-0.5 rounded text-slate-300">
                            🏢 {u.tenant.name}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/50' 
                        : u.role === 'GURU' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                        : 'bg-amber-950/40 text-amber-400 border border-amber-900/50'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal('EDIT', u)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                          title="Edit Pengguna & Reset Password"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors border border-rose-500/20"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                {modalMode === 'CREATE' ? <Plus className="w-5 h-5 text-indigo-400" /> : <Edit className="w-5 h-5 text-indigo-400" />}
                {modalMode === 'CREATE' ? 'Tambah Pengguna Baru' : 'Edit Pengguna'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso, S.Pd"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Role / Hak Akses</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 appearance-none"
                >
                  <option value="GURU">GURU (Input nilai saja)</option>
                  <option value="STAFF">STAFF (Bantu administrasi)</option>
                  <option value="ADMIN">ADMIN (Akses penuh)</option>
                </select>
              </div>

              <div className="border-t border-slate-800/60 pt-4 mt-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Username Login</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="tanpa-spasi (contoh: budiguru1)"
                  required
                  className="w-full px-4 py-2.5 font-mono bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kata Sandi (Password)</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={modalMode === 'EDIT' ? "Kosongkan jika tidak ingin diubah" : "Masukkan kata sandi..."}
                    required={modalMode === 'CREATE'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                {modalMode === 'EDIT' && (
                  <p className="text-[10px] text-slate-500 mt-1">Hanya diisi jika Anda ingin mereset password akun ini.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {modalMode === 'CREATE' ? 'Simpan Akun' : 'Update Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
