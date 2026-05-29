const fs = require('fs');
const path = 'e:\\NEXTJS\\e-ujian\\frontend\\components\\BatchSklDownloader.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Update imports
content = content.replace(
  /import \{ Loader2, Download, ClipboardList \} from 'lucide-react';/,
  "import { Loader2, Download, ClipboardList, ListTree } from 'lucide-react';"
);

// 2. Update props interface
content = content.replace(
  /interface BatchSklDownloaderProps \{\n  className\?: string;\n\}/,
  "interface BatchSklDownloaderProps {\n  withTranscript?: boolean;\n  className?: string;\n}"
);

// 3. Update component signature
content = content.replace(
  /export default function BatchSklDownloader\(\{ className \}: BatchSklDownloaderProps\) \{/,
  "export default function BatchSklDownloader({ withTranscript = false, className }: BatchSklDownloaderProps) {"
);

// 4. Update button text and icon
content = content.replace(
  /\{downloading \? <Loader2 className="w-4 h-4 animate-spin" \/> : <ClipboardList className="w-4 h-4" \/>\}\s*\{downloading \? 'Memproses PDF\.\.\.' : 'Download Massal SKL'\}/,
  "{downloading ? <Loader2 className=\"w-4 h-4 animate-spin\" /> : (withTranscript ? <ListTree className=\"w-4 h-4\" /> : <ClipboardList className=\"w-4 h-4\" />)}\n        {downloading ? 'Memproses PDF...' : (withTranscript ? 'Download Massal SKL + Nilai' : 'Download Massal SKL')}"
);

// 5. Update PDF filename
content = content.replace(
  /const fileName = `SKL_Massal_\$\{data\.schoolProfile\.name\.replace\(\/\\s\+\/g, '_'\)\}_\$\{new Date\(\)\.getFullYear\(\)\}\.pdf`;/,
  "const fileName = `SKL_Massal_${withTranscript ? 'Nilai_' : ''}${data.schoolProfile.name.replace(/\\s+/g, '_')}_${new Date().getFullYear()}.pdf`;"
);

// 6. Update CSS
const cssToAdd = `
              .skl-nilai-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; font-family: "Times New Roman", Times, serif; }
              .skl-nilai-table th, .skl-nilai-table td { border: 1.5px solid black; padding: 2px 6px; font-size: 13px; }
              .skl-nilai-table th { text-align: center; font-weight: bold; }
              .skl-nilai-table .col-no { width: 40px; text-align: center; }
              .skl-nilai-table .col-mapel { text-align: left; }
              .skl-nilai-table .col-nilai { width: 100px; text-align: center; font-weight: bold; }`;

content = content.replace(
  /\.lulus-stamp \{ display: inline-block;/,
  cssToAdd + '\n              .lulus-stamp { display: inline-block;'
);

// 7. Update HTML
const getTableHtml = `                      </div>
                      {withTranscript && (
                        <>
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
                              {student.grades && student.grades.map((g: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="col-no">{idx + 1}</td>
                                  <td className="col-mapel">{g.subjectName}</td>
                                  <td className="col-nilai">{Number(g.examScore).toFixed(2).replace('.', ',')}</td>
                                </tr>
                              ))}
                              {student.grades && (
                                <tr>
                                  <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold', paddingRight: '12px' }}>RATA-RATA</td>
                                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{Number(student.averageExamScore).toFixed(2).replace('.', ',')}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </>
                      )}
                      <p className="skl-para" style={withTranscript ? { marginTop: '8px' } : undefined}>
                        Surat Keterangan Lulus ini bersifat`;

content = content.replace(
  /                      <\/div>\s*<p className="skl-para">\s*Surat Keterangan Lulus ini bersifat/,
  getTableHtml
);

fs.writeFileSync(path, content);
console.log('Fixed BatchSklDownloader.tsx!');
