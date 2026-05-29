const fs = require('fs');

const files = [
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualSklDownloader.tsx',
    replace: [
      [
        /\.ttd-wrap \{ margin-top: auto; padding-top: 20px; display: flex; justify-content: flex-end; \}/g,
        '.ttd-wrap { margin-top: auto; padding-top: 20px; display: flex; justify-content: space-between; padding-left: 32px; padding-right: 32px; }'
      ],
      [
        /<div className="ttd-wrap">\s*<div className="ttd-block">/g,
        `<div className="ttd-wrap">
                  <div style={{ width: '192px' }}>
                    {docData.student.photoUrl ? (
                      <img 
                        src={docData.student.photoUrl.startsWith('http') ? docData.student.photoUrl : \`http://localhost:5000\${docData.student.photoUrl}\`} 
                        alt="Pas Foto" 
                        style={{ width: '3cm', height: '4cm', objectFit: 'cover', border: '1.5px solid black', marginBottom: '8px' }}
                        crossOrigin="anonymous" 
                      />
                    ) : (
                      <div style={{ width: '3cm', height: '4cm', border: '1.5px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', textAlign: 'center', padding: '4px', marginBottom: '8px' }}>
                        Pas Foto<br/>3 x 4 cm<br/><br/>Cap Tiga Jari<br/>Tengah Kiri
                      </div>
                    )}
                  </div>
                  <div className="ttd-block">`
      ]
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\BatchSklDownloader.tsx',
    replace: [
      [
        /\.ttd-wrap \{ margin-top: auto; padding-top: 20px; display: flex; justify-content: flex-end; \}/g,
        '.ttd-wrap { margin-top: auto; padding-top: 20px; display: flex; justify-content: space-between; padding-left: 32px; padding-right: 32px; }'
      ],
      [
        /<div className="ttd-wrap">\s*<div className="ttd-block">/g,
        `<div className="ttd-wrap">
                      <div style={{ width: '192px' }}>
                        {student.photoUrl ? (
                          <img 
                            src={student.photoUrl.startsWith('http') ? student.photoUrl : \`http://localhost:5000\${student.photoUrl}\`} 
                            alt="Pas Foto" 
                            style={{ width: '3cm', height: '4cm', objectFit: 'cover', border: '1.5px solid black', marginBottom: '8px' }}
                            crossOrigin="anonymous" 
                          />
                        ) : (
                          <div style={{ width: '3cm', height: '4cm', border: '1.5px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', textAlign: 'center', padding: '4px', marginBottom: '8px' }}>
                            Pas Foto<br/>3 x 4 cm<br/><br/>Cap Tiga Jari<br/>Tengah Kiri
                          </div>
                        )}
                      </div>
                      <div className="ttd-block">`
      ]
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\print-skl\\[id]\\page.tsx',
    replace: [
      [
        /\.ttd-wrap \{\s*margin-top: 28px;\s*display: flex;\s*justify-content: flex-end;\s*\}/g,
        '.ttd-wrap {\n          margin-top: 28px;\n          display: flex;\n          justify-content: space-between;\n          padding-left: 48px;\n          padding-right: 32px;\n        }'
      ],
      [
        /<div className="ttd-wrap">\s*<div className="ttd-block">/g,
        `<div className="ttd-wrap">
              <div style={{ width: '192px' }}>
                {student.photoUrl ? (
                  <img 
                    src={student.photoUrl.startsWith('http') ? student.photoUrl : \`http://localhost:5000\${student.photoUrl}\`} 
                    alt="Pas Foto" 
                    style={{ width: '3cm', height: '4cm', objectFit: 'cover', border: '1.5px solid black', marginBottom: '8px' }}
                    crossOrigin="anonymous" 
                  />
                ) : (
                  <div style={{ width: '3cm', height: '4cm', border: '1.5px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', textAlign: 'center', padding: '4px', marginBottom: '8px' }}>
                    Pas Foto<br/>3 x 4 cm<br/><br/>Cap Tiga Jari<br/>Tengah Kiri
                  </div>
                )}
              </div>
              <div className="ttd-block">`
      ]
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\print-skl\\batch\\page.tsx',
    replace: [
      [
        /\.ttd-wrap \{\s*margin-top: 28px;\s*display: flex;\s*justify-content: flex-end;\s*\}/g,
        '.ttd-wrap {\n          margin-top: 28px;\n          display: flex;\n          justify-content: space-between;\n          padding-left: 48px;\n          padding-right: 32px;\n        }'
      ],
      [
        /<div className="ttd-wrap">\s*<div className="ttd-block">/g,
        `<div className="ttd-wrap">
                  <div style={{ width: '192px' }}>
                    {student.photoUrl ? (
                      <img 
                        src={student.photoUrl.startsWith('http') ? student.photoUrl : \`http://localhost:5000\${student.photoUrl}\`} 
                        alt="Pas Foto" 
                        style={{ width: '3cm', height: '4cm', objectFit: 'cover', border: '1.5px solid black', marginBottom: '8px' }}
                        crossOrigin="anonymous" 
                      />
                    ) : (
                      <div style={{ width: '3cm', height: '4cm', border: '1.5px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', textAlign: 'center', padding: '4px', marginBottom: '8px' }}>
                        Pas Foto<br/>3 x 4 cm<br/><br/>Cap Tiga Jari<br/>Tengah Kiri
                      </div>
                    )}
                  </div>
                  <div className="ttd-block">`
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
    }
  }
});
