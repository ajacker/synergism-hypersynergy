const xlsx = require('xlsx');
const path = 'docs/SynergismOfficial-master/Re-Octptimisation (Beta 1.2.5E)/Re-Octptimisation (Beta 1.2.5E).xlsx';
const wb = xlsx.readFile(path, {cellStyles:false});
const sheet = wb.Sheets['True Ambrosia Heater'];
const range = xlsx.utils.decode_range(sheet['!ref']);
const fields = ['ambrosiaSpeed','blueAmbrosiaBarValue','blueAmbrosiaBarMax','redAmbrosiaBarValue','redAmbrosiaBarMax','ambrosiaGainChance','trueAmbrosiaGainChance','ambrosiaAcceleratorCount','lifeTimeAmbrosia','lifeTimeRedAmbrosia','quarks','platonic4x4','baseLuck','luckMult','totalLuck','trueBaseLuck','totalCubes','effectiveSingularity','transcription','ascSpeed','ascSpeed2','blueberries','bonusRow2','bonusRow3','bonusRow4','bonusRow5','spread','totalInfinityVouchers','baseTalismanPower','luckConversion','pseudoCoinUpgrades','redAmbrosiaLuck'];
const labelRegex = new RegExp(fields.join('|'),'i');
const matches = [];
for (let r = range.s.r; r <= range.e.r; ++r) {
  for (let c = range.s.c; c <= range.e.c; ++c) {
    const addr = xlsx.utils.encode_cell({r, c});
    const cell = sheet[addr];
    if (!cell) continue;
    const text = String(cell.v);
    if (labelRegex.test(text)) {
      const right = [];
      for (let cc = c + 1; cc <= Math.min(c + 5, range.e.c); ++cc) {
        const a2 = xlsx.utils.encode_cell({r, c: cc});
        const c2 = sheet[a2];
        right.push(c2 ? (c2.f ? `f:${c2.f}` : c2.v) : null);
      }
      const down = [];
      for (let rr = r + 1; rr <= Math.min(r + 5, range.e.r); ++rr) {
        const a2 = xlsx.utils.encode_cell({r: rr, c});
        const c2 = sheet[a2];
        down.push(c2 ? (c2.f ? `f:${c2.f}` : c2.v) : null);
      }
      matches.push({row: r + 1, col: c + 1, text, right, down});
    }
  }
}
console.log(JSON.stringify(matches, null, 2));
