import type Decimal from "break_infinity.js";
import { GameData } from "./hs-player-savedata";

export interface HeaterOptimizerInput {
    amb: number;
    ramb: number;
    ambSpeedNonAmbBerries: number;
    blueberries: number;
    luckBaseNonAmb: number;
    luckMultNonAmb: number;
    redLuckBase: number;
    luckConversion: number;
    quarksOwned: number;
    qHept: number;
    cubesExpTotal: number;
    currentSingularity: number;
    singularityReducers: number;
    exalt: number;
    postAoag: boolean;
    transcription: number;
    ascSpeed: number;
    ascSpread: number;
    baseObt: number;
    baseOff: number;
    bonusRow2: number;
    bonusRow3: number;
    bonusRow4: number;
    bonusRow5: number;
    runeSiExp: Decimal;
    runeSiRC: number;
    runeSiBonusLevelsTotal: number;
    runeIaExp: Decimal;
    runeIaBonusLevelsTotal: Decimal;
    runeIaBonusLevelsTalisman: Decimal;
    baseTalismanPower: Decimal;
    patreonBonus: number;
    activeBells: number;
    jack: boolean;
    freeShopLevelsInfinity: number;
    freeShopLevelsQuark: number;
    chronometerLevel: number;
    shopAmbrosiaLuck1: number;
    shopAmbrosiaLuck2: number;
    shopAmbrosiaLuck3: number;
    shopAmbrosiaLuck4: number;
    shopRedLuck1: number;
    shopRedLuck2: number;
    shopRedLuck3: number;
    shopAmbrosiaGeneration1: number;
    shopAmbrosiaGeneration2: number;
    shopAmbrosiaGeneration3: number;
    shopAmbrosiaGeneration4: number;
    shopImproveQuarkHept1: number;
    shopImproveQuarkHept2: number;
    shopImproveQuarkHept3: number;
    shopImproveQuarkHept4: number;
    shopImproveQuarkHept5: number;
    ossifiedTactics: number;
    ossifiedTactics2: number;
    redberries: number;
    viscount: boolean;
    heaterOptions: boolean[];
}

export type HeaterResultAffordableRow = [
    loadoutJson: string,
    sheetSpacerA: null,
    blueberryCost: number,
    cost: number,
    effect: string,
    p4x4Eq: number | "Never",
    isMaxed: boolean,
];

export type HeaterResultUnaffordableRow = [
    loadoutLabel: "Unaffordable",
    sheetSpacerA: null,
    blueberryCost: "N / A",
    cost:   "N / A",
    effect: "N / A",
    p4x4Eq: "N / A",
    isMaxed: false,
];

export type HeaterResultRow = HeaterResultAffordableRow | HeaterResultUnaffordableRow;
export type HeaterResultRowMatrix = HeaterResultRow[];

export type HeaterResultArrayKey =
    | 'luck'
    | 'rLuck'
    | 'allAmb'
    | 'quarks'
    | 'cubes'
    | 'oct'
    | 'obt'
    | 'off'
    | 'hyperflux'
    | 'ambOct'
    | 'gen';

export type RowBasedResultKey = 'hyperflux' | 'gen';
export type SingleResultKey = Exclude<HeaterResultArrayKey, RowBasedResultKey>;
export type HeaterTypeSemanticId = 'none' | SingleResultKey | `${RowBasedResultKey}:${number}`;
export type HeaterResultSectionId = 'common' | 'p4x4' | 'hybrid';

export type NormalizedHeaterResultEntry = {
    semanticId: HeaterTypeSemanticId;
    label: string;
    rowData: HeaterResultRow;
    key: HeaterResultArrayKey;
    section: HeaterResultSectionId;
    rowIndex: number;
    isRowBased: boolean;
};

export interface HeaterOptimizationResult {
    input: HeaterOptimizerInput;
    // calculateAmb
    luck?: HeaterResultRowMatrix;    // Q4  — best luck loadout
    rLuck?: HeaterResultRowMatrix;   // Q5  — best red luck loadout
    allAmb?: HeaterResultRowMatrix;  // Q6  — best all-ambrosia loadout
    // calculateQuarks
    quarks?: HeaterResultRowMatrix;  // Q7  — best quarks loadout
    // calculateCubes
    cubes?: HeaterResultRowMatrix;   // Q8  — best cubes loadout
    // calculateOct
    oct?: HeaterResultRowMatrix;     // Q9  — best octeract loadout
    // calculateOff
    obt?: HeaterResultRowMatrix;     // Q10 — best obtainium loadout
    off?: HeaterResultRowMatrix;     // Q11 — best offering loadout
    // calculateHyperflux (up to 8 rows: hyperflux level 0–7)
    hyperflux?: HeaterResultRowMatrix;
    // calculateAmbOct
    ambOct?: HeaterResultRowMatrix;  // Q25 — best amb+oct loadout
    // calculateGen (3 rows: gen level 1–3)
    gen?: HeaterResultRowMatrix;
}
