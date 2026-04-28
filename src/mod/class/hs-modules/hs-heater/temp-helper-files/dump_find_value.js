const xlsx = require('xlsx');
const path = 'docs/SynergismOfficial-master/Re-Octptimisation (Beta 1.2.5E)/Re-Octptimisation (Beta 1.2.5E).xlsx';
const wb = xlsx.readFile(path);
const ws = wb.Sheets['Save File Input'];
if (!ws) {
  console.error('Save File Input sheet not found');
  process.exit(1);
}
const formulas = [];
for (const addr of Object.keys(ws)) {
  if (addr.startsWith('!')) continue;
  const cell = ws[addr];
  if (cell && cell.f && cell.f.includes('FIND_VALUE')) {
    formulas.push({ addr, formula: cell.f });
  }
}
console.log(JSON.stringify(formulas, null, 2));
