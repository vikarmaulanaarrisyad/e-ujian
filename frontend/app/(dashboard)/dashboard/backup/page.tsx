'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Download, Upload, AlertCircle, CheckCircle2, Loader2, DatabaseBackup } from 'lucide-react';
import api from '@/lib/api';

export default function BackupPage() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Guard: Super Admin only
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-6 bg-slate-900 rounded-xl border border-rose-500/20 text-center">
        <h2 className="text-xl font-bold text-rose-400 mb-2">Akses Ditolak</h2>
        <p className="text-slate-400">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      </div>
    );
  }

  const handleExport = async () => {
    setIsExporting(true);
    setStatusMsg(null);
    try {
      const response = await api.get('/backup/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'backup_sipanmu.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setStatusMsg({ type: 'success', text: 'Proses pengunduhan backup sedang berjalan. Silakan periksa folder Download Anda.' });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Gagal mengunduh backup. Pastikan server aktif.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    if (!confirm('PERINGATAN: Mengimpor backup akan MENGHAPUS seluruh data yang ada saat ini dan menggantinya dengan data dari file backup. Apakah Anda yakin ingin melanjutkan?')) {
      return;
    }

    setIsImporting(true);
    setStatusMsg(null);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await api.post('/backup/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatusMsg({ type: 'success', text: res.data.message || 'Database berhasil di-restore!' });
      setImportFile(null);
      
      // Optionally reset the file input
      const fileInput = document.getElementById('backup-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Gagal melakukan restore database.' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
              <DatabaseBackup className="w-6 h-6 text-indigo-400" />
            </div>
            Backup & Restore
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Amankan dan pulihkan data sistem secara keseluruhan</p>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm font-medium">{statusMsg.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 relative group hover:border-indigo-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/10 transition-colors" />
          
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
            <Download className="w-6 h-6 text-indigo-400" />
          </div>
          
          <h2 className="text-lg font-bold text-white mb-2">Export Database</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Unduh seluruh data sistem saat ini (termasuk data lembaga, pengguna, siswa, nilai, dan berkas unggahan) ke dalam sebuah file <strong>.zip</strong> yang aman. Lakukan backup secara berkala untuk mencegah kehilangan data.
          </p>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isExporting ? 'Mengemas Backup...' : 'Unduh Backup Sekarang'}
          </button>
        </div>

        {/* Import Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 relative group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -z-10 group-hover:bg-emerald-500/10 transition-colors" />
          
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
            <Upload className="w-6 h-6 text-emerald-400" />
          </div>
          
          <h2 className="text-lg font-bold text-white mb-2">Restore Database</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Pulihkan sistem menggunakan file backup <strong>.zip</strong> atau <strong>.json</strong> yang pernah diunduh sebelumnya. <span className="text-rose-400 font-medium">Tindakan ini akan menimpa seluruh data yang ada di sistem saat ini.</span>
          </p>
          
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <input
                type="file"
                id="backup-file-input"
                accept=".zip,.json"
                required
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer"
              />
            </div>
            
            <button
              type="submit"
              disabled={isImporting || !importFile}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {isImporting ? 'Memulihkan Data...' : 'Mulai Restore Data'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
