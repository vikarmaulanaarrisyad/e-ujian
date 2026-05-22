const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'subjects', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Inject mutation
const mutationCode = `  const generateDefaultMutation = useMutation({
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

  const createMutation`;

if (!content.includes('generateDefaultMutation')) {
  content = content.replace(/  const createMutation/g, mutationCode);
}

// Inject button
const buttonCode = `<button
              onClick={() => {
                if(window.confirm('Apakah Anda yakin ingin menambahkan mata pelajaran default? Pastikan data mata pelajaran Anda saat ini kosong.')) {
                  generateDefaultMutation.mutate();
                }
              }}
              disabled={generateDefaultMutation.isPending || (subjects && subjects.length > 0)}
              className={\`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg transition-all duration-200 \${
                (subjects && subjects.length > 0)
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                  : 'bg-amber-600 hover:bg-amber-500 border border-amber-500/20 text-white shadow-amber-500/20'
              }\`}
            >
              <Plus className="w-4 h-4" />
              {generateDefaultMutation.isPending ? 'Men-generate...' : 'Generate Mapel Default'}
            </button>
            <button
              onClick={handleOpenCreateModal}`;

if (!content.includes('Generate Mapel Default')) {
  content = content.replace(/<button[\s\S]*?onClick={handleOpenCreateModal}/g, (match) => {
    return buttonCode;
  });
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Added generate default mutation and button.');
