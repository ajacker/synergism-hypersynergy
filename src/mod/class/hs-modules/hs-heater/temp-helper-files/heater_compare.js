const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const workbookPath = path.resolve(__dirname, '../../../../../../docs/SynergismOfficial-master/Re-Octptimisation (Beta 1.2.5E)/Re-Octptimisation (Beta 1.2.5E).xlsx');
const sheetName = 'True Ambrosia Heater';
const labelToField = {
    'Asc. Speed (C)': 'ascSpeed',
    'Ascension Speed (H)': 'ascSpeed2',
    'SI Non-Amb RC': 'sirc',
    'Bonus SI': 'bonussi',
    'Bonus IA (total)': 'totalbonusia',
    'Bonus IA (from talisman)': 'talismanbonusia',
    'Base Talisman Power': 'baseTalismanPower',
    'Rune Exp (log) (>50)': 'runeexp',
    'Blueberries': 'blueberries',
    'Base Obtainium': 'baseobt',
    'Base Offering': 'baseoff',
    'Voucher': 'voucher',
};

if (!fs.existsSync(workbookPath)) {
    console.error(`Workbook not found: ${workbookPath}`);
    process.exit(1);
}

const wb = xlsx.readFile(workbookPath, { cellStyles: false });
if (!wb.SheetNames.includes(sheetName)) {
    console.error('Sheet not found. Available sheets:', wb.SheetNames.join(', '));
    process.exit(1);
}

const sheet = wb.Sheets[sheetName];
const range = xlsx.utils.decode_range(sheet['!ref']);
const rows = [];
for (let r = range.s.r; r <= range.e.r; ++r) {
    const row = [];
    for (let c = range.s.c; c <= range.e.c; ++c) {
        const addr = xlsx.utils.encode_cell({ r, c });
        const cell = sheet[addr];
        if (!cell) {
            row.push(null);
        } else if (cell.f) {
            row.push(`f:${cell.f}`);
        } else {
            row.push(cell.v);
        }
    }
    rows.push(row);
}

const matches = [];
for (let r = 0; r < rows.length; ++r) {
    const row = rows[r];
    for (let c = 0; c < row.length; ++c) {
        const cell = row[c];
        if (typeof cell === 'string' && Object.keys(labelToField).includes(cell.trim())) {
            const label = cell.trim();
            const field = labelToField[label];
            const tail = row.slice(c + 1, c + 12);
            const firstNumeric = tail.find((v) => typeof v === 'number');
            matches.push({ row: r + 1, col: c + 1, label, field, firstNumeric, tail });
            break;
        }
    }
}

console.log('Spreadsheet comparison rows for target labels:');
for (const match of matches) {
    console.log('---');
    console.log(`Row ${match.row}, Col ${match.col}, Label: ${match.label}, Field: ${match.field}`);
    console.log(`First numeric after label: ${match.firstNumeric}`);
    console.log('Tail values:', JSON.stringify(match.tail.slice(0, 10)));
}

const samplePath = process.argv[2];
if (samplePath) {
    const resolvedSamplePath = path.resolve(process.cwd(), samplePath);
    if (!fs.existsSync(resolvedSamplePath)) {
        console.error('Sample export path not found:', resolvedSamplePath);
        process.exit(1);
    }
    const sampleRaw = fs.readFileSync(resolvedSamplePath, 'utf-8');
    const sample = JSON.parse(sampleRaw);
    const exportHsData = sample.hs_data;

    console.log('\nComparing sample export values against spreadsheet values:');
    for (const match of matches) {
        const actual = exportHsData ? exportHsData[match.field] : undefined;
        console.log(`${match.field}: sheet=${match.firstNumeric} export=${actual}`);
    }
}

if (matches.length === 0) {
    console.error('No matching row labels found in the spreadsheet.');
    process.exit(1);
}
