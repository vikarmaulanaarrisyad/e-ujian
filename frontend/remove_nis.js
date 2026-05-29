const fs = require('fs');

const files = [
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualSknrDownloader.tsx',
    replace: [
      [/<td>NIS\/NISN<\/td>\s*<td>\{docData\.student\.nis\} \/ \{docData\.student\.nisn\}<\/td>/g, '<td>NISN</td>\n                        <td>{docData.student.nisn}</td>']
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualIjazahDownloader.tsx',
    replace: [
      [/\s*<tr>\s*<td>Nomor Induk Siswa<\/td>\s*<td>:<\/td>\s*<td>\{docData\.student\.nis\}<\/td>\s*<\/tr>/g, '']
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualSklDownloader.tsx',
    replace: [
      [/\s*\['Nomor Induk Siswa \(NIS\)',\s*docData\.student\.nis\],/g, '']
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\BatchSklDownloader.tsx',
    replace: [
      [/\s*\['Nomor Induk Siswa \(NIS\)',\s*student\.nis\],/g, '']
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\print-skl\\[id]\\page.tsx',
    replace: [
      [/\s*\['Nomor Induk Siswa \(NIS\)',\s*student\.nis\],/g, '']
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\print-skl\\batch\\page.tsx',
    replace: [
      [/\s*\['Nomor Induk Siswa \(NIS\)',\s*student\.nis\],/g, '']
    ]
  }
];

files.forEach(f => {
  if (fs.existsSync(f.path)) {
    let content = fs.readFileSync(f.path, 'utf8');
    let original = content;
    f.replace.forEach(([regex, repl]) => {
      content = content.replace(regex, repl);
    });
    if (content !== original) {
      fs.writeFileSync(f.path, content);
      console.log('Fixed', f.path);
    }
  }
});
