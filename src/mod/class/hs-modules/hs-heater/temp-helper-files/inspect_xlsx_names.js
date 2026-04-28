const xlsx = require('xlsx');
const path = 'C:/Users/tangu/Documents/Antigravity/HyperSynergism/synergism-hypersynergy/docs/SynergismOfficial-master/Re-Octptimisation (Beta 1.2.5E)/Re-Octptimisation (Beta 1.2.5E).xlsx';
const wb = xlsx.readFile(path, { cellStyles: true });
console.log('sheetCount:', wb.SheetNames.length);
console.log('SheetNames:', wb.SheetNames.join(' | '));
const countFormulas = (name) => {
  const ws = wb.Sheets[name];
  if (!ws) return 0;
  return Object.values(ws).filter(cell => cell && cell.f).length;
};
for (const name of wb.SheetNames) {
  const count = countFormulas(name);
  if (count > 0) console.log(`${name}: ${count} formula cells`);
}
