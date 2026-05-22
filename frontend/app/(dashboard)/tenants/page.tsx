'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Building2,
  Plus,
  Trash2,
  Search,
  School,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  schoolProfiles: any[];
}

export default function TenantsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    adminUsername: '',
    adminPassword: '',
    headmaster: '',
    address: ''
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
      setLoading(true);
      const res = await api.get('/tenants');
      setTenants(res.data);
    } catch (err) {
      console.error('Failed to fetch tenants', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/tenants', formData);
      setIsModalOpen(false);
      setFormData({
        name: '', slug: '', adminUsername: '', adminPassword: '', headmaster: '', address: ''
      });
      fetchTenants();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat menambahkan lembaga');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus lembaga "${name}" beserta seluruh datanya? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await api.delete(`/tenants/${id}`);
        fetchTenants();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal menghapus lembaga');
      }
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-400" />
            Manajemen Lembaga
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Kelola data madrasah (tenant) yang terdaftar di dalam sistem
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Tambah Lembaga
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-4 backdrop-blur-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari lembaga berdasarkan nama atau slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Tenants Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-12 text-center">
          <School className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-300">Belum ada lembaga</h3>
          <p className="text-slate-500 text-sm mt-1">Data lembaga yang terdaftar akan muncul di sini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTenants.map((tenant) => (
            <div key={tenant.id} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 hover:bg-slate-800/40 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200 leading-tight">{tenant.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Slug: {tenant.slug}</p>
                  </div>
                </div>
                {tenant.slug !== 'system' && (
                  <button 
                    onClick={() => handleDelete(tenant.id, tenant.name)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Hapus Lembaga"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-500">Kepala Sekolah</span>
                  <span className="text-slate-300 font-medium">{tenant.schoolProfiles?.[0]?.headmaster || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-500">Didaftarkan</span>
                  <span className="text-slate-300">{new Date(tenant.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Lembaga */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Tambah Lembaga Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 text-rose-400 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Nama Lembaga *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Contoh: MI BUSTANUL HUDA 03"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">ID / Slug Lembaga *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-400 font-mono text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="mi-bustanul-huda-03"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Kepala Sekolah</label>
                  <input
                    type="text"
                    value={formData.headmaster}
                    onChange={(e) => setFormData({ ...formData, headmaster: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Alamat</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Akun Admin Lembaga</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Username *</label>
                    <input
                      type="text"
                      required
                      value={formData.adminUsername}
                      onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="admin_sekolah"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Minimal 6 karakter"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Simpan Lembaga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
