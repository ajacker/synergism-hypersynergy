const xlsx = require('xlsx');
const path = 'C:/Users/tangu/Documents/Antigravity/HyperSynergism/synergism-hypersynergy/docs/SynergismOfficial-master/Re-Octptimisation (Beta 1.2.5E)/Re-Octptimisation (Beta 1.2.5E).xlsx';
const wb = xlsx.readFile(path);
const ws = wb.Sheets['Save File Input'];
for (let r = 13; r <= 56; r++) {
  const v = ws['V' + r]?.v;
  if (v !== undefined) console.log(r, v);
}
