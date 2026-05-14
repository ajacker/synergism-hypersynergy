import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSUI } from "../../hs-core/hs-ui";
import { HSUIC } from "../../hs-core/hs-ui-components";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { HSHeaterOptimizer } from "./hs-heater-optimizer";
import type { HeaterOptimizationResult } from "../../../types/data-types/hs-heater-types";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSHeaterStyles } from "./hs-heater-ui-styles";
import { HSHeaterInputUI } from "./hs-heater-ui-input";
import { HSHeaterResultUI } from "./hs-heater-ui-result";

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

        const content = `
            <div id="hs-heater-modal-left" class="hs-heater-scrollable">
                ${HSHeaterInputUI.buildInputTable(initialInput)}
            </div>
            <div id="hs-heater-modal-right">
                <div>${HSUIC.Button({ id: 'hs-heater-update-inputs-btn', text: 'Update 🔓 Inputs', styles: { width: 'auto' } })}</div>
                <div>${HSHeaterInputUI.buildHeaterOptionToggleGrid(initialInput.heaterOptions)}</div>
                <div>${HSUIC.Button({ id: 'hs-heater-recalculate-btn', text: '🔥 Start Heater', styles: { width: 'auto' } })}</div>
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

        if (HSHeaterResultUI.currentResultModalId) {
            const updated = HSHeaterResultUI.updateResultModalContent(result);
            if (updated) {
                return;
            }
            HSHeaterResultUI.currentResultModalId = null;
        }

        const content = `
            <div class="hs-heater-results-modal-block">
                <div>
                    <div class="hs-heater-results-wrapper">${HSHeaterResultUI.buildResultTable(result)}</div>
                </div>
            </div>
        `;

        HSHeaterResultUI.currentResultModalId = await hsui.Modal({
            title: 'Ambrosia Heater Results',
            htmlContent: content,
            parentModalId,
            bodyClass: 'hs-heater-scrollable',
            styles: {
                width: 'auto',
                height: 'auto',
            }
        });

        HSHeaterResultUI.attachResultModalHandlers(HSHeaterResultUI.currentResultModalId);
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
            await HSUtils.waitForNextTack();

            try {
                const updatedInput = HSHeaterInputUI.readInputValues(modal);
                const updatedResult = HSHeaterOptimizer.createHeaterOptimizerResultFromInput(updatedInput);
                await this.openHeaterResultModal(updatedResult, modalId);
            } finally {
                recalcButton.style.pointerEvents = '';
                if (originalText !== null) {
                    recalcButton.textContent = originalText;
                }
            }
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
}
