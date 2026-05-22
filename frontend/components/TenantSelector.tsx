import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Building2, ChevronDown } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
}

export default function TenantSelector() {
  const { user, switchTenant } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchTenants();
    }
  }, [user]);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/tenants');
      setTenants(response.data);
    } catch (error) {
      console.error('Failed to fetch tenants', error);
    }
  };

  const handleSwitch = async (tenantId: string) => {
    setIsLoading(true);
    setIsOpen(false);
    try {
      await switchTenant(tenantId);
    } catch (error) {
      setIsLoading(false);
      alert('Gagal beralih lembaga.');
    }
  };

  if (user?.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg transition-colors"
      >
        <Building2 className="w-4 h-4" />
        <span className="text-xs font-semibold whitespace-nowrap">
          {isLoading ? 'Mengalihkan...' : 'Ganti Lembaga'}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Daftar Lembaga
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {tenants.map(tenant => (
              <button
                key={tenant.id}
                onClick={() => handleSwitch(tenant.id)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors flex items-center justify-between ${
                  user.tenantId === tenant.id ? 'bg-indigo-500/10 text-indigo-300' : 'text-slate-300'
                }`}
              >
                <span className="font-medium truncate">{tenant.name}</span>
                {user.tenantId === tenant.id && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                )}
              </button>
            ))}
            {tenants.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                Memuat data...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
