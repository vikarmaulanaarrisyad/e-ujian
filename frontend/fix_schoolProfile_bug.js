const fs = require('fs');

const files = [
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualSknrDownloader.tsx',
    replace: [
      [/schoolProfile\?\.foundationName/g, 'docData.schoolProfile?.foundationName'],
      [/schoolProfile\?\.tenant/g, 'docData.schoolProfile?.tenant']
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualIjazahDownloader.tsx',
    replace: [
      [/schoolProfile\?\.foundationName/g, 'docData.schoolProfile?.foundationName'],
      [/schoolProfile\?\.tenant/g, 'docData.schoolProfile?.tenant']
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualSklDownloader.tsx',
    replace: [
      [/schoolProfile\?\.foundationName/g, 'docData.schoolProfile?.foundationName'],
      [/schoolProfile\?\.tenant/g, 'docData.schoolProfile?.tenant']
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\BatchSklDownloader.tsx',
    replace: [
      [/schoolProfile\?\.foundationName/g, 'profile?.foundationName'],
      [/schoolProfile\?\.tenant/g, 'profile?.tenant']
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\grades\\summary\\page.tsx',
    replace: [
      [/schoolProfile\?\.tenant/g, 'data?.schoolProfile?.tenant'],
      [/data\?\.schoolProfile\?\.foundationName\?\.toUpperCase\(\) \|\| data\?\.schoolProfile\?\.foundationName\?\.toUpperCase\(\)/g, 'data?.schoolProfile?.foundationName?.toUpperCase()']
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\grades\\recap\\page.tsx',
    replace: [
      [/schoolProfile\?\.tenant/g, 'data?.schoolProfile?.tenant'],
      [/data\?\.schoolProfile\?\.foundationName\?\.toUpperCase\(\) \|\| data\?\.schoolProfile\?\.foundationName\?\.toUpperCase\(\)/g, 'data?.schoolProfile?.foundationName?.toUpperCase()']
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\grades\\tka\\page.tsx',
    replace: [
      [/schoolProfile\?\.foundationName/g, 'data?.schoolProfile?.foundationName'],
      [/schoolProfile\?\.tenant/g, 'data?.schoolProfile?.tenant']
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\print-skl\\[id]\\page.tsx',
    replace: [
      // Usually it's `data.schoolProfile` or `schoolProfile` depending on how it's fetched. Let's check print-skl/[id]/page.tsx
      // I will skip this if it uses `schoolProfile` directly.
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\print-skl\\batch\\page.tsx',
    replace: []
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\print-ijazah\\[id]\\page.tsx',
    replace: []
  }
];

files.forEach(f => {
  if (fs.existsSync(f.path) && f.replace.length > 0) {
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
