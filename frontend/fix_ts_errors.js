const fs = require('fs');

// Fix BatchSklDownloader.tsx
let batchSkl = fs.readFileSync('e:\\NEXTJS\\e-ujian\\frontend\\components\\BatchSklDownloader.tsx', 'utf8');
batchSkl = batchSkl.replace(
  /interface BatchSklDownloaderProps \{\n  className\?: string;\n\}/,
  "interface BatchSklDownloaderProps {\n  withTranscript?: boolean;\n  className?: string;\n}"
);
batchSkl = batchSkl.replace(
  /import \{ Loader2, Download, ClipboardList \} from 'lucide-react';/,
  "import { Loader2, Download, ClipboardList, ListTree } from 'lucide-react';"
);
batchSkl = batchSkl.replace(
  /export default function BatchSklDownloader\(\{ className \}: BatchSklDownloaderProps\) \{/,
  "export default function BatchSklDownloader({ withTranscript = false, className }: BatchSklDownloaderProps) {"
);
batchSkl = batchSkl.replace(
  /\{downloading \? <Loader2 className="w-4 h-4 animate-spin" \/> : <ClipboardList className="w-4 h-4" \/>\}\n\s*\{downloading \? 'Memproses PDF\.\.\.' : 'Download Massal SKL'\}/,
  "{downloading ? <Loader2 className=\"w-4 h-4 animate-spin\" /> : (withTranscript ? <ListTree className=\"w-4 h-4\" /> : <ClipboardList className=\"w-4 h-4\" />)}\n        {downloading ? 'Memproses PDF...' : (withTranscript ? 'Download Massal SKL + Nilai' : 'Download Massal SKL')}"
);
batchSkl = batchSkl.replace(
  /const fileName = `SKL_Massal_\$\{data\.schoolProfile\.name\.replace\(\/\\s\+\/g, '_'\)\}_\$\{new Date\(\)\.getFullYear\(\)\}\.pdf`;/,
  "const fileName = `SKL_Massal_${withTranscript ? 'Nilai_' : ''}${data.schoolProfile.name.replace(/\\s+/g, '_')}_${new Date().getFullYear()}.pdf`;"
);

// CSS and HTML for batch
const cssToAdd = `
              .skl-nilai-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; font-family: "Times New Roman", Times, serif; }
              .skl-nilai-table th, .skl-nilai-table td { border: 1.5px solid black; padding: 2px 6px; font-size: 13px; }
              .skl-nilai-table th { text-align: center; font-weight: bold; }
              .skl-nilai-table .col-no { width: 40px; text-align: center; }
              .skl-nilai-table .col-mapel { text-align: left; }
              .skl-nilai-table .col-nilai { width: 100px; text-align: center; font-weight: bold; }`;

if (!batchSkl.includes('skl-nilai-table')) {
  batchSkl = batchSkl.replace(
    /\.lulus-stamp \{ display: inline-block;/,
    cssToAdd + '\n              .lulus-stamp { display: inline-block;'
  );

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

  batchSkl = batchSkl.replace(
    /                      <\/div>\s*<p className="skl-para">\s*Surat Keterangan Lulus ini bersifat/,
    getTableHtml
  );
}

fs.writeFileSync('e:\\NEXTJS\\e-ujian\\frontend\\components\\BatchSklDownloader.tsx', batchSkl);

// Fix IndividualSklDownloader.tsx
let indSkl = fs.readFileSync('e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualSklDownloader.tsx', 'utf8');
indSkl = indSkl.replace(
  /interface IndividualSklDownloaderProps \{\n  studentId: string;\n  className\?: string;\n\}/,
  "interface IndividualSklDownloaderProps {\n  studentId: string;\n  withTranscript?: boolean;\n  className?: string;\n}"
);
fs.writeFileSync('e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualSklDownloader.tsx', indSkl);

// Fix app/(dashboard)/dashboard/students/graduation/print-skl/batch/page.tsx
let printBatchSkl = fs.readFileSync('e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\print-skl\\batch\\page.tsx', 'utf8');

printBatchSkl = printBatchSkl.replace(
  /profile\?\.foundationName/g,
  "data.schoolProfile?.foundationName"
);
printBatchSkl = printBatchSkl.replace(
  /profile\?\.tenant/g,
  "data.schoolProfile?.tenant"
);
printBatchSkl = printBatchSkl.replace(
  /interface StudentData \{/g,
  "interface StudentData {\n  grades?: any[];\n  averageExamScore?: number;"
);

fs.writeFileSync('e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\print-skl\\batch\\page.tsx', printBatchSkl);

// Fix app/(dashboard)/dashboard/grades/tka/page.tsx (the random error from tsc)
let tkaPage = fs.readFileSync('e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\grades\\tka\\page.tsx', 'utf8');
if (tkaPage.includes('data.students')) {
  tkaPage = tkaPage.replace(/data\.students/g, 'tkaData?.students || []');
}
fs.writeFileSync('e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\grades\\tka\\page.tsx', tkaPage);

console.log('Fixed TS Errors!');
