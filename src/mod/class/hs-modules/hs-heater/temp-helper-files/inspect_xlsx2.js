const xlsx = require('xlsx');
const path = 'C:/Users/tangu/Documents/Antigravity/HyperSynergism/synergism-hypersynergy/docs/SynergismOfficial-master/Re-Octptimisation (Beta 1.2.5E)/Re-Octptimisation (Beta 1.2.5E).xlsx';
const wb = xlsx.readFile(path, { cellStyles: true });
console.log('sheetCount:', wb.SheetNames.length);
console.log('SheetNames:', JSON.stringify(wb.SheetNames, null, 2));
const inspect = (name, r0=0,c0=0,rows=15,cols=10) => {
  console.log('\n=== Sheet:', name, '===');
  const ws = wb.Sheets[name];
  if (!ws) return;
  const outRows = [];
  for (let r = r0; r < r0 + rows; ++r) {
    const row = [];
    for (let c = c0; c < c0 + cols; ++c) {
      const addr = xlsx.utils.encode_cell({r,c});
      const cell = ws[addr];
      if (!cell) row.push(null);
      else if (cell.f) row.push(`f:${cell.f}`);
      else if (cell.v !== undefined) row.push(cell.v);
      else row.push(null);
    }
    outRows.push(row);
  }
  outRows.forEach(r => console.log(JSON.stringify(r)));
};
inspect('Main');
inspect('Octptimisation');
inspect('Hept Optimisation');
inspect('True Ambrosia Heater');
inspect('Save File Input');
inspect('Changelog');
