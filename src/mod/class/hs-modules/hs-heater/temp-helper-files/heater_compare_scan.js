const xlsx = require('xlsx');
const workbook = xlsx.readFile('c:\\\\Users\\\\tangu\\\\Documents\\\\Antigravity\\\\HyperSynergism\\\\synergism-hypersynergy\\\\docs\\\\SynergismOfficial-master\\\\Re-Octptimisation (Beta 1.2.5E)\\\\Re-Octptimisation (Beta 1.2.5E).xlsx');
const sheet = workbook.Sheets['True Ambrosia Heater'];
const range = xlsx.utils.decode_range(sheet['!ref']);
const terms = ['asc', 'speed', 'Ascension', 'ascSpeed', 'Speed'];
for (let r = range.s.r; r <= range.e.r; ++r) {
    let row = [];
    for (let c = range.s.c; c <= range.e.c; ++c) {
        const addr = xlsx.utils.encode_cell({ r, c });
        const cell = sheet[addr];
        if (!cell) row.push(null);
        else if (cell.f) row.push(`f:${cell.f}`);
        else row.push(cell.v);
    }
    const flat = row.filter(v => typeof v === 'string');
    if (flat.some(v => terms.some(t => v.toLowerCase().includes(t.toLowerCase())))) {
        console.log('ROW', r + 1, JSON.stringify(row.slice(0, 20)));
    }
}
