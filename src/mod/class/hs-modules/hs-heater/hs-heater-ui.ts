import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSUI } from "../../hs-core/hs-ui";
import { HSUIC } from "../../hs-core/hs-ui-components";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { HSHeaterAPI } from "./hs-heater-api";
import type { HeaterExportData, HeaterOptimizerInput, HeaterOptimizationResult } from "../../../types/data-types/hs-heater-types";
import { HSInputType } from "../../../types/module-types/hs-ui-types";
import { HSUtils } from "../../hs-utils/hs-utils";

export class HSHeaterUI {
    private static readonly inputDefinitions = [
        { key: "amb",           label: "Lifetime Ambrosia",     type: "number" },
        { key: "quark",         label: "Quarks",                type: "number" },
        { key: "plat4x4",       label: "Platonic 4x4",          type: "number" },
        { key: "baseluck",      label: "Base Luck",             type: "number" },
        { key: "multluck",      label: "Base Luck Mult",        type: "number" },
        { key: "cube",          label: "Total Cubes Exp.",      type: "number" },
        { key: "singularity",   label: "Effective Singularity", type: "number" },
        { key: "isInsideExalt", label: "Exalt",                 type: "boolean" },
        { key: "postaoag",      label: "Post-AoAG (Obt/Off)",   type: "boolean" },
        { key: "transcription", label: "Transcription",         type: "number" },
        { key: "ascspeed1",     label: "Asc. Speed (C)",        type: "number" },
        { key: "ascspeed2",     label: "Asc. Speed (H)",        type: "number" },
        { key: "spread",        label: "Spread",                type: "number" },
        { key: "voucher",       label: "Total Vouchers",        type: "number" },
        { key: "baseobt",       label: "Base Obtainium",        type: "number" },
        { key: "baseoff",       label: "Base Offering",         type: "number" },
        { key: "bb",            label: "Blueberries",           type: "number" },
        { key: "bonusRow2",     label: "Bonus Row 2",           type: "number" },
        { key: "bonusRow3",     label: "Bonus Row 3",           type: "number" },
        { key: "bonusRow4",     label: "Bonus Row 4",           type: "number" },
        { key: "bonusRow5",     label: "Bonus Row 5",           type: "number" },
        { key: "ramb",          label: "Lifetime Red Amb",      type: "number" },
        { key: "runeexp",       label: "Rune Exp. (log) (>50)", type: "number" },
        { key: "sirc",          label: "SI Non-Amb Rune Coeff", type: "number" },
        { key: "bonussi",       label: "Bonus SI",              type: "number" },
        { key: "totalbonusia",    label: "Bonus IA (total)",    type: "number" },
        { key: "talismanbonusia", label: "Bonus IA (talisman)", type: "number" },
        { key: "btp",             label: "Base Talisman Power", type: "number" },
    ] as const;

    private static readonly activeLabels = ["C1: Quarks", "C2: 3-7D Cubes", "C3: Octeracts", "C4: Luck", "A: Obt/Off", "H: p4x4 (pre-AOAG)", "S: Max SR", "M: Amb + Oct"];

    private static currentResultModalId: string | null = null;

    private static readonly resultKeyDisplayMap: Record<string, string> = {
        c1: 'C1: Quarks',
        c2: 'C2: 3-7D Cubes',
        c3: 'C3: Octeracts',
        c4: 'C4: Luck',
        a1: 'A1: Obtaining',
        a2: 'A2: Offering',
        h0: 'H0: Octeracts',
        h1: 'H1',
        h2: 'H2',
        h3: 'H3',
        h4: 'H4',
        h5: 'H5',
        h6: 'H6',
        h7: 'H7',
        s1: 'S1: Max SR1',
        s2: 'S2: Max SR2',
        m0: 'M0: Max Luck',
    };

    private static translateResultKey(key: string): string {
        return this.resultKeyDisplayMap[key] ?? key;
    }

    static async openHeaterComputationModal(): Promise<void> {
        const hsui = HSModuleManager.getModule<HSUI>('HSUI');
        if (!hsui) return;
        const dataModule = HSModuleManager.getModule<HSGameDataAPI>("HSGameDataAPI");
        if (!dataModule) return;
        const heaterData = await dataModule.dumpDataForHeater();
        if (!heaterData) return;

        const initialInput = this.buildOptimizerInput(heaterData);

        HSUI.injectStyle(`
            .hs-heater-modal-block { display: flex; gap: 14px; max-width: 860px; }
            .hs-heater-results-modal-block { display: block; max-width: none; width: auto; }
            .hs-heater-modal-left { flex: 1 1 auto; min-width: 0; }
            .hs-heater-modal-right { flex: 0 0 auto; display: flex; flex-direction: column; gap: 12px; width: auto; }
            .hs-heater-input-table, .hs-heater-results-table, .hs-heater-subtable { border-collapse: collapse; }
            .hs-heater-input-table { width: auto; table-layout: fixed; }
            .hs-heater-results-table, .hs-heater-subtable { width: auto; table-layout: auto; }
            .hs-heater-input-table td, .hs-heater-input-table th,
            .hs-heater-results-table td, .hs-heater-results-table th,
            .hs-heater-subtable td, .hs-heater-subtable th { padding: 0px 8px; border: 1px solid rgba(255,255,255,0.08); }
            .hs-heater-input-table td:first-child, .hs-heater-input-table th:first-child { width: auto; white-space: nowrap; }
            .hs-heater-input-table td:last-child, .hs-heater-input-table th:last-child { width: 200px; }
            .hs-heater-results-table th:first-child, .hs-heater-results-table td:first-child { width: auto; white-space: nowrap; }
            .hs-heater-results-table th:last-child, .hs-heater-results-table td:last-child { width: auto; }
            .hs-heater-input-table input { width: 100%; min-width: 155px; box-sizing: border-box; }
            .hs-heater-results-table th, .hs-heater-subtable th { text-align: left; }
            .hs-heater-active-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
            .hs-heater-active-label { display: flex; align-items: center; gap: 6px; }
            .hs-heater-section-title { margin: 0 0 6px 0; font-weight: bold; }
            .hs-heater-result-cell { white-space: normal; word-break: break-word; }
            .hs-heater-results-wrapper { overflow-x: auto; }
            .hs-heater-loadout-cell { display: flex; align-items: center; gap: 8px; }
            .hs-heater-loadout-buttons { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; }
            .hs-heater-loadout-preview { display: inline-block; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .hs-heater-copy-loadout-btn, .hs-heater-import-loadout-btn { cursor: pointer; padding: 4px 8px; font-size: 0.85em; }
        `);

        const content = `
            <div class="hs-heater-modal-block">
                <div class="hs-heater-modal-left">
                    ${this.buildInputTable(initialInput)}
                </div>
                <div class="hs-heater-modal-right">
                    <div>${HSUIC.Button({ id: 'hs-heater-update-inputs-btn', text: 'Update Inputs' })}</div>
                    <div>${this.buildActiveToggleGrid(initialInput.active)}</div>
                    <div>${HSUIC.Button({ id: 'hs-heater-recalculate-btn', text: '(Re)Compute' })}</div>
                </div>
            </div>
        `;

        const modalId = await hsui.Modal({
            title: 'Ambrosia Heater Inputs',
            htmlContent: content,
            styles: {
                width: '860px',
                minHeight: '520px',
                maxHeight: 'calc(100vh - 80px)',
                overflow: 'auto'
            }
        });

        this.attachModalHandlers(modalId);
    }

    private static async openHeaterResultModal(result: HeaterOptimizationResult, parentModalId?: string): Promise<void> {
        const hsui = HSModuleManager.getModule<HSUI>('HSUI');
        if (!hsui) { HSUI.Notify('Failed to open heater result modal because UI was unavailable.', { position: 'top', notificationType: 'error' }); return; }

        if (this.currentResultModalId) {
            const updated = this.updateResultModalContent(result);
            if (updated) {
                return;
            }
            this.currentResultModalId = null;
        }

        const content = `
            <div class="hs-heater-results-modal-block">
                <div>
                    <div class="hs-heater-results-wrapper">${this.buildResultTable(result)}</div>
                </div>
            </div>
        `;

        this.currentResultModalId = await hsui.Modal({
            title: 'Ambrosia Heater Results',
            htmlContent: content,
            parentModalId,
            styles: {
                width: 'auto',
                minHeight: '520px',
                maxHeight: 'calc(100vh - 80px)',
                overflow: 'auto'
            }
        });
    }

    private static updateResultModalContent(result: HeaterOptimizationResult): boolean {
        if (!this.currentResultModalId) return false;
        const modal = document.getElementById(this.currentResultModalId);
        if (!modal)return false;
        const body = modal.querySelector('.hs-modal-body');
        if (!body) return false;

        body.innerHTML = `
            <div class="hs-heater-results-modal-block">
                <div>
                    <div class="hs-heater-results-wrapper">${this.buildResultTable(result)}</div>
                </div>
            </div>
        `;

        modal.style.width = 'auto';
        modal.style.minWidth = '0';
        modal.style.maxWidth = 'none';
        return true;
    }

    private static buildOptimizerInput(heaterData: HeaterExportData): HeaterOptimizerInput {
        return {
            amb: heaterData.hs_data.lifeTimeAmbrosia,
            quark: heaterData.hs_data.quarks,
            plat4x4: heaterData.hs_data.platonic4x4,
            baseluck: heaterData.hs_data.trueBaseLuck,
            multluck: heaterData.hs_data.luckMult,
            cube: heaterData.hs_data.totalCubes,
            singularity: heaterData.hs_data.effectiveSingularity,
            postaoag: heaterData.hs_data.postaoag ? 1 : 0,
            transcription: heaterData.hs_data.transcription,
            ascspeed1: heaterData.hs_data.ascSpeed,
            ascspeed2: heaterData.hs_data.ascSpeed2,
            spread: heaterData.hs_data.spread,
            voucher: heaterData.hs_data.totalInfinityVouchers,
            baseobt: heaterData.hs_data.baseObt,
            baseoff: heaterData.hs_data.baseOff,
            bb: heaterData.hs_data.bb,
            bonusRow2: heaterData.hs_data.bonusRow2,
            bonusRow3: heaterData.hs_data.bonusRow3,
            bonusRow4: heaterData.hs_data.bonusRow4,
            bonusRow5: heaterData.hs_data.bonusRow5,
            ramb: heaterData.hs_data.lifeTimeRedAmbrosia,
            runeexp: heaterData.hs_data.runeexp,
            sirc: heaterData.hs_data.sirc,
            bonussi: heaterData.hs_data.bonussi,
            totalbonusia: heaterData.hs_data.totalbonusia,
            talismanbonusia: heaterData.hs_data.talismanbonusia,
            btp: heaterData.hs_data.baseTalismanPower,
            isInsideExalt: heaterData.hs_data.isInsideExalt,
            active: Array(this.activeLabels.length).fill(true),
        };
    }

    private static buildInputTable(input: HeaterOptimizerInput): string {
        const rows = this.inputDefinitions.map((field) => {
            const fieldId = `hs-heater-input-${field.key}`;
            const value = input[field.key] as number | boolean;
            const inputHtml = field.type === "boolean"
                ? HSUIC.Input({ id: fieldId, type: HSInputType.CHECK, props: value ? { checked: 'true' } : undefined })
                : HSUIC.Input({ id: fieldId, type: HSInputType.NUMBER, props: { value: String(value as number), step: 'any', min: '0' }, styles: { width: '100%' } });

            return `
                <tr>
                    <td>${field.label}</td>
                    <td>${inputHtml}</td>
                </tr>
            `;
        });

        return `
            <table class="hs-heater-input-table">
                <tbody>${rows.join('')}</tbody>
            </table>
        `;
    }

    private static applyOptimizerInputToFields(modal: HTMLElement, input: HeaterOptimizerInput): void {
        this.inputDefinitions.forEach((field) => {
            const element = modal.querySelector<HTMLInputElement>(`#hs-heater-input-${field.key}`);
            if (!element) return;

            if (field.type === "boolean")
                element.checked = Boolean(input[field.key]);
            else
                element.value = String(input[field.key] ?? 0);
        });
    }

    private static buildActiveToggleGrid(active: boolean[]): string {
        const checkboxRows = this.activeLabels.map((label, index) => {
            const fieldId = `hs-heater-input-active-${index}`;
            const checked = active[index] ? 'checked' : '';
            return `
                <label class="hs-heater-active-label">
                    <input type="checkbox" id="${fieldId}" ${checked} />
                    ${label}
                </label>
            `;
        });

        return `
            <div class="hs-heater-active-grid">${checkboxRows.join('')}</div>
        `;
    }

    private static buildResultTable(result: HeaterOptimizationResult): string {
        const scalarRows: string[] = [];
        const arrayRows: Array<{ key: string; rows: any[][] }> = [];

        Object.entries(result)
            .filter(([key]) => key !== 'input')
            .forEach(([key, value]) => {
                if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
                    arrayRows.push({ key, rows: value as any[][] });
                } else {
                    const cellHtml = this.formatResultCell(value, key);
                    scalarRows.push(`
                        <tr>
                            <td>${this.escapeHtml(this.translateResultKey(key))}</td>
                            <td class="hs-heater-result-cell">${cellHtml}</td>
                        </tr>
                    `);
                }
            });

        let html = '';
        if (scalarRows.length > 0) {
            html += `
                <table class="hs-heater-results-table">
                    <thead>
                        <tr><th>Result</th><th>Value</th></tr>
                    </thead>
                    <tbody>${scalarRows.join('')}</tbody>
                </table>
            `;
        }

        if (arrayRows.length > 0) {
            html += this.buildArrayResultSection(arrayRows);
        }

        return html;
    }

    private static formatResultCell(value: unknown, key: string): string {
        if (Array.isArray(value)) {
            return `<pre style="margin:0;">${this.escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
        }

        if (typeof value === 'object' && value !== null) {
            return `<pre style="margin:0;">${this.escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
        }

        return this.escapeHtml(String(value));
    }

    private static buildArrayResultSection(arrayRows: Array<{ key: string; rows: any[][] }>): string {
        const headers = ['Result', 'Loadout', 'Cost', 'Effect 1', 'Effect 2', 'Effect 3', 'Effect 4', 'Max'];
        const headerHtml = headers.map((header) => `<th>${this.escapeHtml(header)}</th>`).join('');

        const bodyHtml = arrayRows.map(({ key, rows }) => {
            return rows.map((row, rowIndex) => {
                const loadoutValue = row[0];
                const fullLoadout = typeof loadoutValue === 'string' ? loadoutValue : JSON.stringify(loadoutValue);
                const escapedFullLoadout = this.escapeHtml(fullLoadout);
                const isValidJsonLoadout = typeof fullLoadout === 'string' && fullLoadout.trim().startsWith('{') && fullLoadout.trim().endsWith('}');
                const copyButton = isValidJsonLoadout ? `<button class="hs-heater-copy-loadout-btn" type="button" data-loadout="${escapedFullLoadout}">Copy</button>` : '';
                const importButton = isValidJsonLoadout ? `<button class="hs-heater-import-loadout-btn" type="button" data-loadout="${escapedFullLoadout}">Import</button>` : '';
                const loadoutContent = isValidJsonLoadout
                    ? `<div class="hs-heater-loadout-buttons">${copyButton}${importButton}</div>`
                    : `<div class="hs-heater-loadout-cell"><span class="hs-heater-loadout-preview">${this.escapeHtml(fullLoadout.length > 30 ? `${fullLoadout.slice(0, 30)}…` : fullLoadout)}</span></div>`;
                const resultCell = rowIndex === 0 ? `<td rowspan="${rows.length}">${this.escapeHtml(this.translateResultKey(key))}</td>` : '';
                const cells = [resultCell, `<td>${loadoutContent}</td>`, ...row.slice(1).map((value) => `<td>${this.escapeHtml(String(value))}</td>` )];
                return `<tr>${cells.join('')}</tr>`;
            }).join('');
        }).join('');

        return `
            <div class="hs-heater-results-wrapper">
                <table class="hs-heater-subtable hs-heater-results-table">
                    <thead><tr>${headerHtml}</tr></thead>
                    <tbody>${bodyHtml}</tbody>
                </table>
            </div>
        `;
    }

    private static escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private static async copyLoadoutToClipboard(loadout: string): Promise<void> {
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(loadout);
                HSUI.Notify('Loadout copied to clipboard.', { position: 'top', notificationType: 'success' });
                return;
            } catch {
                HSUI.Notify('Failed to copy loadout to clipboard.', { position: 'top', notificationType: 'error' });
                return;
            }
        }

        const textarea = document.createElement('textarea');
        textarea.value = loadout;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        HSUI.Notify('Loadout copied to clipboard.', { position: 'top', notificationType: 'success' });
    }

    private static async importLoadoutToGame(loadout: string): Promise<void> {
        const fileInput = document.getElementById('importBlueberries') as HTMLInputElement | null;
        if (!fileInput) {
            HSUI.Notify('Failed to import loadout: game import file input was not found.', { position: 'top', notificationType: 'error' });
            return;
        }

        if (typeof DataTransfer === 'undefined' || typeof File === 'undefined' || typeof Blob === 'undefined') {
            HSUI.Notify('Loadout import is not supported by this browser.', { position: 'top', notificationType: 'error' });
            return;
        }

        try {
            const blob = new Blob([loadout], { type: 'application/json' });
            const file = new File([blob], 'heater-import.json', { type: 'application/json' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            HSUI.Notify('Loadout import sent to game.', { position: 'top', notificationType: 'success' });
        } catch (err) {
            HSUI.Notify('Failed to import loadout to game.', { position: 'top', notificationType: 'error' });
        }
    }

    private static attachModalHandlers(modalId: string): void {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const updateInputsButton = modal.querySelector('#hs-heater-update-inputs-btn') as HTMLElement | null;
        updateInputsButton?.addEventListener('click', async () => {
            const originalText = updateInputsButton.textContent;
            if (originalText !== null) {
                updateInputsButton.textContent = `${originalText} ⏳`;
            }
            updateInputsButton.style.pointerEvents = 'none';
            await HSUtils.waitForNextTack();

            try {
                const dataModule = HSModuleManager.getModule<HSGameDataAPI>("HSGameDataAPI");
                if (!dataModule) { HSUI.Notify('Failed to update inputs because data module was unavailable.', { position: 'top', notificationType: 'error' }); return; }
                const heaterData = await dataModule.dumpDataForHeater();
                if (!heaterData) { HSUI.Notify('Failed to update inputs because heater data could not be loaded.', { position: 'top', notificationType: 'error' }); return; }

                const updatedInput = this.buildOptimizerInput(heaterData);
                this.applyOptimizerInputToFields(modal, updatedInput);
                HSUI.Notify('Inputs updated from current heater data.', { position: 'top', notificationType: 'success' });
            } finally {
                updateInputsButton.style.pointerEvents = '';
                if (originalText !== null) {
                    updateInputsButton.textContent = originalText;
                }
            }
        });

        const recalcButton = modal.querySelector('#hs-heater-recalculate-btn') as HTMLElement | null;
        recalcButton?.addEventListener('click', async () => {
            const originalText = recalcButton.textContent;
            recalcButton.textContent = `${originalText} ⏳`;
            recalcButton.style.pointerEvents = 'none';
            await HSUtils.waitForNextTack();

            try {
                const updatedInput = this.readInputValues(modal);
                const updatedResult = HSHeaterAPI.createHeaterOptimizerResultFromInput(updatedInput);
                await this.openHeaterResultModal(updatedResult, modalId);
            } finally {
                recalcButton.style.pointerEvents = '';
                if (originalText !== null) {
                    recalcButton.textContent = originalText;
                }
            }
        });

        modal.addEventListener('click', (event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            const loadout = target.getAttribute('data-loadout');
            if (!loadout) return;
            if (target.classList.contains('hs-heater-copy-loadout-btn')) {
                void this.copyLoadoutToClipboard(loadout);
                return;
            }
            if (target.classList.contains('hs-heater-import-loadout-btn')) {
                void this.importLoadoutToGame(loadout);
            }
        });
    }

    private static readInputValues(modal: HTMLElement): HeaterOptimizerInput {
        const readNumber = (id: string, fallback = 0): number => {
            const element = modal.querySelector<HTMLInputElement>(`#${id}`);
            if (!element) return fallback;
            const value = Number(element.value);
            return Number.isFinite(value) ? value : fallback;
        };

        const readBoolean = (id: string): boolean => {
            const element = modal.querySelector<HTMLInputElement>(`#${id}`);
            return element?.checked ?? false;
        };

        const active = this.activeLabels.map((_, index) => {
            return readBoolean(`hs-heater-input-active-${index}`);
        });

        return {
            amb: readNumber('hs-heater-input-amb'),
            quark: readNumber('hs-heater-input-quark'),
            plat4x4: readNumber('hs-heater-input-plat4x4'),
            baseluck: readNumber('hs-heater-input-baseluck'),
            multluck: readNumber('hs-heater-input-multluck'),
            cube: readNumber('hs-heater-input-cube'),
            singularity: readNumber('hs-heater-input-singularity'),
            postaoag: readBoolean('hs-heater-input-postaoag') ? 1 : 0,
            transcription: readNumber('hs-heater-input-transcription'),
            ascspeed1: readNumber('hs-heater-input-ascspeed1'),
            ascspeed2: readNumber('hs-heater-input-ascspeed2'),
            spread: readNumber('hs-heater-input-spread'),
            voucher: readNumber('hs-heater-input-voucher'),
            baseobt: readNumber('hs-heater-input-baseobt'),
            baseoff: readNumber('hs-heater-input-baseoff'),
            bb: readNumber('hs-heater-input-bb'),
            bonusRow2: readNumber('hs-heater-input-bonusRow2'),
            bonusRow3: readNumber('hs-heater-input-bonusRow3'),
            bonusRow4: readNumber('hs-heater-input-bonusRow4'),
            bonusRow5: readNumber('hs-heater-input-bonusRow5'),
            ramb: readNumber('hs-heater-input-ramb'),
            runeexp: readNumber('hs-heater-input-runeexp'),
            sirc: readNumber('hs-heater-input-sirc'),
            bonussi: readNumber('hs-heater-input-bonussi'),
            totalbonusia: readNumber('hs-heater-input-totalbonusia'),
            talismanbonusia: readNumber('hs-heater-input-talismanbonusia'),
            btp: readNumber('hs-heater-input-btp'),
            isInsideExalt: readBoolean('hs-heater-input-isInsideExalt'),
            active,
        };
    }
}
