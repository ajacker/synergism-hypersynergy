const xlsx = require('xlsx');
const path = 'docs/SynergismOfficial-master/Re-Octptimisation (Beta 1.2.5E)/Re-Octptimisation (Beta 1.2.5E).xlsx';
const wb = xlsx.readFile(path);
const ws = wb.Sheets['Save File Input'];
for (let r = 13; r <= 56; r++) {
  const x = ws['X' + r]?.v;
  const y = ws['Y' + r]?.f || ws['Y' + r]?.v;
  if (x || y) console.log(r, JSON.stringify({ X: x, Y: y }));
}
