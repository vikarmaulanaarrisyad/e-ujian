const fs = require('fs');

const cssToAdd = `
              .skl-nilai-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; font-family: "Times New Roman", Times, serif; }
              .skl-nilai-table th, .skl-nilai-table td { border: 1.5px solid black; padding: 2px 6px; font-size: 13px; }
              .skl-nilai-table th { text-align: center; font-weight: bold; }
              .skl-nilai-table .col-no { width: 40px; text-align: center; }
              .skl-nilai-table .col-mapel { text-align: left; }
              .skl-nilai-table .col-nilai { width: 100px; text-align: center; font-weight: bold; }`;

const getTableHtml = (gradesVar, avgVar) => `                  </div>
                  <p className="skl-para" style={{ marginBottom: '6px' }}>
                    dengan hasil Ujian Madrasah sebagai berikut:
                  </p>
                  <table className="skl-nilai-table">
                    <thead>
                      <tr>
                        <th className="col-no">No</th>
                        <th className="col-mapel">Mata Pelajaran</th>
                        <th className="col-nilai">Nilai Ujian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {${gradesVar}.map((g: any, idx: number) => (
                        <tr key={idx}>
                          <td className="col-no">{idx + 1}</td>
                          <td className="col-mapel">{g.subjectName}</td>
                          <td className="col-nilai">{Number(g.examScore).toFixed(2).replace('.', ',')}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold', paddingRight: '12px' }}>RATA-RATA</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{Number(${avgVar}).toFixed(2).replace('.', ',')}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="skl-para" style={{ marginTop: '8px' }}>`;

const files = [
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualSklDownloader.tsx',
    replace: [
      [
        /\.lulus-stamp \{ display: inline-block;/g,
        cssToAdd + '\n              .lulus-stamp { display: inline-block;'
      ],
      [
        /                  <\/div>\s*<p className="skl-para">\s*Surat Keterangan Lulus ini bersifat/g,
        getTableHtml('docData.grades', 'docData.averageExamScore') + '\n                    Surat Keterangan Lulus ini bersifat'
      ]
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\BatchSklDownloader.tsx',
    replace: [
      [
        /\.lulus-stamp \{ display: inline-block;/g,
        cssToAdd + '\n              .lulus-stamp { display: inline-block;'
      ],
      [
        /                      <\/div>\s*<p className="skl-para">\s*Surat Keterangan Lulus ini bersifat/g,
        getTableHtml('student.grades', 'student.averageExamScore').replace(/                  /g, '                      ') + '\n                        Surat Keterangan Lulus ini bersifat'
      ]
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\print-skl\\[id]\\page.tsx',
    replace: [
      [
        /\.lulus-stamp \{\s*display: inline-block;/g,
        cssToAdd + '\n        .lulus-stamp {\n          display: inline-block;'
      ],
      [
        /        <\/div>\s*<p className="skl-para">\s*Surat Keterangan Lulus ini bersifat/g,
        getTableHtml('data.grades', 'data.averageExamScore').replace(/                  /g, '        ') + '\n          Surat Keterangan Lulus ini bersifat'
      ]
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\print-skl\\batch\\page.tsx',
    replace: [
      [
        /\.lulus-stamp \{\s*display: inline-block;/g,
        cssToAdd + '\n        .lulus-stamp {\n          display: inline-block;'
      ],
      [
        /                  <\/div>\s*<p className="skl-para">\s*Surat Keterangan Lulus ini bersifat/g,
        getTableHtml('student.grades', 'student.averageExamScore') + '\n                    Surat Keterangan Lulus ini bersifat'
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
      console.log('No match for', f.path);
    }
  }
});
