import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSUI } from "../../hs-core/hs-ui";
import { HSUIC } from "../../hs-core/hs-ui-components";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { HSQuickbarManager } from "../hs-qolQuickbarManager";
import { HSHeaterOptimizer } from "./hs-heater-optimizer";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSHeaterStyles } from "./hs-heater-ui-styles";
import { HSHeaterInputUI } from "./hs-heater-ui-input";
import { HSHeaterResultUI } from "./hs-heater-ui-result";
import { getHeaterTypeDropdownOptionsWithIcons, normalizeHeaterOptimizationResult } from "./hs-heater-ui-result-renderer";
import { HSSettings } from "../../hs-core/settings/hs-settings";
import type { HeaterOptimizationResult } from "../../../types/data-types/hs-heater-types";
import type { HeaterSlotIconApplyResult } from "../hs-ambrosiaQuickbar";

export class HSHeaterModalManager {
    
    static async openHeaterComputationModal(): Promise<void> {
        const hsui = HSModuleManager.getModule<HSUI>('HSUI');
        if (!hsui) return;
        const dataModule = HSModuleManager.getModule<HSGameDataAPI>("HSGameDataAPI");
        if (!dataModule) return;
        const heaterData = await dataModule.dumpDataForHeater();
        if (!heaterData) return;

        const initialInput = HSHeaterInputUI.buildOptimizerInput(heaterData);
        HSHeaterStyles.ensureHeaterStylesInjected();
        const ambrosiaModule = HSModuleManager.getModule<any>('HSAmbrosia') as { getAmbrosiaLoadoutsAmount?: () => number } | undefined;
        const loadoutsAmountRaw = ambrosiaModule?.getAmbrosiaLoadoutsAmount?.();
        const loadoutsAmount = Number.isInteger(loadoutsAmountRaw) && (loadoutsAmountRaw as number) > 0
            ? (loadoutsAmountRaw as number)
            : 8;
        const heaterTypeOptionsWithIcons = getHeaterTypeDropdownOptionsWithIcons();
        const heaterTypeOptions = heaterTypeOptionsWithIcons
            .map(({ semanticId, label, iconSrc }, index) => `<option value="${semanticId}" data-icon-src="${iconSrc ?? ""}"${index === 0 ? " selected" : ""}>${label}</option>`)
            .join('');
        const defaultTypeIconSrc = heaterTypeOptionsWithIcons[0]?.iconSrc ?? "";
        const heaterTypeDropdownRows = Array.from({ length: loadoutsAmount }, (_, i) => {
            return `
                <div class="hs-heater-type-select-row">
                    <span class="hs-heater-type-select-loadout-label">L${i + 1}</span>
                    <button type="button" tabindex="-1" class="hs-heater-type-select-icon" style="background-image:url('${defaultTypeIconSrc}');" aria-hidden="true"></button>
                    <select id="hs-heater-type-select-${i + 1}" class="hs-heater-type-select">${heaterTypeOptions}</select>
                    <input type="checkbox" class="hs-heater-type-select-checkbox" checked aria-label="Enable loadout ${i + 1}" />
                </div>
            `;
        }).join('');
        const heaterTypeDropdowns = `<div class="hs-heater-inputs-title">Your Loadout Order:</div>${heaterTypeDropdownRows}`;

        const content = `
            <div id="hs-heater-inputs-body-left" class="hs-scrollbar-themed">
                ${HSHeaterInputUI.buildInputTable(initialInput)}
            </div>
            <div id="hs-heater-inputs-body-right" class="hs-scrollbar-themed">
                <div>${HSUIC.Button({ id: 'hs-heater-update-inputs-btn', class: 'redButton',  text: 'Update 🔓 Inputs' })}</div>
                <div>${HSHeaterInputUI.buildHeaterOptionToggleGrid(initialInput.heaterOptions)}</div>
                <div>${HSUIC.Button({ id: 'hs-heater-recalculate-btn',   class: 'redButton',  text: '🔥 Start Heater',       styles: { cursor: 'help' }, props: { title: '⚠️ This can take a few seconds...' } })}</div>
                <div id="hs-heater-type-selects" class="hs-heater-type-selects-grid">${heaterTypeDropdowns}</div>
                <div>${HSUIC.Button({ id: 'hs-heater-import-all-btn',    class: 'blueButton', text: 'Import All <span style="color: #338eef;">☑</span> Loadouts' })}</div>
                <div>${HSUIC.Button({ id: 'hs-heater-sync-icons-btn',    class: 'blueButton', text:   'Sync All <span style="color: #338eef;">☑</span> Icons' })}</div>
                <div>${HSUIC.Button({ id: 'hs-heater-sync-settings-btn', class: 'blueButton', text: '(no-op) Sync All Settings' })}</div>
            </div>
        `;

        const modalId = await hsui.Modal({
            title: 'Ambrosia Heater Inputs',
            htmlContent: content,
            bodyClass: 'hs-heater-inputs-body',
            styles: {
                width: 'auto',
                height: 'calc(100vh - 50px)',
            }
        });

        this.attachModalHandlers(modalId);
    }

    private static async openHeaterResultModal(result: HeaterOptimizationResult, parentModalId?: string): Promise<void> {
        const hsui = HSModuleManager.getModule<HSUI>('HSUI');
        if (!hsui) { HSUI.Notify('Failed to open heater result modal because UI was unavailable.', { position: 'top', notificationType: 'error' }); return; }
        HSHeaterStyles.ensureHeaterStylesInjected();

        const resultPosition = (() => {
            if (!parentModalId) { return undefined; }
            const parentModal = document.getElementById(parentModalId);
            if (!parentModal) { return undefined; }
            return {
                x: parentModal.offsetLeft + parentModal.offsetWidth + 2,
                y: parentModal.offsetTop,
            };
        })();

        if (HSHeaterResultUI.currentResultModalId) {
            const updated = HSHeaterResultUI.updateResultModalContent(result);
            if (updated) {
                HSHeaterResultUI.setCurrentResultData(result);
                return;
            }
            HSHeaterResultUI.currentResultModalId = null;
        }

        const content = HSHeaterResultUI.buildResultTable(result);

        HSHeaterResultUI.currentResultModalId = await hsui.Modal({
            title: 'Ambrosia Heater Results',
            htmlContent: content,
            position: resultPosition,
            parentModalId,
            bodyClass: 'hs-heater-results-body',
            styles: {
                width: 'auto',
                height: 'auto',
            }
        });

        HSHeaterResultUI.setCurrentResultData(result);

        HSHeaterResultUI.attachResultModalHandlers(HSHeaterResultUI.currentResultModalId);
    }

    private static attachModalHandlers(modalId: string): void {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        this.attachHeaterTypeSelectHandlers(modal);

        // Load and restore saved dropdown selections
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

                const updatedInput = HSHeaterInputUI.buildOptimizerInput(heaterData);
                HSHeaterInputUI.applyOptimizerInputToFields(modal, updatedInput, false);
                HSUI.Notify('Heater inputs updated.', { position: 'top', notificationType: 'success' });
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
            recalcButton.textContent = `🔥 Heating... ⏳`;
            recalcButton.style.pointerEvents = 'none';
            document.body.style.cursor = 'wait';
            await HSUtils.waitForNextTack();

            try {
                const ambrosiaModule = HSModuleManager.getModule<any>('HSAmbrosia') as { showQuickBar?: () => Promise<void> } | undefined;
                if (!ambrosiaModule?.showQuickBar) { HSUI.Notify('Failed to start heater because Ambrosia quickbar is unavailable.', { position: 'top', notificationType: 'error' }); return; }
                await ambrosiaModule.showQuickBar();
                await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');

                const updatedInput = HSHeaterInputUI.readInputValues(modal);
                const updatedResult = HSHeaterOptimizer.createHeaterOptimizerResultFromInput(updatedInput);
                await this.openHeaterResultModal(updatedResult, modalId);
            } finally {
                recalcButton.style.pointerEvents = '';
                document.body.style.cursor = '';
                if (originalText !== null) {
                    recalcButton.textContent = originalText;
                }
            }
        });

        const importAllButton = modal.querySelector('#hs-heater-import-all-btn') as HTMLElement | null;
        importAllButton?.addEventListener('click', async () => {
            importAllButton.style.pointerEvents = 'none';
            await HSUtils.waitForNextTack();

            try {
                const heaterResult = HSHeaterResultUI.getCurrentResultDataIfModalOpen();
                if (!heaterResult) { HSUI.Notify('No heater results are currently open.\nStart Heating first...', { position: 'top', notificationType: 'warning' }); return; }

                const normalizedEntries = normalizeHeaterOptimizationResult(heaterResult);
                const loadoutBySemanticId = new Map<string, string>();
                for (const entry of normalizedEntries) {
                    const loadoutJson = entry.rowData[0];
                    if (typeof loadoutJson === 'string') {
                        loadoutBySemanticId.set(entry.semanticId, loadoutJson);
                    }
                }

                // Get all dropdown selections and per-row enabled states
                const typeSelects = Array.from(modal.querySelectorAll('.hs-heater-type-select')) as HTMLSelectElement[];
                const typeCheckboxes = Array.from(modal.querySelectorAll('.hs-heater-type-select-checkbox')) as HTMLInputElement[];
                const selectedSemanticIds = typeSelects.map(select => select.value ?? 'none');

                // Extract loadout JSONs for each selected heater type by semanticId
                const loadoutJsons: string[] = [];
                for (let index = 0; index < selectedSemanticIds.length; index++) {
                    const semanticId = selectedSemanticIds[index];
                    const isEnabled = typeCheckboxes[index]?.checked ?? true;

                    if (!isEnabled || semanticId === 'none') {
                        loadoutJsons.push(''); // Empty line for missing selections
                        continue;
                    }

                    const loadout = loadoutBySemanticId.get(semanticId) ?? null;
                    if (loadout) {
                        loadoutJsons.push(loadout);
                    } else {
                        HSUI.Notify(`Failed to find loadout for "${semanticId}"`, { position: 'top', notificationType: 'warning' });
                        loadoutJsons.push(''); // Preserve line-to-slot alignment even when lookup fails
                    }
                }

                // Copy to clipboard
                const clipboardText = loadoutJsons.join('\n');
                await navigator.clipboard.writeText(clipboardText);
                HSUI.Notify('Loadouts copied to clipboard.', { position: 'top', notificationType: 'success' });

                // Click the ambrosia extra button
                const quickImportBtn = document.getElementById('hs-ambrosia-extra-btn') as HTMLElement | null;
                if (quickImportBtn) {
                    quickImportBtn.click();
                    HSUI.Notify('Quick Import triggered. Check ambrosia for import progress.', { position: 'top', notificationType: 'success' });
                } else {
                    HSUI.Notify('Loadouts copied to clipboard, but ambrosia quick import button not found.', { position: 'top', notificationType: 'warning' });
                }
            } catch (error) {
                HSUI.Notify('Failed to import loadouts.', { position: 'top', notificationType: 'error' });
                console.error('Import all error:', error);
            } finally {
                importAllButton.style.pointerEvents = '';
            }
        });

        const syncIconsButton = modal.querySelector('#hs-heater-sync-icons-btn') as HTMLElement | null;
        syncIconsButton?.addEventListener('click', async () => {
            const ambrosiaModule = HSModuleManager.getModule<any>('HSAmbrosia') as {
                getAmbrosiaLoadoutsAmount?: () => number;
                quickbar?: {
                    applyHeaterSlotIconSemanticsBulk?: (iconSemanticBySlotId: Record<string, string | null>) => Promise<HeaterSlotIconApplyResult>;
                };
            } | undefined;
            if (!ambrosiaModule?.quickbar?.applyHeaterSlotIconSemanticsBulk) { HSUI.Notify('Failed to sync icons because Ambrosia quickbar was unavailable.', { position: 'top', notificationType: 'error' }); return; }

            const typeSelects = Array.from(modal.querySelectorAll('.hs-heater-type-select')) as HTMLSelectElement[];
            const typeIcons = Array.from(modal.querySelectorAll('.hs-heater-type-select-icon')) as HTMLButtonElement[];
            const typeCheckboxes = Array.from(modal.querySelectorAll('.hs-heater-type-select-checkbox')) as HTMLInputElement[];
            const loadoutsAmountRaw = ambrosiaModule.getAmbrosiaLoadoutsAmount?.();
            const maxAmbrosiaSlots = Number.isInteger(loadoutsAmountRaw) && (loadoutsAmountRaw as number) > 0
                ? (loadoutsAmountRaw as number)
                : Math.min(typeSelects.length, typeIcons.length);
            const syncCount = Math.min(typeSelects.length, typeIcons.length, maxAmbrosiaSlots);

            const iconSemanticBySlotId: Record<string, string | null> = {};

            for (let i = 0; i < syncCount; i++) {
                const slotId = `blueberryLoadout${i + 1}`;
                const select = typeSelects[i];
                const isEnabled = typeCheckboxes[i]?.checked ?? true;

                if (!select || !isEnabled)
                    continue;

                const semanticId = (select.value || '').trim();
                iconSemanticBySlotId[slotId] = semanticId && semanticId !== 'none' ? semanticId : null;
            }

            const attemptedSlotCount = Object.keys(iconSemanticBySlotId).length;

            const result = await ambrosiaModule.quickbar.applyHeaterSlotIconSemanticsBulk(iconSemanticBySlotId);

            if (result.missingCount > 0) {
                HSUI.Notify(`Synced ${attemptedSlotCount} slot icons (${result.setCount} set, ${result.clearedCount} cleared). ${result.missingCount} icon(s) were missing.`, { position: 'top', notificationType: 'warning' });
                return;
            }

            HSUI.Notify(`Synced ${attemptedSlotCount} slot icons (${result.setCount} set, ${result.clearedCount} cleared).`, { position: 'top', notificationType: 'success' });
        });

        const syncSettingsButton = modal.querySelector('#hs-heater-sync-settings-btn') as HTMLElement | null;
        syncSettingsButton?.addEventListener('click', () => {
            // No-op for now.
        });

        HSHeaterInputUI.attachInputLockHandlers(modal);

        modal.addEventListener('click', (event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            if (target.classList.contains('hs-heater-lock-button')) {
                const fieldKey = target.dataset.fieldKey;
                if (fieldKey) {
                    HSHeaterInputUI.toggleFieldLock(modal, fieldKey);
                }
            }
        });
    }

    private static attachHeaterTypeSelectHandlers(modal: HTMLElement): void {
        const typeSelects = Array.from(modal.querySelectorAll('.hs-heater-type-select')) as HTMLSelectElement[];
        
        // Helper to sync icon based on dropdown's current selection
        const syncIcon = (select: HTMLSelectElement) => {
            const selectedOption = select.selectedOptions[0];
            const icon = select.parentElement?.querySelector('.hs-heater-type-select-icon') as HTMLButtonElement | null;
            if (!icon) return;

            const iconSrc = selectedOption?.getAttribute('data-icon-src') ?? '';
            if (iconSrc) {
                icon.style.backgroundImage = `url('${iconSrc}')`;
                icon.style.visibility = 'visible';
            } else {
                icon.style.backgroundImage = '';
                icon.style.visibility = 'hidden';
            }
        };

        // Load saved selections from setting
        const savedSelections = HSSettings.getSetting('heaterTypeLoadoutSelections').getValue() as string[] | null;
        const selectionsArray = Array.isArray(savedSelections) ? savedSelections : [];

        // Apply saved selections and sync icons
        typeSelects.forEach((select, index) => {
            if (index < selectionsArray.length && selectionsArray[index]) {
                const savedValue = selectionsArray[index];
                // Check if this value exists in the select options
                const optionExists = Array.from(select.options).some(opt => opt.value === savedValue);
                if (optionExists) {
                    select.value = savedValue;
                }
            }
            // Sync icon for this dropdown (loaded value or default)
            syncIcon(select);
        });

        // Attach change handlers to save selections and sync icons
        typeSelects.forEach((select) => {
            select.addEventListener('change', () => {
                syncIcon(select);  // Sync icon when value changes
                const updatedSelections = typeSelects.map(s => s.value);
                HSSettings.getSetting('heaterTypeLoadoutSelections').setValue(updatedSelections);
                HSSettings.saveSettingsToStorage();
            });
        });
    }
}
