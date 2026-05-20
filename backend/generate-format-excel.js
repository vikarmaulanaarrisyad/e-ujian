const ExcelJS = require('exceljs');
const path = require('path');

async function generate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Format Siswa');

  worksheet.columns = [
    { header: 'NIS', key: 'nis', width: 18 },
    { header: 'NISN', key: 'nisn', width: 18 },
    { header: 'Nama Lengkap', key: 'name', width: 35 },
    { header: 'Jenis Kelamin (L/P)', key: 'gender', width: 20 },
    { header: 'Tempat Lahir', key: 'placeOfBirth', width: 20 },
    { header: 'Tanggal Lahir (DD-MM-YYYY)', key: 'dateOfBirth', width: 25 },
    { header: 'Nama Wali / Orang Tua', key: 'parentName', width: 30 }
  ];

  // Make headers bold and clean
  worksheet.getRow(1).font = { bold: true };

  const data = [
    {
      nis: '3136631386',
      nisn: '3136631386',
      name: 'ADE YUSUF FRANANDA',
      gender: 'L',
      placeOfBirth: 'TEGAL',
      dateOfBirth: '27-03-2013',
      parentName: 'ZUMROTUL MUTIMAH'
    },
    {
      nis: '0131031131',
      nisn: '0131031131',
      name: 'ADIBAH NUR NABILAH',
      gender: 'P',
      placeOfBirth: 'TEGAL',
      dateOfBirth: '20-08-2013',
      parentName: 'DIAN ARISTA'
    },
    {
      nis: '3133885527',
      nisn: '3133885527',
      name: 'ADITY AENUROHMAN',
      gender: 'L',
      placeOfBirth: 'TEGAL',
      dateOfBirth: '06-09-2013',
      parentName: 'SRI MULYANI'
    },
    {
      nis: '0135653875',
      nisn: '0135653875',
      name: 'AFFAN BRIAN PRATAMA',
      gender: 'L',
      placeOfBirth: 'TEGAL',
      dateOfBirth: '15-11-2013',
      parentName: 'ELSIH DIYANA FITRI'
    }
  ];

  data.forEach(item => {
    worksheet.addRow(item);
  });

  const outputPath = path.join(__dirname, 'Format_Import_Siswa.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log('Success! Excel file generated at:', outputPath);
}

generate().catch(console.error);
