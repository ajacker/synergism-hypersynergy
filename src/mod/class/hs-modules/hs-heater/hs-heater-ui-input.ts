import Decimal from "break_infinity.js";
import { HSUIC } from "../../hs-core/hs-ui-components";
import type { HeaterOptimizerInput } from "../../../types/data-types/hs-heater-types";
import { HSInputType } from "../../../types/module-types/hs-ui-types";

type HeaterInputBase = Omit<HeaterOptimizerInput, 'heaterOptions'>;
type HeaterInputKey = keyof HeaterInputBase;
type HeaterInputValue = HeaterInputBase[HeaterInputKey];

type HeaterFieldType = 'number' | 'percent' | 'boolean' | 'text' | 'select';
type HeaterFieldBase<K extends HeaterInputKey = HeaterInputKey> = {
    key: K;
    label: string;
    type: HeaterFieldType;
    url?: string;
};
type HeaterSelectField<K extends HeaterInputKey = HeaterInputKey> = HeaterFieldBase<K> & {
    type: 'select';
    options: ReadonlyArray<{ value: number; label: string }>;
};
type HeaterNonSelectField<K extends HeaterInputKey = HeaterInputKey> = HeaterFieldBase<K> & {
    type: Exclude<HeaterFieldType, 'select'>;
    options?: never;
};
type HeaterInputField = HeaterSelectField | HeaterNonSelectField;

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export class HSHeaterInputUI {

    // ================================================================
    // Static Configuration / Constants
    // ================================================================

    static readonly inputDefinitions = [
        { key: "amb",                       label: "Lifetime Ambrosia",         type: "number",  url: "Pictures/Achievements/Progressive/AmbrosiaCount.png" },
        { key: "ramb",                      label: "Lifetime Red Ambrosia",     type: "number",  url: "Pictures/Achievements/Progressive/RedAmbrosiaCount.png" },
        { key: "ambSpeedNonAmbBerries",     label: "Base Amb Speed/s",          type: "number",  url: "Pictures/PseudoShop/AMBROSIATimeSkip.png" },
        { key: "blueberries",               label: "Blueberries Owned",         type: "number",  url: "Pictures/Default/Blueberries.png" },
        { key: "luckBaseNonAmb",            label: "Base Luck",                 type: "number",  url: "Pictures/Achievements/Rewards/AmbrosiaLuck.png" },
        { key: "luckMultNonAmb",            label: "Base Luck Mult",            type: "percent", url: "Pictures/PseudoShop/AMBROSIA_LUCK_BUFF.png" },
        { key: "redLuckBase",               label: "Base Red Luck",             type: "number",  url: "Pictures/Achievements/Rewards/RedAmbrosiaLuck.png" },
        { key: "luckConversion",            label: "Luck Conversion",           type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaConversionImprovement1.png" },
        { key: "quarksOwned",               label: "Quarks Owned",              type: "number",  url: "Pictures/Default/Quark.png" },
        { key: "qHept",                     label: "Quark Hepteract",           type: "number",  url: "Pictures/Default/HepteractQuark.png" },
        { key: "cubesExpTotal",             label: "Total Cubes Exp.",          type: "number",  url: "Pictures/Default/WowCube.png" },
        { key: "currentSingularity",        label: "Current Singularity",       type: "number",  url: "Pictures/Default/Singularity.png" },
        { key: "singularityReducers",       label: "Singularity Reducers",      type: "number",  url: "Pictures/Default/BlueberrySingReduction.png" },
        { key: "exalt", label: "Exalt?", type: "select", options: [
            { value: 0, label: "None" },
            { value: 1, label: "Exalt 1" },
            { value: 2, label: "Exalt 2" },
            { value: 3, label: "Exalt 3" },
            { value: 4, label: "Exalt 4" },
            { value: 5, label: "Exalt 5" },
            { value: 6, label: "Exalt 6" },
            { value: 7, label: "Exalt 7" },
            { value: 8, label: "Exalt 8" },
            { value: 9, label: "Exalt 9" },
        ] as const, url: "Pictures/Default/TinySChalTime.png" },
        { key: "postAoag",                  label: "Post-AoAG (Obt/Off)",       type: "boolean", url: "Pictures/Runes/Antiquities.png" },
        { key: "transcription",             label: "Transcription",             type: "number",  url: "Pictures/Default/OcteractOneMindImprover.png" },
        { key: "ascSpeed",                  label: "Asc. Speed",                type: "number",  url: "Pictures/Default/TinySpeedAscension.png" },
        { key: "ascSpread",                 label: "Asc. Spread",               type: "number",  url: "Pictures/Default/SingularityAscensionSpeed.png" },
        { key: "baseObt",                   label: "Base Obtainium",            type: "number",  url: "Pictures/Default/Obtainium.png" },
        { key: "baseOff",                   label: "Base Offering",             type: "number",  url: "Pictures/Default/Offering.png" },
        { key: "bonusRow2",                 label: "Bonus Row 2",               type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow2.png" },
        { key: "bonusRow3",                 label: "Bonus Row 3",               type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow3.png" },
        { key: "bonusRow4",                 label: "Bonus Row 4",               type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow4.png" },
        { key: "bonusRow5",                 label: "Bonus Row 5",               type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow5.png" },
        { key: "runeSiExp",                 label: "SI Rune Exp.",              type: "text",    url: "Pictures/Runes/SuperiorIntellect.png" },
        { key: "runeSiRC",                  label: "SI Rune Coeff",             type: "number",  url: "Pictures/Runes/SuperiorIntellect.png" },
        { key: "runeSiBonusLevelsTotal",    label: "SI Bonus Levels",           type: "number",  url: "Pictures/Runes/SuperiorIntellect.png" },
        { key: "runeIaExp",                 label: "IA Rune Exp.",              type: "text",    url: "Pictures/Runes/InfiniteAscent.png" },
        { key: "runeIaBonusLevelsTotal",    label: "IA Bonus Levels (total)",   type: "text",    url: "Pictures/Runes/InfiniteAscent.png" },
        { key: "runeIaBonusLevelsTalisman", label: "IA Bonus Levels (talisman)",type: "text",    url: "Pictures/Runes/InfiniteAscent.png" },
        { key: "baseTalismanPower",         label: "Talisman Power Mult.",      type: "text",    url: "Pictures/Default/BlueberryTalismanBonusRuneLevel.png" },
        { key: "patreonBonus",              label: "Patreon Bonus",             type: "percent", url: "Pictures/PseudoShop/GOLDEN_QUARK_BUFF.png" },
        { key: "activeBells",               label: "Active Bells",              type: "number",  url: "Pictures/PseudoShop/HAPPY_HOUR_BELL.png" },
        { key: "jack",                      label: "Jack of All Trades",        type: "boolean", url: "Pictures/Default/ShopPanthema.png" },
        { key: "freeShopLevelsInfinity",    label: "Free Infinity Upgrades",    type: "number",  url: "Pictures/Default/ShopInfiniteShopUpgrades.png" },
        { key: "freeShopLevelsQuark",       label: "Free Shop Q. Levels",       type: "number",  url: "Pictures/Default/Quark.png" },
        { key: "chronometerLevel",          label: "Chronometer Level",         type: "number",  url: "Pictures/Default/ShopChronometerInfinity.png" },
        { key: "shopAmbrosiaLuck1",         label: "Shop Ambrosia Luck 1",      type: "number",  url: "Pictures/Default/ShopAmbrosiaLuck1.png" },
        { key: "shopAmbrosiaLuck2",         label: "Shop Ambrosia Luck 2",      type: "number",  url: "Pictures/Default/ShopAmbrosiaLuck2.png" },
        { key: "shopAmbrosiaLuck3",         label: "Shop Ambrosia Luck 3",      type: "number",  url: "Pictures/Default/ShopAmbrosiaLuck3.png" },
        { key: "shopAmbrosiaLuck4",         label: "Shop Ambrosia Luck 4",      type: "number",  url: "Pictures/Default/ShopAmbrosiaLuck4.png" },
        { key: "shopRedLuck1",              label: "Shop Red Luck 1",           type: "number",  url: "Pictures/Default/ShopRedLuck1.png" },
        { key: "shopRedLuck2",              label: "Shop Red Luck 2",           type: "number",  url: "Pictures/Default/ShopRedLuck2.png" },
        { key: "shopRedLuck3",              label: "Shop Red Luck 3",           type: "number",  url: "Pictures/Default/ShopRedLuck3.png" },
        { key: "shopAmbrosiaGeneration1",   label: "Shop Ambrosia Gen 1",       type: "number",  url: "Pictures/Default/ShopAmbrosiaGeneration1.png" },
        { key: "shopAmbrosiaGeneration2",   label: "Shop Ambrosia Gen 2",       type: "number",  url: "Pictures/Default/ShopAmbrosiaGeneration2.png" },
        { key: "shopAmbrosiaGeneration3",   label: "Shop Ambrosia Gen 3",       type: "number",  url: "Pictures/Default/ShopAmbrosiaGeneration3.png" },
        { key: "shopAmbrosiaGeneration4",   label: "Shop Ambrosia Gen 4",       type: "number",  url: "Pictures/Default/ShopAmbrosiaGeneration4.png" },
        { key: "shopImproveQuarkHept1",     label: "Shop QHept 1",              type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteract0.png" },
        { key: "shopImproveQuarkHept2",     label: "Shop QHept 2",              type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteract.png" },
        { key: "shopImproveQuarkHept3",     label: "Shop QHept 3",              type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteract2.png" },
        { key: "shopImproveQuarkHept4",     label: "Shop QHept 4",              type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteract3.png" },
        { key: "shopImproveQuarkHept5",     label: "Shop QHept ∞",              type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteractInfinity.png" },
        { key: "ossifiedTactics",           label: "Ossified Tactics",          type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaRegularLuck.png" },
        { key: "ossifiedTactics2",          label: "Ossified Tactics II",       type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaRegularLuck.png" },
        { key: "redberries",                label: "Berries that are... blue?", type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaBlueberries.png" },
        { key: "viscount",                  label: "Viscount",                  type: "boolean", url: "Pictures/RedAmbrosia/RedAmbrosiaTutorial.png" },
    ] as const satisfies readonly HeaterInputField[];

    static readonly exportFieldExtractors: Readonly<Partial<{ [K in HeaterInputKey]: (hsData: any) => HeaterInputBase[K] }>> = {
        amb: (hsData) => hsData.lifetimeAmbrosia,
        ramb: (hsData) => hsData.lifetimeRedAmbrosia,
        luckMultNonAmb: (hsData) => hsData.luckMultNonAmb - 1,
        ossifiedTactics: (hsData) => hsData.redAmbrosiaUpgrades.regularLuck,
        ossifiedTactics2: (hsData) => hsData.redAmbrosiaUpgrades.regularLuck2,
        redberries: (hsData) => hsData.redAmbrosiaUpgrades.blueberries,
        viscount: (hsData) => Boolean(hsData.redAmbrosiaUpgrades.viscount),
    };

    static readonly heaterOptionLabels = [
        "Luck",                           // a[0]: calculateAmb
        "Quarks",                         // a[1]: calculateQuarks
        "3-7D Cubes",                     // a[2]: calculateCubes
        "Octeracts",                      // a[3]: calculateOct
        "Obtainium + Offering",           // a[4]: calculateOff
        "Hyperflux (p4x4, pre-AoAG)",     // a[5]: calculateHyperflux
        "Max Amb",                        // a[6]: calculateAmbOct
        "Amb Generation + Oct",           // a[7]: calculateGen
    ];

    private static readonly lockHandlersAttachedModals = new WeakSet<HTMLElement>();


    // ================================================================
    // Public Workflow / API
    // ================================================================

    static buildOptimizerInput(exportData: any): HeaterOptimizerInput {
        return {
            ...this.buildOptimizerInputBaseFromExportData(exportData),
            heaterOptions: Array(this.heaterOptionLabels.length).fill(true),
        };
    }

    static buildOptimizerInputBaseFromExportData(exportData: any): HeaterInputBase {
        const hsData = exportData?.hs_data;
        if (!hsData || typeof hsData !== 'object') {
            return this.mapFields((field) => this.parseFieldValueFromInputElement(field.type, null) as HeaterInputValue);
        }
        return this.mapFields((field) => this.extractFieldValueFromExportData(field, hsData));
    }

    static buildInputTable(input: HeaterOptimizerInput): string {
        const rows = this.inputDefinitions.map((field) => {
            const value = input[field.key] as number | Decimal | boolean;
            return this.buildInputTableRow(field, value);
        });

        return `
            <table class="hs-heater-input-table">
                <tbody>${rows.join('')}</tbody>
            </table>
        `;
    }

    static buildHeaterOptionToggleGrid(active: boolean[]): string {
        const checkboxRows = this.heaterOptionLabels.map((label, index) => {
            const fieldId = `hs-heater-input-active-${index}`;
            const checked = active[index] ? 'checked' : '';
            return `
                <label class="hs-heater-active-label">
                    <input type="checkbox" id="${fieldId}" class="hs-heater-active-checkbox" ${checked} />
                    ${label}
                </label>
            `;
        });

        return `
           <label class="hs-heater-inputs-title">Active Branches:</label>
           <div class="hs-heater-active-grid">
                ${checkboxRows.join('')}
            </div>
        `;
    }

    static applyOptimizerInputToFields(modal: HTMLElement, input: HeaterOptimizerInput, applyLocked = true): void {
        this.inputDefinitions.forEach((field) => {
            if (!applyLocked && this.isFieldLocked(modal, field.key)) return;

            const element = this.getFieldElement(modal, field);
            if (!element) return;

            if (field.type === "boolean") {
                if (element instanceof HTMLInputElement) {
                    element.checked = Boolean(input[field.key]);
                }
            } else {
                element.value = this.formatFieldValueForInput(field.type, input[field.key]);
            }
        });
    }

    static readInputValues(modal: HTMLElement): HeaterOptimizerInput {
        const heaterOptions = this.heaterOptionLabels.map((_, index) => {
            const element = modal.querySelector<HTMLInputElement>(`#hs-heater-input-active-${index}`);
            return this.parseFieldValueFromInputElement('boolean', element) as boolean;
        });

        return {
            ...this.parseInputBaseRawFromModal(modal),
            heaterOptions,
        };
    }

    static setFieldLockState(modal: HTMLElement, fieldKey: string, locked: boolean): void {
        const lockButton = modal.querySelector<HTMLButtonElement>(`#hs-heater-lock-${fieldKey}`);
        if (!lockButton) return;

        lockButton.dataset.locked = String(locked);
        lockButton.textContent = locked ? '🔒' : '🔓';

        const lockCell = lockButton.parentElement;
        if (lockCell) {
            lockCell.classList.toggle('hs-heater-lock-cell-locked', locked);
        }
    }

    static isFieldLocked(modal: HTMLElement, fieldKey: string): boolean {
        const lockButton = modal.querySelector<HTMLButtonElement>(`#hs-heater-lock-${fieldKey}`);
        if (!lockButton) return false;
        return lockButton.dataset.locked === 'true';
    }

    static toggleFieldLock(modal: HTMLElement, fieldKey: string): void {
        const currentlyLocked = this.isFieldLocked(modal, fieldKey);
        this.setFieldLockState(modal, fieldKey, !currentlyLocked);
    }

    static attachInputLockHandlers(modal: HTMLElement): void {
        if (this.lockHandlersAttachedModals.has(modal)) return;

        this.inputDefinitions.forEach((field) => {
            const element = this.getFieldElement(modal, field);
            if (!element) return;

            element.addEventListener('change', () => {
                this.setFieldLockState(modal, field.key, true);
            });
        });
        this.lockHandlersAttachedModals.add(modal);
    }


    // ================================================================
    // Internal Helpers
    // ================================================================

    static formatFieldValueForInput(fieldType: 'number' | 'percent' | 'boolean' | 'text' | 'select', value: unknown): string {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return fieldType === 'percent' ? String(value * 100) : String(value);
        }
        if (value instanceof Decimal) {
            return value.toString();
        }
        return '';
    }

    static getFieldElement(
        modal: HTMLElement,
        field: HeaterInputField
    ): HTMLInputElement | HTMLSelectElement | null {
        const selector = `#hs-heater-input-${field.key}`;
        if (field.type === 'select') {
            return modal.querySelector<HTMLSelectElement>(selector);
        }
        return modal.querySelector<HTMLInputElement>(selector);
    }

    static parseFieldValueFromInputElement(
        fieldType: 'number' | 'percent' | 'boolean' | 'text' | 'select',
        element: HTMLInputElement | HTMLSelectElement | null,
        fallback = 0
    ): number | boolean | Decimal {
        if (fieldType === 'boolean') {
            return element instanceof HTMLInputElement ? element.checked : false;
        }
        if (!element) {
            return fieldType === 'text' ? new Decimal(fallback) : fallback;
        }

        const rawValue = element.value.trim();
        if (fieldType === 'text') {
            if (rawValue === '') {
                return new Decimal(fallback);
            }
            try {
                return new Decimal(rawValue);
            } catch {
                return new Decimal(fallback);
            }
        }

        const parsed = fieldType === 'percent' ? Number(rawValue) / 100 : Number(rawValue);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    static extractFieldValueFromExportData(field: HeaterInputField, hsData: any): HeaterInputValue {
        const extractor = this.exportFieldExtractors[field.key];
        if (extractor) {
            return extractor(hsData);
        }
        return hsData[field.key] as HeaterInputValue;
    }

    static parseInputBaseRawFromModal(modal: HTMLElement): HeaterInputBase {
        return this.mapFields((field) => {
            const element = this.getFieldElement(modal, field);
            return this.parseFieldValueFromInputElement(field.type, element);
        });
    }

    static buildFieldInputHtml(field: HeaterInputField, value: number | Decimal | boolean): string {
        const fieldId = `hs-heater-input-${field.key}`;
        const displayedValue = this.formatFieldValueForInput(field.type, value);

        if (field.type === "boolean") {
            return HSUIC.Input({ id: fieldId, type: HSInputType.CHECK, props: value ? { checked: 'true' } : undefined });
        }
        if (field.type === 'select') {
            return `<select id="${fieldId}" class="hs-heater-select-input">${
                this.buildSelectOptionHtml(
                    field.options,
                    displayedValue
                )
            }</select>`;
        }
        if (field.type === 'percent') {
            return `<div class="hs-heater-percent-input-wrap">${HSUIC.Input({ id: fieldId, type: HSInputType.NUMBER, props: { value: displayedValue, step: 'any', min: '0' } })}<span>%</span></div>`;
        }

        return HSUIC.Input({
            id: fieldId,
            type: field.type === 'text' ? HSInputType.TEXT : HSInputType.NUMBER,
            props: field.type === 'text'
                ? { value: displayedValue }
                : { value: displayedValue, step: 'any', min: '0' }
        });
    }

    static buildSelectOptionHtml(
        options: ReadonlyArray<{ value: number; label: string }>,
        displayedValue: string
    ): string {
        return options
            .map(opt => `<option value="${opt.value}"${ Number(displayedValue) === opt.value ? ' selected' : '' }>${escapeHtml(opt.label)}</option>`)
            .join('');
    }

    static buildInputTableRow(field: HeaterInputField, value: number | Decimal | boolean): string {
        const lockId = `hs-heater-lock-${field.key}`;
        const iconHtml = field.url
            ? `<img src="${field.url}" alt="${escapeHtml(field.label)}" width="20" height="20" class="hs-heater-icon-image" />`
            : '';
        const inputHtml = this.buildFieldInputHtml(field, value);

        return `
                <tr>
                    <td>${iconHtml}</td>
                    <td>${escapeHtml(field.label)}</td>
                    <td>${inputHtml}</td>
                    <td><button type="button" id="${lockId}" class="hs-heater-lock-button disable-hover-color" data-field-key="${field.key}" data-locked="false" aria-label="Toggle lock">🔓</button></td>
                </tr>
            `;
    }

    static mapFields(mapper: (field: HeaterInputField) => HeaterInputValue): HeaterInputBase;
    static mapFields<T>(mapper: (field: HeaterInputField) => T): Record<HeaterInputKey, T>;
    static mapFields<T>(mapper: (field: HeaterInputField) => T): Record<HeaterInputKey, T> {
        return Object.fromEntries(
            this.inputDefinitions.map((field) => [field.key, mapper(field)] as const)
        ) as Record<HeaterInputKey, T>;
    }
}
