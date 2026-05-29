const fs = require('fs');

const files = [
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualSklDownloader.tsx',
    replace: [
      [
        /\.ttd-wrap \{ margin-top: auto; padding-top: 20px; display: flex; justify-content: space-between; padding-left: 32px; padding-right: 32px; \}/g,
        '.ttd-wrap { margin-top: auto; padding-top: 20px; display: flex; justify-content: flex-end; }'
      ],
      [
        /<div className="ttd-wrap">[\s\S]*?<div className="ttd-block">/g,
        `<div className="ttd-wrap">\n                  <div className="ttd-block">`
      ]
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\BatchSklDownloader.tsx',
    replace: [
      [
        /\.ttd-wrap \{ margin-top: auto; padding-top: 20px; display: flex; justify-content: space-between; padding-left: 32px; padding-right: 32px; \}/g,
        '.ttd-wrap { margin-top: auto; padding-top: 20px; display: flex; justify-content: flex-end; }'
      ],
      [
        /<div className="ttd-wrap">[\s\S]*?<div className="ttd-block">/g,
        `<div className="ttd-wrap">\n                      <div className="ttd-block">`
      ]
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\print-skl\\[id]\\page.tsx',
    replace: [
      [
        /\.ttd-wrap \{\s*margin-top: 28px;\s*display: flex;\s*justify-content: space-between;\s*padding-left: 48px;\s*padding-right: 32px;\s*\}/g,
        '.ttd-wrap {\n          margin-top: 28px;\n          display: flex;\n          justify-content: flex-end;\n        }'
      ],
      [
        /<div className="ttd-wrap">[\s\S]*?<div className="ttd-block">/g,
        `<div className="ttd-wrap">\n              <div className="ttd-block">`
      ]
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\print-skl\\batch\\page.tsx',
    replace: [
      [
        /\.ttd-wrap \{\s*margin-top: 28px;\s*display: flex;\s*justify-content: space-between;\s*padding-left: 48px;\s*padding-right: 32px;\s*\}/g,
        '.ttd-wrap {\n          margin-top: 28px;\n          display: flex;\n          justify-content: flex-end;\n        }'
      ],
      [
        /<div className="ttd-wrap">[\s\S]*?<div className="ttd-block">/g,
        `<div className="ttd-wrap">\n                  <div className="ttd-block">`
      ]
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
    } else {
      console.log('No changes needed for', f.path);
    }
  }
});
