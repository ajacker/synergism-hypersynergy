import type {
    HeaterOptimizationResult,
    HeaterResultArrayKey,
    HeaterResultRow,
    HeaterResultRowMatrix,
} from "../../../types/data-types/hs-heater-types";
import { escapeHtml } from "./hs-heater-ui-input";

type ResultKey = HeaterResultArrayKey;
type RowBasedResultKey = "hyperflux" | "gen";
type SingleResultKey = Exclude<ResultKey, RowBasedResultKey>;

export type HeaterTypeSemanticId = "none" | SingleResultKey | `${RowBasedResultKey}:${number}`;
export type HeaterTypeDropdownOption = {
    semanticId: HeaterTypeSemanticId;
    label: string;
    iconSrc?: string;
};

type ResultRowLabelsMap = Record<RowBasedResultKey, readonly string[]>;
type ResultIconByKeyMap = Record<SingleResultKey, string>;
type ResultIconByRowKeyMap = Record<RowBasedResultKey, readonly string[]>;

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
    gen:       "Amb Gen (Gen1–Gen3)",
    ambOct:    "Max Amb + Oct",
};

const HEATER_RESULT_ROW_LABELS: ResultRowLabelsMap = {
    hyperflux: ["H0", "H1", "H2", "H3", "H4", "H5", "H6", "H7"],
    gen:       ["Gen 1 + Oct", "Gen 2 + Oct", "Gen 3 + Oct"],
};

const HEATER_RESULT_ICON_BY_KEY: ResultIconByKeyMap = {
    luck:   "Pictures/Default/BlueberryLuck2.png",
    rLuck:  "Pictures/Default/BlueberryFreeRedLuckUpgrades.png",
    allAmb: "Pictures/Default/BlueberryFreeGenerationLevels.png",
    quarks: "Pictures/Default/BlueberryQuarks2.png",
    cubes:  "Pictures/Default/BlueberryCubes.png",
    oct:    "Pictures/Default/BlueberryCubes3.png",
    obt:    "Pictures/Default/BlueberryObtainium.png",
    off:    "Pictures/Default/BlueberryOffering.png",
    ambOct: "Pictures/Default/BlueberryLuck4.png",
};

const HEATER_RESULT_ICON_BY_ROW_KEY: ResultIconByRowKeyMap = {
    hyperflux: [
        "Pictures/Default/BlueberryHyperflux.png",
        "Pictures/Default/BlueberryHyperflux.png",
        "Pictures/Default/BlueberryHyperflux.png",
        "Pictures/Default/BlueberryHyperflux.png",
        "Pictures/Default/BlueberryHyperflux.png",
        "Pictures/Default/BlueberryHyperflux.png",
        "Pictures/Default/BlueberryHyperflux.png",
        "Pictures/Default/BlueberryHyperflux.png",
    ],
    gen: [
        "Pictures/Default/BlueberryBrickOfLead.png",
        "Pictures/Default/BlueberryBrickOfLead.png",
        "Pictures/Default/BlueberryBrickOfLead.png",
    ],
};


// ===========================================================
// Semantic-ID API
// ===========================================================

function isResultKey(value: string): value is ResultKey {
    return value in HEATER_RESULT_DISPLAY_MAP;
}

function isRowBasedResultKey(value: string): value is RowBasedResultKey {
    return value === "hyperflux" || value === "gen";
}

export function resolveHeaterIconFromSemanticId(semanticId: string): string | null {
    const normalized = semanticId.trim();
    if (!normalized || normalized === "none") return null;

    const [baseKeyRaw, rowIndexRaw] = normalized.split(":");
    if (!baseKeyRaw) return null;

    if (rowIndexRaw !== undefined) {
        if (isRowBasedResultKey(baseKeyRaw) && /^\d+$/.test(rowIndexRaw)) {
            const rowIndex = Number(rowIndexRaw);
            const rowIcons = HEATER_RESULT_ICON_BY_ROW_KEY[baseKeyRaw];
            return rowIcons?.[rowIndex] ?? null;
        }
        return null;
    }

    if (!isResultKey(baseKeyRaw) || isRowBasedResultKey(baseKeyRaw)) return null;
    return HEATER_RESULT_ICON_BY_KEY[baseKeyRaw] ?? null;
}

export function getHeaterTypeDropdownOptionsWithIcons(): HeaterTypeDropdownOption[] {
    const options: HeaterTypeDropdownOption[] = [
        { semanticId: "none", label: "None", iconSrc: "Pictures/Default/BlueberryTutorial.png" },
    ];

    for (const [key, label] of Object.entries(HEATER_RESULT_DISPLAY_MAP) as Array<[ResultKey, string]>) {
        if (isRowBasedResultKey(key)) {
            const rowLabels = HEATER_RESULT_ROW_LABELS[key] ?? [];
            const rowIcons = HEATER_RESULT_ICON_BY_ROW_KEY[key] ?? [];
            rowLabels.forEach((rowLabel, rowIndex) => {
                options.push({
                    semanticId: `${key}:${rowIndex}`,
                    label: rowLabel,
                    iconSrc: rowIcons[rowIndex],
                });
            });
            continue;
        }
        options.push({ semanticId: key, label, iconSrc: HEATER_RESULT_ICON_BY_KEY[key] });
    }
    return options;
}


// ===========================================================
// Normalized result API
// ===========================================================

/**
 * Flattens a HeaterOptimizationResult into a normalized list of all loadouts with semanticId, label, icon, and row data.
 * Each entry contains: semanticId, label, iconSrc, rowData, key, rowIndex.
 */
export type NormalizedHeaterResultEntry = {
    semanticId: HeaterTypeSemanticId;
    label: string;
    iconSrc?: string;
    rowData: HeaterResultRow;
    key: ResultKey;
    rowIndex: number;
};

export function normalizeHeaterOptimizationResult(
    result: HeaterOptimizationResult
): NormalizedHeaterResultEntry[] {
    const options = getHeaterTypeDropdownOptionsWithIcons();
    const optionMap = new Map<string, { label: string; iconSrc?: string }>();
    for (const opt of options) {
        optionMap.set(opt.semanticId, { label: opt.label, iconSrc: opt.iconSrc });
    }

    const entries: NormalizedHeaterResultEntry[] = [];
    const resultEntries = Object.entries(result)
        .filter(([key]) => key !== "input") as Array<[ResultKey, HeaterOptimizationResult[ResultKey]]>;

    for (const [key, value] of resultEntries) {
        if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
            // Row-based (matrix) result
            if (isRowBasedResultKey(key)) {
                for (let rowIndex = 0; rowIndex < value.length; rowIndex++) {
                    const semanticId = `${key}:${rowIndex}` as HeaterTypeSemanticId;
                    const opt = optionMap.get(semanticId);
                    if (!opt) continue;
                    entries.push({
                        semanticId,
                        label: opt.label,
                        iconSrc: opt.iconSrc,
                        rowData: value[rowIndex],
                        key,
                        rowIndex,
                    });
                }
            } else {
                // Single-row array result (e.g., luck, rLuck, ...)
                const semanticId = key as HeaterTypeSemanticId;
                const opt = optionMap.get(semanticId);
                if (!opt) continue;
                entries.push({
                    semanticId,
                    label: opt.label,
                    iconSrc: opt.iconSrc,
                    rowData: value[0],
                    key,
                    rowIndex: 0,
                });
            }
        }
    }
    return entries;
}


// ===========================================================
// Table rendering
// ===========================================================

type ResultSectionDef = {
    title: string;
    keys: ResultKey[];
    showP4x4: boolean;
    effectHeader: string;
};

const HEATER_RESULT_SECTIONS: ResultSectionDef[] = [
    { title: "Common Loadouts", keys: ["luck", "rLuck", "allAmb", "quarks", "cubes", "oct", "obt", "off"], showP4x4: false, effectHeader: "Effect" },
    { title: "p4x4 Loadouts",   keys: ["hyperflux"],                                                       showP4x4: true,  effectHeader: "Effect" },
    { title: "Hybrid Loadouts", keys: ["gen", "ambOct"],                                                   showP4x4: false, effectHeader: "Oct Effect" },
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

function buildTypeLabelWithIcon(label: string, iconSrc?: string): string {
    const safeLabel = escapeHtml(label);
    if (!iconSrc) return `<span class="hs-heater-type-label">${safeLabel}</span>`;

    return `<img class="hs-heater-type-icon" src="${escapeHtml(iconSrc)}" alt="" aria-hidden="true" /><span class="hs-heater-type-label">${safeLabel}</span>`;
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
    if (!isValidJson) return "";

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
    const isRowBased = isRowBasedResultKey(key);
    const perRowLabels = isRowBased ? HEATER_RESULT_ROW_LABELS[key] : undefined;
    const perRowIcons = isRowBased ? HEATER_RESULT_ICON_BY_ROW_KEY[key] : undefined;
    const resultCell = perRowLabels
        ? `<td>${buildTypeLabelWithIcon(perRowLabels[rowIndex] ?? String(rowIndex), perRowIcons?.[rowIndex])}</td>`
        : rowIndex === 0
            ? `<td rowspan="${rows.length}">${buildTypeLabelWithIcon(translateResultKey(key), HEATER_RESULT_ICON_BY_KEY[key as SingleResultKey])}</td>`
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
    if (matching.length === 0) return "";

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
            <div class="hs-heater-results-header"></div>
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
