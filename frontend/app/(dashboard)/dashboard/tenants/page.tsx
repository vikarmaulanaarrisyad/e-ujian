'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Building2, Plus, Users, School, MapPin, KeyRound, Shield } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  schoolProfiles?: {
    headmaster: string;
    address: string;
  }[];
  users?: {
    id: string;
    username: string;
  }[];
}

export default function TenantsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });
  const [resetData, setResetData] = useState<{ isOpen: boolean; id: string; name: string, username: string }>({ isOpen: false, id: '', name: '', username: '' });
  const [newPassword, setNewPassword] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    adminUsername: '',
    adminPassword: '',
    headmaster: '',
    address: '',
  });

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchTenants();
  }, [user, router]);

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants');
      setTenants(res.data);
    } catch (error) {
      console.error('Error fetching tenants', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tenants', formData);
      setIsModalOpen(false);
      setFormData({ name: '', slug: '', adminUsername: '', adminPassword: '', headmaster: '', address: '' });
      fetchTenants();
      alert('Lembaga berhasil ditambahkan!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menambahkan lembaga');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/tenants/${deleteData.id}`);
      setDeleteData({ isOpen: false, id: '', name: '' });
      fetchTenants();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menghapus lembaga');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    try {
      const res = await api.put(`/tenants/${resetData.id}/reset-password`, { newPassword });
      alert(res.data.message || 'Password berhasil direset!');
      setResetData({ isOpen: false, id: '', name: '', username: '' });
      setNewPassword('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal mereset password');
    }
  };

  if (loading) {
    return <div className="text-slate-400">Memuat data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-400" />
            Manajemen Lembaga
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Kelola data madrasah/lembaga yang menggunakan aplikasi ini.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" />
          Tambah Lembaga
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-slate-800/50 rounded-xl text-indigo-400 border border-slate-700/50">
                <School className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/50">
                  {tenant.slug}
                </span>
                {tenant.slug !== 'system' && (
                  <button 
                    onClick={() => setDeleteData({ isOpen: true, id: tenant.id, name: tenant.name })}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                    title="Hapus Lembaga"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-200 mb-2">{tenant.name}</h3>
            
            <div className="space-y-2 mt-4 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Shield className="w-4 h-4 text-indigo-500" />
                <span>Username Admin: <strong className="text-indigo-400 tracking-wide font-mono">{tenant.users?.[0]?.username || '-'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Kepsek: <span className="text-slate-300">{tenant.schoolProfiles?.[0]?.headmaster || '-'}</span></span>
              </div>
              <div className="flex items-start gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{tenant.schoolProfiles?.[0]?.address || '-'}</span>
              </div>
            </div>

            {/* Actions Footer */}
            {tenant.slug !== 'system' && (
              <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-end gap-2">
                <button
                  onClick={() => setResetData({ isOpen: true, id: tenant.id, name: tenant.name, username: tenant.users?.[0]?.username || '' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-medium transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Ubah Password
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {deleteData.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">Hapus Lembaga?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Apakah Anda yakin ingin menghapus lembaga <strong className="text-white">{deleteData.name}</strong>? Tindakan ini akan menghapus <strong>seluruh data secara permanen</strong> (Siswa, Nilai, Pengguna, Profil) dan tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteData({ isOpen: false, id: '', name: '' })} 
                className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleDelete} 
                className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 px-6 py-2 rounded-xl font-medium transition-colors"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {resetData.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <h2 className="text-lg font-bold text-slate-200">Ubah Password Admin</h2>
              <button onClick={() => { setResetData({ isOpen: false, id: '', name: '', username: '' }); setNewPassword(''); }} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Lembaga</label>
                <div className="text-slate-300 font-semibold">{resetData.name}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Username Admin</label>
                <div className="text-indigo-400 font-mono font-bold bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">{resetData.username}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password Baru</label>
                <input 
                  required 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="Masukkan password baru..." 
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => { setResetData({ isOpen: false, id: '', name: '', username: '' }); setNewPassword(''); }} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Batal</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-amber-500/20">Simpan Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <h2 className="text-lg font-bold text-slate-200">Tambah Lembaga Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nama Lembaga (Misal: MI 03)</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Slug (unik, misal: mi-03)</label>
                  <input required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Username Admin Baru</label>
                  <input required value={formData.adminUsername} onChange={e => setFormData({...formData, adminUsername: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Password Admin</label>
                  <input required type="password" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nama Kepala Madrasah</label>
                  <input value={formData.headmaster} onChange={e => setFormData({...formData, headmaster: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Alamat Lembaga</label>
                  <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" rows={2} />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Batal</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-medium">Simpan Lembaga</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
