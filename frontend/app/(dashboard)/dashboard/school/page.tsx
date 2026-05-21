'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { School, Save, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface SchoolProfile {
  name: string;
  npsn: string;
  address: string;
  headmaster: string;
  headmasterNip: string;
  logoUrl: string | null;
}

export default function SchoolProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<SchoolProfile>({
    name: '',
    npsn: '',
    address: '',
    headmaster: '',
    headmasterNip: '',
    logoUrl: null,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/school');
        setProfile(res.data);
        if (res.data.logoUrl) {
          setPreviewUrl(res.data.logoUrl);
        }
      } catch (error) {
        showToast('Gagal memuat profil madrasah.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast('Ukuran file maksimal 5MB.', 'error');
        return;
      }
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'ADMIN') return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', profile.name);
      formData.append('npsn', profile.npsn);
      formData.append('address', profile.address);
      formData.append('headmaster', profile.headmaster);
      formData.append('headmasterNip', profile.headmasterNip);
      
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const res = await api.put('/school', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      showToast(res.data.message || 'Profil berhasil disimpan!', 'success');
      
      if (res.data.data.logoUrl) {
        setPreviewUrl(res.data.data.logoUrl);
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menyimpan profil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-xs">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        Memuat data...
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2">
          <School className="w-6 h-6 text-indigo-400" />
          Profil Madrasah
        </h2>
        <p className="text-xs text-slate-450 mt-1">Kelola identitas madrasah untuk format cetak dokumen resmi (SKL & Ijazah).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-xl overflow-hidden">
            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Madrasah</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={!isAdmin}
                    className="block w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">NPSN</label>
                  <input
                    type="text"
                    value={profile.npsn}
                    onChange={(e) => setProfile({ ...profile, npsn: e.target.value })}
                    disabled={!isAdmin}
                    className="block w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Alamat Lengkap</label>
                  <textarea
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    disabled={!isAdmin}
                    rows={3}
                    className="block w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Kepala Madrasah</label>
                  <input
                    type="text"
                    value={profile.headmaster}
                    onChange={(e) => setProfile({ ...profile, headmaster: e.target.value })}
                    disabled={!isAdmin}
                    className="block w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm font-semibold text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">NIP Kepala Madrasah</label>
                  <input
                    type="text"
                    value={profile.headmasterNip}
                    onChange={(e) => setProfile({ ...profile, headmasterNip: e.target.value })}
                    disabled={!isAdmin}
                    placeholder="Biarkan kosong jika tidak ada"
                    className="block w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

            </div>
            
            {isAdmin && (
              <div className="p-5 border-t border-slate-800/60 bg-slate-900/50 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 w-full sm:w-auto"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Logo Upload */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl text-center">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-6 text-left">Logo Madrasah</h3>
            
            <div className="relative group w-32 h-32 mx-auto rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/50 flex flex-col items-center justify-center overflow-hidden mb-6 transition-all hover:border-indigo-500/50">
              {previewUrl ? (
                <div className="relative w-full h-full p-2">
                  <Image src={previewUrl} alt="Logo Madrasah" fill className="object-contain p-2" unoptimized />
                </div>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-slate-600 mb-2" />
                  <span className="text-[10px] text-slate-500">Belum ada logo</span>
                </>
              )}
              
              {isAdmin && (
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Ganti Logo</span>
                  <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
                </label>
              )}
            </div>
            
            <div className="text-xs text-slate-500 text-left space-y-1.5">
              <p>📌 <strong>Catatan:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Gunakan format <span className="text-slate-300">.png</span>, <span className="text-slate-300">.jpg</span>, atau <span className="text-slate-300">.jpeg</span></li>
                <li>Rekomendasi ukuran: <span className="text-slate-300">1:1 (Persegi)</span></li>
                <li>Maksimal ukuran file: <span className="text-slate-300">5 MB</span></li>
                <li>Background transparan (PNG) lebih disarankan agar menyatu dengan dokumen cetak.</li>
              </ul>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
