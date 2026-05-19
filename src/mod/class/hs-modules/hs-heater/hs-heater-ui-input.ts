import Decimal from "break_infinity.js";
import { HSUIC } from "../../hs-core/hs-ui-components";
import { escapeHtml } from "./hs-heater-utils";
import type { HeaterOptimizerInput } from "../../../types/data-types/hs-heater-types";
import { HSInputType } from "../../../types/module-types/hs-ui-types";
import {
    exportFieldExtractors,
    heaterOptionLabels,
    inputDefinitions,
    type HeaterInputBase,
    type HeaterInputField,
    type HeaterInputKey,
} from "./hs-heater-input-config";

type HeaterInputValue = HeaterInputBase[HeaterInputKey];

export class HSHeaterInputUI {

    // ================================================================
    // Static Configuration / Constants
    // ================================================================

    static readonly inputDefinitions = inputDefinitions;
    static readonly exportFieldExtractors = exportFieldExtractors;
    static readonly heaterOptionLabels = heaterOptionLabels;
    static #lockHandlersAttachedModals = new WeakSet<HTMLElement>();

    static buildOptimizerInput(exportData: any): HeaterOptimizerInput {
        return {
            ...this.buildInputBaseFromHeaterData(exportData),
            heaterOptions: Array(this.heaterOptionLabels.length).fill(true),
        };
    }

    static buildInputBaseFromHeaterData(exportData: any): HeaterInputBase {
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
                <label class="hs-heater-active-branch">
                    <input type="checkbox" id="${fieldId}" class="hs-heater-active-checkbox" ${checked} />
                    ${label}
                </label>
            `;
        });

        return `
           <span class="hs-heater-inputs-title">Active Branches:</span>
           <div class="hs-heater-active-grid">
                ${checkboxRows.join('')}
            </div>
        `;
    }

    
    // ================================================================
    // Input UI / Lock Handler Methods
    // ================================================================

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
        if (this.#lockHandlersAttachedModals.has(modal)) return;

        this.inputDefinitions.forEach((field) => {
            const element = this.getFieldElement(modal, field);
            if (!element) return;

            element.addEventListener('change', () => {
                this.setFieldLockState(modal, field.key, true);
            });
        });
        this.#lockHandlersAttachedModals.add(modal);
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
