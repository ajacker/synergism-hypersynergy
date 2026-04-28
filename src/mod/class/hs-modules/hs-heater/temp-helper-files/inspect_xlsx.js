const xlsx = require('xlsx');
const path = 'C:/Users/tangu/Documents/Antigravity/HyperSynergism/synergism-hypersynergy/docs/SynergismOfficial-master/Re-Octptimisation (Beta 1.2.5E)/Re-Octptimisation (Beta 1.2.5E).xlsx';
const wb = xlsx.readFile(path, { cellStyles: true });
console.log('sheets:', wb.SheetNames);
for (const name of wb.SheetNames.slice(0, 5)) {
  console.log('\n---', name, '---');
  const ws = wb.Sheets[name];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, range: { s: { c: 0, r: 0 }, e: { c: 7, r: 9 } }, raw: true });
  rows.forEach((r) => console.log(JSON.stringify(r)));
}
