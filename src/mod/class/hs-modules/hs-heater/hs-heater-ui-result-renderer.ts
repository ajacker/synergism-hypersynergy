import type {
    HeaterOptimizationResult,
    HeaterResultArrayKey,
    HeaterResultRow,
    HeaterResultRowMatrix,
} from "../../../types/data-types/hs-heater-types";
import { escapeHtml } from "./hs-heater-ui-input";

type ResultSectionDef = {
    title: string;
    keys: ResultKey[];
    showP4x4: boolean;
    effectHeader: string;
};

type ResultKey = HeaterResultArrayKey;

type ResultRowLabelsMap = Partial<Record<ResultKey, readonly string[]>>;

const HEATER_RESULT_DISPLAY_MAP: Record<ResultKey, string> = {
    luck:      "Luck",
    rLuck:     "Red Luck",
    allAmb:    "All Ambrosia",
    quarks:    "Quarks",
    cubes:     "3-7D Cubes",
    oct:       "Octeracts",
    obt:       "Obtainium",
    off:       "Offering",
    hyperflux: "Hyperflux (H0–H7)",
    ambOct:    "Max Amb",
    gen:       "Amb Gen (Gen1–Gen3)",
};

const HEATER_RESULT_ROW_LABELS: ResultRowLabelsMap = {
    hyperflux: ["H0", "H1", "H2", "H3", "H4", "H5", "H6", "H7"],
    gen:       ["Gen 1 + Oct", "Gen 2 + Oct", "Gen 3 + Oct"],
};

const HEATER_RESULT_SECTIONS: ResultSectionDef[] = [
    { title: "Common Loadouts", keys: ["luck", "rLuck", "allAmb", "quarks", "cubes", "oct", "obt", "off"], showP4x4: false, effectHeader: "Effect" },
    { title: "p4x4 (pre-AoAG) Loadouts (Effect do not consider hyperflux)", keys: ["hyperflux"], showP4x4: true, effectHeader: "Effect" },
    { title: "Hybrid Loadouts", keys: ["ambOct", "gen"], showP4x4: false, effectHeader: "Oct Effect" },
];

const RESULT_COL_INDEX = {
    loadout: 0,
    cost:    3,
    effect:  4,
    p4x4:    5,
    maxed:   6,
} as const;

const RESULT_TABLE_TOTAL_COLS = 6;

type NormalizedResultRow = {
    loadoutValue: HeaterResultRow[typeof RESULT_COL_INDEX.loadout];
    costValue: HeaterResultRow[typeof RESULT_COL_INDEX.cost];
    effectValue: HeaterResultRow[typeof RESULT_COL_INDEX.effect];
    p4x4Value: HeaterResultRow[typeof RESULT_COL_INDEX.p4x4];
    maxedValue: HeaterResultRow[typeof RESULT_COL_INDEX.maxed];
};

function translateResultKey(key: ResultKey): string {
    return HEATER_RESULT_DISPLAY_MAP[key];
}

function formatResultCell(value: unknown): string {
    if (typeof value === "object" && value !== null) {
        return `<pre class="hs-heater-json-pre">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
    }
    return escapeHtml(String(value));
}

function formatCostCellValue(value: HeaterResultRow[typeof RESULT_COL_INDEX.cost]): string {
    const raw = String(value).trim();
    if (!/^-?\d+$/.test(raw)) {
        return escapeHtml(String(value));
    }
    const sign = raw.startsWith("-") ? "-" : "";
    const digits = sign ? raw.slice(1) : raw;
    const groupedDigits = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return escapeHtml(`${sign}${groupedDigits}`);
}

function normalizeArrayResultRow(row: HeaterResultRow): NormalizedResultRow {
    return {
        loadoutValue: row[RESULT_COL_INDEX.loadout],
        costValue:    row[RESULT_COL_INDEX.cost],
        effectValue:  row[RESULT_COL_INDEX.effect],
        p4x4Value:    row[RESULT_COL_INDEX.p4x4],
        maxedValue:   row[RESULT_COL_INDEX.maxed],
    };
}

function buildArrayResultSectionRowsByKey(arrayRows: Array<{ key: ResultKey; rows: HeaterResultRowMatrix }>): Map<ResultKey, HeaterResultRowMatrix> {
    return new Map<ResultKey, HeaterResultRowMatrix>(arrayRows.map(({ key, rows }) => [key, rows]));
}

function buildArraySectionHeaderRow(showP4x4: boolean, effectHeader: string): string {
    return showP4x4
        ? `<tr class="hs-heater-header-row"><th>Types</th><th>Loadout</th><th>Cost</th><th>${escapeHtml(effectHeader)}</th><th>p4x4 eq</th><th>Maxed?</th></tr>`
        : `<tr class="hs-heater-header-row"><th>Types</th><th>Loadout</th><th>Cost</th><th colspan="2">${escapeHtml(effectHeader)}</th><th>Maxed?</th></tr>`;
}

function buildLoadoutActionControls(escapedFullLoadout: string, isValidJson: boolean): string {
    if (!isValidJson) {
        return "";
    }

    const previewIcon = `<span class="hs-heater-json-tooltip-trigger" tabindex="0" data-loadout="${escapedFullLoadout}" role="button" aria-label="Show loadout JSON">🔍</span>`;
    const copyButton = `<button class="hs-heater-copy-loadout-btn" type="button" data-loadout="${escapedFullLoadout}">Copy</button>`;
    const importButton = `<button class="hs-heater-import-loadout-btn" type="button" data-loadout="${escapedFullLoadout}">Import</button>`;
    return `${previewIcon}${copyButton}${importButton}`;
}

function buildArraySectionDataRow(
    key: ResultKey,
    rows: HeaterResultRowMatrix,
    row: HeaterResultRow,
    rowIndex: number,
    showP4x4: boolean,
): string {
    const rowModel = normalizeArrayResultRow(row);
    const loadoutValue = rowModel.loadoutValue;
    const isUnaffordable = loadoutValue === "Unaffordable";
    const fullLoadout = isUnaffordable ? "" : loadoutValue;
    const escapedFullLoadout = escapeHtml(fullLoadout);
    const isValidJson = !isUnaffordable && fullLoadout.trim().startsWith("{") && fullLoadout.trim().endsWith("}");
    const actionControlsHtml = buildLoadoutActionControls(escapedFullLoadout, isValidJson);

    const loadoutCell = isUnaffordable
        ? `<td>${escapeHtml(String(loadoutValue))}</td>`
        : `<td><div class="hs-heater-loadout-buttons">${actionControlsHtml}</div></td>`;
    const perRowLabels = HEATER_RESULT_ROW_LABELS[key];
    const resultCell = perRowLabels
        ? `<td>${escapeHtml(perRowLabels[rowIndex] ?? String(rowIndex))}</td>`
        : rowIndex === 0
            ? `<td rowspan="${rows.length}">${escapeHtml(translateResultKey(key))}</td>`
            : "";
    const costCell = `<td>${formatCostCellValue(rowModel.costValue)}</td>`;
    const effectCell = showP4x4
        ? `<td>${escapeHtml(String(rowModel.effectValue))}</td>`
        : `<td colspan="2">${escapeHtml(String(rowModel.effectValue))}</td>`;
    const p4x4Cell = showP4x4 ? `<td>${escapeHtml(String(rowModel.p4x4Value))}</td>` : "";
    const maxCell = `<td>${rowModel.maxedValue === true ? '<span class="hs-heater-status-maxed">✔</span>' : rowModel.maxedValue === false ? '<span class="hs-heater-status-unmaxed">✘</span>' : escapeHtml(String(rowModel.maxedValue))}</td>`;
    return `<tr>${resultCell}${loadoutCell}${costCell}${effectCell}${p4x4Cell}${maxCell}</tr>`;
}

function buildArraySectionRows(sectionDef: ResultSectionDef, rowsByKey: Map<ResultKey, HeaterResultRowMatrix>): string {
    const matching = sectionDef.keys.filter((key) => rowsByKey.has(key)).map((key) => ({ key, rows: rowsByKey.get(key)! }));
    if (matching.length === 0) {
        return "";
    }

    const titleRow = `<tr><td colspan="${RESULT_TABLE_TOTAL_COLS}" class="hs-heater-title-row">${escapeHtml(sectionDef.title)}</td></tr>`;
    const headerRow = buildArraySectionHeaderRow(sectionDef.showP4x4, sectionDef.effectHeader);
    const dataRows = matching
        .map(({ key, rows }) => rows.map((row, rowIndex) => buildArraySectionDataRow(key, rows, row, rowIndex, sectionDef.showP4x4)).join(""))
        .join("");
    return titleRow + headerRow + dataRows;
}

function buildArrayResultSection(arrayRows: Array<{ key: ResultKey; rows: HeaterResultRowMatrix }>): string {
    const rowsByKey = buildArrayResultSectionRowsByKey(arrayRows);
    const allRows = HEATER_RESULT_SECTIONS.map((sectionDef) => buildArraySectionRows(sectionDef, rowsByKey)).join("");
    return `
        <div class="hs-heater-results-wrapper">
            <table class="hs-heater-subtable hs-heater-results-table">
                <tbody>${allRows}</tbody>
            </table>
        </div>`;
}

export function buildResultTableHtml(result: HeaterOptimizationResult): string {
    const scalarRows: string[] = [];
    const arrayRows: Array<{ key: ResultKey; rows: HeaterResultRowMatrix }> = [];
    const resultEntries = Object.entries(result)
        .filter(([key]) => key !== "input") as Array<[ResultKey, HeaterOptimizationResult[ResultKey]]>;

    resultEntries.forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
            arrayRows.push({ key, rows: value as HeaterResultRowMatrix });
        } else {
            const cellHtml = formatResultCell(value);
            scalarRows.push(`
                <tr>
                    <td>${escapeHtml(translateResultKey(key))}</td>
                    <td class="hs-heater-result-cell">${cellHtml}</td>
                </tr>
            `);
        }
    });

    let html = "";
    if (scalarRows.length > 0) {
        html += `
            <table class="hs-heater-results-table">
                <thead>
                    <tr><th>Result</th><th>Value</th></tr>
                </thead>
                <tbody>${scalarRows.join("")}</tbody>
            </table>
        `;
    }
    if (arrayRows.length > 0) {
        html += buildArrayResultSection(arrayRows);
    }
    return html;
}
