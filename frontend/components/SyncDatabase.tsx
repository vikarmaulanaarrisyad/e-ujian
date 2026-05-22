'use client';

import React, { useState } from 'react';
import { Database, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SyncDatabase() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { user } = useAuth();

  // Only allow SUPER_ADMIN or ADMIN to sync
  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
    return null;
  }

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/sync/mysql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      setResult({ success: data.success, message: data.message });
    } catch (error: any) {
      setResult({ success: false, message: 'Koneksi ke server gagal' });
    } finally {
      setSyncing(false);
      
      // Auto clear result after 5 seconds
      setTimeout(() => {
        setResult(null);
      }, 5000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSync}
        disabled={syncing}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
          syncing
            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/30'
        }`}
        title="Sync SQLite ke MySQL (XAMPP)"
      >
        <Database className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sync XAMPP</span>
        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
      </button>

      {/* Toast Notification */}
      {result && (
        <div className={`absolute top-full right-0 mt-2 w-64 p-3 rounded-lg border shadow-lg z-50 ${
          result.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <div className="flex items-start gap-2">
            {result.success ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            <p className="text-xs font-medium leading-tight">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
