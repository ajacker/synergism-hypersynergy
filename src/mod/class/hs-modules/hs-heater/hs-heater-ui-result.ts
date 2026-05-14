import { HSUI } from "../../hs-core/hs-ui";
import type { HeaterOptimizationResult } from "../../../types/data-types/hs-heater-types";
import { escapeHtml } from "./hs-heater-ui-input";
import { buildResultTableHtml } from "./hs-heater-ui-result-renderer";

// === Loadout Preview Metadata Type and Map ===
type LoadoutPreviewMeta = { iconFile: string; family: 'blue' | 'red' };

const LOADOUT_UPGRADE_META_MAP = {
    ambrosiaTutorial:              { iconFile: 'BlueberryTutorial.png',                 family: 'blue' },
    ambrosiaPatreon:               { iconFile: 'BlueberryPatreon.png',                  family: 'blue' },
    ambrosiaObtainium1:            { iconFile: 'BlueberryObtainium.png',                family: 'blue' },
    ambrosiaOffering1:             { iconFile: 'BlueberryOffering.png',                 family: 'blue' },
    ambrosiaHyperflux:             { iconFile: 'BlueberryHyperflux.png',                family: 'blue' },
    ambrosiaBrickOfLead:           { iconFile: 'BlueberryBrickOfLead.png',              family: 'blue' },
    ambrosiaFreeLuckUpgrades:      { iconFile: 'BlueberryFreeLuckUpgrades.png',         family: 'blue' },
    ambrosiaQuarks1:               { iconFile: 'BlueberryQuarks.png',                   family: 'blue' },
    ambrosiaCubes1:                { iconFile: 'BlueberryCubes.png',                    family: 'blue' },
    ambrosiaLuck1:                 { iconFile: 'BlueberryLuck.png',                     family: 'blue' },
    ambrosiaBaseObtainium1:        { iconFile: 'BlueberryBaseObtainium1.png',           family: 'blue' },
    ambrosiaBaseOffering1:         { iconFile: 'BlueberryBaseOffering1.png',            family: 'blue' },
    ambrosiaSingReduction1:        { iconFile: 'BlueberrySingReduction.png',            family: 'blue' },
    ambrosiaTalismanBonusRuneLevel:{ iconFile: 'BlueberryTalismanBonusRuneLevel.png',   family: 'blue' },
    ambrosiaFreeGenerationUpgrades:{ iconFile: 'BlueberryFreeGenerationLevels.png',     family: 'blue' },
    ambrosiaCubeQuark1:            { iconFile: 'BlueberryCubeQuark.png',                family: 'blue' },
    ambrosiaLuckQuark1:            { iconFile: 'BlueberryLuckQuark.png',                family: 'blue' },
    ambrosiaLuckCube1:             { iconFile: 'BlueberryLuckCube.png',                 family: 'blue' },
    ambrosiaQuarkCube1:            { iconFile: 'BlueberryQuarkCube.png',                family: 'blue' },
    ambrosiaCubeLuck1:             { iconFile: 'BlueberryCubeLuck.png',                 family: 'blue' },
    ambrosiaQuarkLuck1:            { iconFile: 'BlueberryQuarkLuck.png',                family: 'blue' },
    ambrosiaFreeRedLuckUpgrades:   { iconFile: 'BlueberryFreeRedLuckUpgrades.png',      family: 'blue' },
    ambrosiaQuarks2:               { iconFile: 'BlueberryQuarks2.png',                  family: 'blue' },
    ambrosiaCubes2:                { iconFile: 'BlueberryCubes2.png',                   family: 'blue' },
    ambrosiaLuck2:                 { iconFile: 'BlueberryLuck2.png',                    family: 'blue' },
    ambrosiaBaseObtainium2:        { iconFile: 'BlueberryBaseObtainium2.png',           family: 'blue' },
    ambrosiaBaseOffering2:         { iconFile: 'BlueberryBaseOffering2.png',            family: 'blue' },
    ambrosiaInfiniteShopUpgrades1: { iconFile: 'BlueberryInfiniteShopUpgrades.png',     family: 'blue' },
    ambrosiaRuneOOMBonus:          { iconFile: 'BlueberryRuneOOMBonus.png',             family: 'blue' },
    ambrosiaFreeQuarkUpgrades:     { iconFile: 'BlueberryFreeQuarkUpgrades.png',        family: 'blue' },
    ambrosiaQuarks3:               { iconFile: 'BlueberryQuarks3.png',                  family: 'blue' },
    ambrosiaCubes3:                { iconFile: 'BlueberryCubes3.png',                   family: 'blue' },
    ambrosiaLuck3:                 { iconFile: 'BlueberryLuck3.png',                    family: 'blue' },
    ambrosiaSingReduction2:        { iconFile: 'BlueberrySingReduction2.png',           family: 'blue' },
    ambrosiaInfiniteShopUpgrades2: { iconFile: 'BlueberryInfiniteShopUpgrades2.png',    family: 'blue' },
    ambrosiaLuck4:                 { iconFile: 'BlueberryLuck4.png',                    family: 'blue' },

    redAmbrosiaTutorial:                    { iconFile: 'RedAmbrosiaTutorial.png',                  family: 'red' },
    redAmbrosiaFreeTutorialLevels:          { iconFile: 'RedAmbrosiaFreeTutorialLevels.png',        family: 'red' },
    redAmbrosiaConversionImprovement1:      { iconFile: 'RedAmbrosiaConversionImprovement1.png',    family: 'red' },
    redAmbrosiaBlueberryGenerationSpeed:    { iconFile: 'RedAmbrosiaBlueberryGenerationSpeed.png',  family: 'red' },
    redAmbrosiaRegularLuck:                 { iconFile: 'RedAmbrosiaRegularLuck.png',               family: 'red' },
    redAmbrosiaBlueberries:                 { iconFile: 'RedAmbrosiaBlueberries.png',               family: 'red' },
    redAmbrosiaRedAmbrosiaFreeAccumulator:  { iconFile: 'RedAmbrosiaFreeAccumulator.png',           family: 'red' },
    redAmbrosiaFreeLevelsRow2:              { iconFile: 'RedAmbrosiaFreeLevelsRow2.png',            family: 'red' },
    redAmbrosiaRedAmbrosiaCube:             { iconFile: 'RedAmbrosiaRedAmbrosiaCube.png',           family: 'red' },
    redAmbrosiaRedAmbrosiaObtainium:        { iconFile: 'RedAmbrosiaObtainium.png',                 family: 'red' },
    redAmbrosiaRedAmbrosiaOffering:         { iconFile: 'RedAmbrosiaOffering.png',                  family: 'red' },
    redAmbrosiaFreeOfferingUpgrades:        { iconFile: 'RedAmbrosiaFreeOfferingUpgrades.png',      family: 'red' },
    redAmbrosiaFreeLevelsRow3:              { iconFile: 'RedAmbrosiaFreeLevelsRow3.png',            family: 'red' },
    redAmbrosiaConversionImprovement2:      { iconFile: 'RedAmbrosiaConversionImprovement2.png',    family: 'red' },
    redAmbrosiaRedGenerationSpeed:          { iconFile: 'RedAmbrosiaRedGenerationSpeed.png',        family: 'red' },
    redAmbrosiaRedLuck:                     { iconFile: 'RedAmbrosiaRedLuck.png',                   family: 'red' },
    redAmbrosiaSalvageYinYang:              { iconFile: 'RedAmbrosiaSalvageYinYang.png',            family: 'red' },
    redAmbrosiaFreeObtainiumUpgrades:       { iconFile: 'RedAmbrosiaFreeObtainiumUpgrades.png',     family: 'red' },
    redAmbrosiaFreeLevelsRow4:              { iconFile: 'RedAmbrosiaFreeLevelsRow4.png',            family: 'red' },
    redAmbrosiaRedAmbrosiaCubeImprover:     { iconFile: 'RedAmbrosiaRedAmbrosiaCubeImprover.png',   family: 'red' },
    redAmbrosiaInfiniteShopUpgrades:        { iconFile: 'RedAmbrosiaInfiniteShopLevels.png',        family: 'red' },
    redAmbrosiaRedAmbrosiaAccelerator:      { iconFile: 'RedAmbrosiaAccelerator.png',               family: 'red' },
    redAmbrosiaFreeCubeUpgrades:            { iconFile: 'RedAmbrosiaFreeCubeUpgrades.png',          family: 'red' },
    redAmbrosiaViscount:                    { iconFile: 'RedAmbrosiaTutorial.png',                  family: 'red' },
    redAmbrosiaFreeLevelsRow5:              { iconFile: 'RedAmbrosiaFreeLevelsRow5.png',            family: 'red' },
    redAmbrosiaConversionImprovement3:      { iconFile: 'RedAmbrosiaConversionImprovement3.png',    family: 'red' },
    redAmbrosiaBlueberryGenerationSpeed2:   { iconFile: 'RedAmbrosiaBlueberryGenerationSpeed.png',  family: 'red' },
    redAmbrosiaRegularLuck2:                { iconFile: 'RedAmbrosiaRegularLuck.png',               family: 'red' },
    redAmbrosiaFreeSpeedUpgrades:           { iconFile: 'RedAmbrosiaFreeSpeedUpgrades.png',         family: 'red' },
} as const satisfies Record<string, LoadoutPreviewMeta>;

// === Loadout Preview Upgrade Key Type ===
type LoadoutPreviewUpgradeKey = keyof typeof LOADOUT_UPGRADE_META_MAP;

// === Selector and ID Constants ===
const HEATER_RESULT_UI_SELECTORS = {
    // Modal body
    modalBody: '.hs-modal-body',
    // Loadout preview overlay
    previewId:  'hs-heater-loadout-preview',
    previewRow: 'hs-heater-loadout-preview-row',
    previewButton:    'hs-heater-preview-button',
    previewEmptyCell: 'hs-heater-preview-empty-cell',
    // Loadout JSON tooltip
    tooltipId: 'hs-heater-loadout-json-tooltip',
    // Action buttons
    copyLoadoutBtn:   'hs-heater-copy-loadout-btn',
    importLoadoutBtn: 'hs-heater-import-loadout-btn',
    loadoutButtons:   'hs-heater-loadout-buttons',
    // Overlay trigger
    jsonTooltipTrigger: 'hs-heater-json-tooltip-trigger',
    // Result display
    resultsModalBlock: 'hs-heater-results-modal-block',
    resultsWrapper:    'hs-heater-results-wrapper',
    // Data attributes
    dataLoadout: 'data-loadout',
    // Game import input
    importFileInputId: 'importBlueberries',
} as const;

// === Main UI Class ===
export class HSHeaterResultUI {

    // === CSS Styles ===
    private static readonly overlayStyles = `
        #${HEATER_RESULT_UI_SELECTORS.previewId} {
            position: fixed;
            z-index: 9999;
            background: #1e1e1e;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            padding: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            max-width: 480px;
            max-height: 400px;
            overflow: auto;
        }
        
        .${HEATER_RESULT_UI_SELECTORS.previewRow} {
            display: flex;
            gap: 4px;
            margin-bottom: 4px;
        }
        
        .${HEATER_RESULT_UI_SELECTORS.previewButton} {
            width: 32px;
            height: 32px;
            padding: 0;
            border: none;
            background: transparent;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .${HEATER_RESULT_UI_SELECTORS.previewButton} img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .${HEATER_RESULT_UI_SELECTORS.previewEmptyCell} {
            width: 32px;
            height: 32px;
            background: rgba(100, 100, 100, 0.3);
            border-radius: 2px;
        }
        
        #${HEATER_RESULT_UI_SELECTORS.tooltipId} {
            position: fixed;
            z-index: 9999;
            background: #1e1e1e;
            color: #e0e0e0;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            padding: 6px 8px;
            white-space: pre-wrap;
            word-break: break-word;
            font-family: monospace;
            font-size: 0.78em;
            max-width: 480px;
            max-height: 280px;
            overflow-y: auto;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
    `;

    // === Static Initialization ===
    static {
        HSUI.injectStyle(this.overlayStyles);
    }

    // === State ===
    static currentResultModalId: string | null = null;

    private static readonly attachedModalHandlers = new WeakMap<HTMLElement, {
        onClick: (event: Event) => void;
        onShowOverlay: (event: Event) => void;
        onHideOverlay: (event: Event) => void;
        detach: () => void;
    }>();

    private static overlayState: {
        kind: 'preview' | 'json' | null;
        target: HTMLElement | null;
    } = {
        kind: null,
        target: null,
    };

    // === Metadata Maps ===
    private static readonly loadoutUpgradeMetaMap = LOADOUT_UPGRADE_META_MAP;

    private static readonly ambrosiaLoadoutPreviewRows: Array<Array<LoadoutPreviewUpgradeKey | null>> = [
        [ 'ambrosiaTutorial', 'ambrosiaPatreon', 'ambrosiaObtainium1', 'ambrosiaOffering1', 'ambrosiaHyperflux', 'ambrosiaBrickOfLead', null ],
        [ 'ambrosiaFreeLuckUpgrades', 'ambrosiaQuarks1', 'ambrosiaCubes1', 'ambrosiaLuck1', 'ambrosiaBaseObtainium1', 'ambrosiaBaseOffering1', 'ambrosiaSingReduction1', 'ambrosiaTalismanBonusRuneLevel', null ],
        [ 'ambrosiaFreeGenerationUpgrades', 'ambrosiaCubeQuark1', 'ambrosiaLuckQuark1', 'ambrosiaLuckCube1', 'ambrosiaQuarkCube1', 'ambrosiaCubeLuck1', 'ambrosiaQuarkLuck1', null ],
        [ 'ambrosiaFreeRedLuckUpgrades', 'ambrosiaQuarks2', 'ambrosiaCubes2', 'ambrosiaLuck2', 'ambrosiaBaseObtainium2', 'ambrosiaBaseOffering2', 'ambrosiaInfiniteShopUpgrades1', 'ambrosiaRuneOOMBonus', null ],
        [ 'ambrosiaFreeQuarkUpgrades', 'ambrosiaQuarks3', 'ambrosiaCubes3', 'ambrosiaLuck3', 'ambrosiaSingReduction2', 'ambrosiaInfiniteShopUpgrades2', 'ambrosiaLuck4', null ],
    ];

    // === Table/Section Rendering (delegated) ===
    static buildResultTable(result: HeaterOptimizationResult): string {
        return buildResultTableHtml(result);
    }

    // === UI/DOM Update Methods ===
    static updateResultModalContent(result: HeaterOptimizationResult): boolean {
        if (!this.currentResultModalId) return false;
        const modal = document.getElementById(this.currentResultModalId);
        if (!modal) return false;
        const body = modal.querySelector(HEATER_RESULT_UI_SELECTORS.modalBody);
        if (!body) return false;
        body.innerHTML = `
            <div class="${HEATER_RESULT_UI_SELECTORS.resultsModalBlock}">
                <div>
                    <div class="${HEATER_RESULT_UI_SELECTORS.resultsWrapper}">${this.buildResultTable(result)}</div>
                </div>
            </div>
        `;
        modal.style.width = 'auto';
        modal.style.minWidth = '0';
        modal.style.maxWidth = 'none';
        return true;
    }

    // === Loadout Preview/Tooltip Methods ===
    static showLoadoutPreview(button: HTMLElement): void {
        this.removeLoadoutPreview();

        const loadout = this.getLoadoutFromButton(button);
        if (!loadout) return;

        const preview = document.createElement('div');
        preview.id = HEATER_RESULT_UI_SELECTORS.previewId;
        preview.innerHTML = this.buildLoadoutPreviewHtml(loadout);

        document.body.appendChild(preview);
        this.positionLoadoutPreview(preview, button);
    }

    static removeLoadoutPreview(): void {
        const existing = document.getElementById(HEATER_RESULT_UI_SELECTORS.previewId);
        if (existing && existing.parentElement) {
            existing.parentElement.removeChild(existing);
        }
    }

    static showLoadoutJsonTooltip(trigger: HTMLElement): void {
        this.removeLoadoutJsonTooltip();

        const loadout = trigger.getAttribute(HEATER_RESULT_UI_SELECTORS.dataLoadout);
        if (!loadout) return;

        const tooltip = document.createElement('div');
        tooltip.id = HEATER_RESULT_UI_SELECTORS.tooltipId;
        tooltip.textContent = this.formatLoadoutJsonForTooltip(loadout);

        document.body.appendChild(tooltip);
        this.positionLoadoutPreview(tooltip, trigger);
    }

    static removeLoadoutJsonTooltip(): void {
        const existing = document.getElementById(HEATER_RESULT_UI_SELECTORS.tooltipId);
        if (existing && existing.parentElement) {
            existing.parentElement.removeChild(existing);
        }
    }

    static formatLoadoutJsonForTooltip(loadout: string): string {
        return loadout.replace(/,/g, ',\n');
    }

    static buildLoadoutPreviewHtml(loadout: Record<string, number>): string {
        return this.ambrosiaLoadoutPreviewRows
            .map((row) => `<div class="${HEATER_RESULT_UI_SELECTORS.previewRow}">${row.map((key) => this.buildLoadoutPreviewCell(key, loadout)).join('')}</div>`)
            .join('');
    }

    static buildLoadoutPreviewCell(key: LoadoutPreviewUpgradeKey | null, loadout: Record<string, number>): string {
        if (key === null) {
            return `
                <div class="ambrosiaBorder Exalt5x1">
                    <img src="Pictures/RedAmbrosia/AmbrosiaBorders.png" alt="Border" />
                </div>
            `;
        }

        const level = Number(loadout[key] ?? 0);
        const upgradeMeta = this.loadoutUpgradeMetaMap[key];
        if (!upgradeMeta) {
            return `<div class="${HEATER_RESULT_UI_SELECTORS.previewEmptyCell}"></div>`;
        }

        const isRed = upgradeMeta.family === 'red';
        const iconFile = upgradeMeta.iconFile;

        const imageUrl = `Pictures/${isRed ? 'RedAmbrosia' : 'Default'}/${iconFile}`;
        const imageClass = level > 0 ? 'dimmed' : 'superDimmed';
        const overlayText = level > 0 ? escapeHtml(String(level)) : '';

        return `
            <button class="${isRed ? 'redAmbrosiaUpgrade' : 'blueberryUpgrade'} relative-container ${HEATER_RESULT_UI_SELECTORS.previewButton}" type="button"> 
                <img src="${escapeHtml(imageUrl)}" class="${imageClass}" alt="${escapeHtml(key)}" />
                <div class="level-overlay">${overlayText}</div>
            </button>
        `;
    }

    static getLoadoutFromButton(button: HTMLElement): Record<string, number> | null {
        const loadout = button.getAttribute(HEATER_RESULT_UI_SELECTORS.dataLoadout);
        if (!loadout) {
            this.logResultUiIssue('missing-loadout-attribute', {
                source: 'getLoadoutFromButton',
                elementClass: button.className,
            });
            return null;
        }

        try {
            return JSON.parse(loadout) as Record<string, number>;
        } catch (error) {
            this.logResultUiIssue('loadout-parse-failed', {
                source: 'getLoadoutFromButton',
                loadoutPreview: loadout.slice(0, 180),
            }, error);
            return null;
        }
    }

    static positionLoadoutPreview(preview: HTMLElement, button: HTMLElement): void {
        const buttonRect = button.getBoundingClientRect();
        const previewRect = preview.getBoundingClientRect();
        let left = buttonRect.right + 8;
        let top = buttonRect.top;

        if (left + previewRect.width > window.innerWidth - 8) {
            left = buttonRect.left - previewRect.width - 8;
        }
        if (top + previewRect.height > window.innerHeight - 8) {
            top = window.innerHeight - previewRect.height - 8;
        }
        if (top < 8) {
            top = 8;
        }
        if (left < 8) {
            left = 8;
        }

        preview.style.left = `${left}px`;
        preview.style.top = `${top}px`;
    }

    // === Modal/Interaction/Event Methods ===
    static getResultInteractionTarget(modal: HTMLElement, event: Event): HTMLElement | null {
        const target = (event.target as HTMLElement | null)?.closest(`.${HEATER_RESULT_UI_SELECTORS.importLoadoutBtn}, .${HEATER_RESULT_UI_SELECTORS.jsonTooltipTrigger}`) as HTMLElement | null;
        if (!target || !modal.contains(target)) {
            return null;
        }
        return target;
    }

    static isSelfTransitionEvent(event: Event, target: HTMLElement): boolean {
        if (!(event instanceof MouseEvent)) {
            return false;
        }

        const related = event.relatedTarget as Node | null;
        return Boolean(related && target.contains(related));
    }

    static getOverlayKindFromTarget(target: HTMLElement): 'preview' | 'json' | null {
        if (target.classList.contains(HEATER_RESULT_UI_SELECTORS.importLoadoutBtn)) {
            return 'preview';
        }
        if (target.classList.contains(HEATER_RESULT_UI_SELECTORS.jsonTooltipTrigger)) {
            return 'json';
        }
        return null;
    }

    static clearActiveOverlay(): void {
        this.removeLoadoutPreview();
        this.removeLoadoutJsonTooltip();
        this.overlayState = { kind: null, target: null };
    }

    static showOverlayForTarget(target: HTMLElement): void {
        const kind = this.getOverlayKindFromTarget(target);
        if (!kind) {
            return;
        }

        const sameTarget = this.overlayState.target === target;
        const sameKind = this.overlayState.kind === kind;
        if (sameTarget && sameKind) {
            return;
        }

        this.clearActiveOverlay();
        if (kind === 'preview') {
            this.showLoadoutPreview(target);
        } else {
            this.showLoadoutJsonTooltip(target);
        }
        this.overlayState = { kind, target };
    }

    static hideOverlayForTarget(target: HTMLElement): void {
        if (this.overlayState.target !== target) {
            return;
        }
        this.clearActiveOverlay();
    }

    static toggleResultInteractionOverlay(target: HTMLElement, show: boolean): void {
        if (show) {
            this.showOverlayForTarget(target);
        } else {
            this.hideOverlayForTarget(target);
        }
    }

    static logResultUiIssue(code: string, details?: Record<string, unknown>, error?: unknown): void {
        if (error) {
            console.warn('[HSHeaterResultUI]', code, details ?? {}, error);
            return;
        }
        console.warn('[HSHeaterResultUI]', code, details ?? {});
    }

    static attachResultModalHandlers(modalId: string): void {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        if (this.attachedModalHandlers.has(modal)) {
            this.logResultUiIssue('modal-handlers-already-attached', { modalId });
            return;
        }

        const onClick = (event: Event) => {
            const button = (event.target as HTMLElement | null)?.closest(`.${HEATER_RESULT_UI_SELECTORS.copyLoadoutBtn}, .${HEATER_RESULT_UI_SELECTORS.importLoadoutBtn}`) as HTMLElement | null;
            if (!button) return;

            const loadout = button.getAttribute(HEATER_RESULT_UI_SELECTORS.dataLoadout);
            if (!loadout) {
                this.logResultUiIssue('missing-loadout-attribute', {
                    source: 'attachResultModalHandlers:onClick',
                    elementClass: button.className,
                });
                return;
            }

            this.clearActiveOverlay();

            if (button.classList.contains(HEATER_RESULT_UI_SELECTORS.copyLoadoutBtn)) {
                void this.copyLoadoutToClipboard(loadout);
                return;
            }
            if (button.classList.contains(HEATER_RESULT_UI_SELECTORS.importLoadoutBtn)) {
                void this.importLoadoutToGame(loadout);
            }
        };

        const onShowOverlay = (event: Event) => {
            const target = this.getResultInteractionTarget(modal, event);
            if (!target || this.isSelfTransitionEvent(event, target)) return;
            this.toggleResultInteractionOverlay(target, true);
        };

        const onHideOverlay = (event: Event) => {
            const target = this.getResultInteractionTarget(modal, event);
            if (!target || this.isSelfTransitionEvent(event, target)) return;
            this.toggleResultInteractionOverlay(target, false);
        };

        modal.addEventListener('click', onClick);
        modal.addEventListener('mouseover', onShowOverlay);
        modal.addEventListener('mouseout', onHideOverlay);
        modal.addEventListener('focusin', onShowOverlay);
        modal.addEventListener('focusout', onHideOverlay);

        const detach = () => {
            modal.removeEventListener('click', onClick);
            modal.removeEventListener('mouseover', onShowOverlay);
            modal.removeEventListener('mouseout', onHideOverlay);
            modal.removeEventListener('focusin', onShowOverlay);
            modal.removeEventListener('focusout', onHideOverlay);
            this.attachedModalHandlers.delete(modal);
            this.logResultUiIssue('modal-handlers-detached', { modalId });
        };

        this.attachedModalHandlers.set(modal, {
            onClick,
            onShowOverlay,
            onHideOverlay,
            detach,
        });
    }

    static detachResultModalHandlers(modalId: string): boolean {
        const modal = document.getElementById(modalId);
        if (!modal) return false;

        const handlers = this.attachedModalHandlers.get(modal);
        if (!handlers) return false;

        handlers.detach();
        this.clearActiveOverlay();
        return true;
    }

    // === Async/Clipboard/Game Import Methods ===
    static async copyLoadoutToClipboard(loadout: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(loadout);
            HSUI.Notify('Loadout copied to clipboard.', { position: 'top', notificationType: 'success' });
        } catch (error) {
            this.logResultUiIssue('clipboard-write-failed', {
                source: 'copyLoadoutToClipboard',
                loadoutPreview: loadout.slice(0, 180),
            }, error);
            HSUI.Notify('Failed to copy loadout to clipboard.', { position: 'top', notificationType: 'error' });
        }
    }

    static async importLoadoutToGame(loadout: string): Promise<void> {
        const fileInput = document.getElementById(HEATER_RESULT_UI_SELECTORS.importFileInputId) as HTMLInputElement | null;
        if (!fileInput) {
            this.logResultUiIssue('import-file-input-missing', {
                source: 'importLoadoutToGame',
                inputId: HEATER_RESULT_UI_SELECTORS.importFileInputId,
            });
            HSUI.Notify('Failed to import loadout: game import file input was not found.', { position: 'top', notificationType: 'error' });
            return;
        }

        if (typeof DataTransfer === 'undefined' || typeof File === 'undefined' || typeof Blob === 'undefined') {
            this.logResultUiIssue('import-not-supported-by-browser', {
                source: 'importLoadoutToGame',
                dataTransfer: typeof DataTransfer,
                file: typeof File,
                blob: typeof Blob,
            });
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
        } catch (error) {
            this.logResultUiIssue('import-dispatch-failed', {
                source: 'importLoadoutToGame',
                loadoutPreview: loadout.slice(0, 180),
            }, error);
            HSUI.Notify('Failed to import loadout to game.', { position: 'top', notificationType: 'error' });
        }
    }
}
