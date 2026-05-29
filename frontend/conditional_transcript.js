const fs = require('fs');

const files = [
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\IndividualSklDownloader.tsx',
    replace: [
      [
        /import { Loader2, FileText } from 'lucide-react';/g,
        "import { Loader2, FileText, FileSpreadsheet } from 'lucide-react';"
      ],
      [
        /interface IndividualSklDownloaderProps \{\n  studentId: string;\n  className\?: string;\n\}/g,
        "interface IndividualSklDownloaderProps {\n  studentId: string;\n  withTranscript?: boolean;\n  className?: string;\n}"
      ],
      [
        /export default function IndividualSklDownloader\(\{ studentId, className \}: IndividualSklDownloaderProps\) \{/g,
        "export default function IndividualSklDownloader({ studentId, withTranscript = false, className }: IndividualSklDownloaderProps) {"
      ],
      [
        /title="Download PDF SKL"/g,
        "title={withTranscript ? 'Download PDF SKL + Nilai' : 'Download PDF SKL'}"
      ],
      [
        /\{downloading \? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" \/> : <FileText className="w-4 h-4" \/>\}/g,
        "{downloading ? <Loader2 className=\"w-4 h-4 animate-spin text-emerald-400\" /> : (withTranscript ? <FileSpreadsheet className=\"w-4 h-4 text-emerald-600\" /> : <FileText className=\"w-4 h-4\" />)}"
      ],
      [
        /<p className="skl-para" style=\{\{ marginBottom: '6px' \}\}>\s*dengan hasil Ujian Madrasah sebagai berikut:\s*<\/p>\s*<table className="skl-nilai-table">[\s\S]*?<\/table>\s*<p className="skl-para" style=\{\{ marginTop: '8px' \}\}>/g,
        "{withTranscript && (\n                    <>\n                      <p className=\"skl-para\" style={{ marginBottom: '6px' }}>\n                        dengan hasil Ujian Madrasah sebagai berikut:\n                      </p>\n                      <table className=\"skl-nilai-table\">\n                        <thead>\n                          <tr>\n                            <th className=\"col-no\">No</th>\n                            <th className=\"col-mapel\">Mata Pelajaran</th>\n                            <th className=\"col-nilai\">Nilai Ujian</th>\n                          </tr>\n                        </thead>\n                        <tbody>\n                          {docData.grades.map((g: any, idx: number) => (\n                            <tr key={idx}>\n                              <td className=\"col-no\">{idx + 1}</td>\n                              <td className=\"col-mapel\">{g.subjectName}</td>\n                              <td className=\"col-nilai\">{Number(g.examScore).toFixed(2).replace('.', ',')}</td>\n                            </tr>\n                          ))}\n                          <tr>\n                            <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold', paddingRight: '12px' }}>RATA-RATA</td>\n                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{Number(docData.averageExamScore).toFixed(2).replace('.', ',')}</td>\n                          </tr>\n                        </tbody>\n                      </table>\n                    </>\n                  )}\n                  <p className=\"skl-para\" style={withTranscript ? { marginTop: '8px' } : undefined}>"
      ],
      [
        /const fileName = `SKL_\$\{data\.student\.name\.replace\(\/\\s\+\/g, '_'\)\}_\$\{new Date\(\)\.getFullYear\(\)\}\.pdf`;/g,
        "const fileName = `SKL_${withTranscript ? 'Nilai_' : ''}${data.student.name.replace(/\\s+/g, '_')}_${new Date().getFullYear()}.pdf`;"
      ]
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\components\\BatchSklDownloader.tsx',
    replace: [
      [
        /import \{ Loader2, ClipboardList \} from 'lucide-react';/g,
        "import { Loader2, ClipboardList, ListTree } from 'lucide-react';"
      ],
      [
        /interface BatchSklDownloaderProps \{\n  className\?: string;\n\}/g,
        "interface BatchSklDownloaderProps {\n  withTranscript?: boolean;\n  className?: string;\n}"
      ],
      [
        /export default function BatchSklDownloader\(\{ className \}: BatchSklDownloaderProps\) \{/g,
        "export default function BatchSklDownloader({ withTranscript = false, className }: BatchSklDownloaderProps) {"
      ],
      [
        /\{downloading \? <Loader2 className="w-4 h-4 animate-spin" \/> : <ClipboardList className="w-4 h-4" \/>\}\s*\{downloading \? 'Memproses PDF\.\.\.' : 'Download Massal SKL'\}/g,
        "{downloading ? <Loader2 className=\"w-4 h-4 animate-spin\" /> : (withTranscript ? <ListTree className=\"w-4 h-4\" /> : <ClipboardList className=\"w-4 h-4\" />)}\n        {downloading ? 'Memproses PDF...' : (withTranscript ? 'Download Massal SKL + Nilai' : 'Download Massal SKL')}"
      ],
      [
        /const fileName = `SKL_Massal_\$\{data\.schoolProfile\.name\.replace\(\/\\s\+\/g, '_'\)\}_\$\{new Date\(\)\.getFullYear\(\)\}\.pdf`;/g,
        "const fileName = `SKL_Massal_${withTranscript ? 'Nilai_' : ''}${data.schoolProfile.name.replace(/\\s+/g, '_')}_${new Date().getFullYear()}.pdf`;"
      ],
      [
        /<p className="skl-para" style=\{\{ marginBottom: '6px' \}\}>\s*dengan hasil Ujian Madrasah sebagai berikut:\s*<\/p>\s*<table className="skl-nilai-table">[\s\S]*?<\/table>\s*<p className="skl-para" style=\{\{ marginTop: '8px' \}\}>/g,
        "{withTranscript && (\n                        <>\n                          <p className=\"skl-para\" style={{ marginBottom: '6px' }}>\n                            dengan hasil Ujian Madrasah sebagai berikut:\n                          </p>\n                          <table className=\"skl-nilai-table\">\n                            <thead>\n                              <tr>\n                                <th className=\"col-no\">No</th>\n                                <th className=\"col-mapel\">Mata Pelajaran</th>\n                                <th className=\"col-nilai\">Nilai Ujian</th>\n                              </tr>\n                            </thead>\n                            <tbody>\n                              {student.grades.map((g: any, idx: number) => (\n                                <tr key={idx}>\n                                  <td className=\"col-no\">{idx + 1}</td>\n                                  <td className=\"col-mapel\">{g.subjectName}</td>\n                                  <td className=\"col-nilai\">{Number(g.examScore).toFixed(2).replace('.', ',')}</td>\n                                </tr>\n                              ))}\n                              <tr>\n                                <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold', paddingRight: '12px' }}>RATA-RATA</td>\n                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{Number(student.averageExamScore).toFixed(2).replace('.', ',')}</td>\n                              </tr>\n                            </tbody>\n                          </table>\n                        </>\n                      )}\n                      <p className=\"skl-para\" style={withTranscript ? { marginTop: '8px' } : undefined}>"
      ]
    ]
  },
  {
    path: 'e:\\NEXTJS\\e-ujian\\frontend\\app\\(dashboard)\\dashboard\\students\\graduation\\page.tsx',
    replace: [
      [
        /<BatchSklDownloader \/>/g,
        "<BatchSklDownloader />\n              <BatchSklDownloader withTranscript={true} />"
      ],
      [
        /<IndividualSklDownloader studentId=\{student\.id\} \/>/g,
        "<IndividualSklDownloader studentId={student.id} />\n                  <IndividualSklDownloader studentId={student.id} withTranscript={true} />"
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
