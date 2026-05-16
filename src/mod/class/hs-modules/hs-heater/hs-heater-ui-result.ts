import { HSUI } from "../../hs-core/hs-ui";
import type { HeaterOptimizationResult } from "../../../types/data-types/hs-heater-types";
import { escapeHtml } from "./hs-heater-ui-input";
import { buildResultTableHtml } from "./hs-heater-ui-result-renderer";

// === Loadout Preview Metadata Type and Map ===
type LoadoutPreviewMeta = { iconFile: string };

const LOADOUT_UPGRADE_META_MAP = {
    ambrosiaTutorial:              { iconFile: 'BlueberryTutorial.png' },
    ambrosiaPatreon:               { iconFile: 'BlueberryPatreon.png' },
    ambrosiaObtainium1:            { iconFile: 'BlueberryObtainium.png' },
    ambrosiaOffering1:             { iconFile: 'BlueberryOffering.png' },
    ambrosiaHyperflux:             { iconFile: 'BlueberryHyperflux.png' },
    ambrosiaBrickOfLead:           { iconFile: 'BlueberryBrickOfLead.png' },
    ambrosiaFreeLuckUpgrades:      { iconFile: 'BlueberryFreeLuckUpgrades.png' },
    ambrosiaQuarks1:               { iconFile: 'BlueberryQuarks.png' },
    ambrosiaCubes1:                { iconFile: 'BlueberryCubes.png' },
    ambrosiaLuck1:                 { iconFile: 'BlueberryLuck.png' },
    ambrosiaBaseObtainium1:        { iconFile: 'BlueberryBaseObtainium1.png' },
    ambrosiaBaseOffering1:         { iconFile: 'BlueberryBaseOffering1.png' },
    ambrosiaSingReduction1:        { iconFile: 'BlueberrySingReduction.png' },
    ambrosiaTalismanBonusRuneLevel:{ iconFile: 'BlueberryTalismanBonusRuneLevel.png' },
    ambrosiaFreeGenerationUpgrades:{ iconFile: 'BlueberryFreeGenerationLevels.png' },
    ambrosiaCubeQuark1:            { iconFile: 'BlueberryCubeQuark.png' },
    ambrosiaLuckQuark1:            { iconFile: 'BlueberryLuckQuark.png' },
    ambrosiaLuckCube1:             { iconFile: 'BlueberryLuckCube.png' },
    ambrosiaQuarkCube1:            { iconFile: 'BlueberryQuarkCube.png' },
    ambrosiaCubeLuck1:             { iconFile: 'BlueberryCubeLuck.png' },
    ambrosiaQuarkLuck1:            { iconFile: 'BlueberryQuarkLuck.png' },
    ambrosiaFreeRedLuckUpgrades:   { iconFile: 'BlueberryFreeRedLuckUpgrades.png' },
    ambrosiaQuarks2:               { iconFile: 'BlueberryQuarks2.png' },
    ambrosiaCubes2:                { iconFile: 'BlueberryCubes2.png' },
    ambrosiaLuck2:                 { iconFile: 'BlueberryLuck2.png' },
    ambrosiaBaseObtainium2:        { iconFile: 'BlueberryBaseObtainium2.png' },
    ambrosiaBaseOffering2:         { iconFile: 'BlueberryBaseOffering2.png' },
    ambrosiaInfiniteShopUpgrades1: { iconFile: 'BlueberryInfiniteShopUpgrades.png' },
    ambrosiaRuneOOMBonus:          { iconFile: 'BlueberryRuneOOMBonus.png' },
    ambrosiaFreeQuarkUpgrades:     { iconFile: 'BlueberryFreeQuarkUpgrades.png' },
    ambrosiaQuarks3:               { iconFile: 'BlueberryQuarks3.png' },
    ambrosiaCubes3:                { iconFile: 'BlueberryCubes3.png' },
    ambrosiaLuck3:                 { iconFile: 'BlueberryLuck3.png' },
    ambrosiaSingReduction2:        { iconFile: 'BlueberrySingReduction2.png' },
    ambrosiaInfiniteShopUpgrades2: { iconFile: 'BlueberryInfiniteShopUpgrades2.png' },
    ambrosiaLuck4:                 { iconFile: 'BlueberryLuck4.png' },
} as const satisfies Record<string, LoadoutPreviewMeta>;

// === Loadout Preview Upgrade Key Type ===
type LoadoutPreviewUpgradeKey = keyof typeof LOADOUT_UPGRADE_META_MAP;

// === Selector and ID Constants ===
const HEATER_RESULT_UI_SELECTORS = {
    modalBody:          '.hs-modal-body',
    resultsHeader:      '.hs-heater-results-header',
    previewId:          'hs-heater-loadout-preview',
    previewRow:         'hs-heater-loadout-preview-row',
    previewButton:      'hs-heater-preview-button',
    previewEmptyCell:   'hs-heater-preview-empty-cell',
    tooltipId:          'hs-heater-loadout-json-tooltip',
    copyLoadoutBtn:     'hs-heater-copy-loadout-btn',
    importLoadoutBtn:   'hs-heater-import-loadout-btn',
    jsonTooltipTrigger: 'hs-heater-json-tooltip-trigger',
    dataLoadout:        'data-loadout',
    importFileInputId:  'importBlueberries',
} as const;

// === Main UI Class ===
export class HSHeaterResultUI {

    // === State ===
    static currentResultModalId: string | null = null;
    private static currentResultData: HeaterOptimizationResult | null = null;

    private static quickbarCloneCleanup: (() => void) | null = null;

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

    static setCurrentResultData(result: HeaterOptimizationResult): void {
        this.currentResultData = result;
    }

    static getCurrentResultDataIfModalOpen(): HeaterOptimizationResult | null {
        if (!this.currentResultModalId) return null;
        const modal = document.getElementById(this.currentResultModalId);
        if (!modal) return null;
        return this.currentResultData;
    }

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
        
        body.innerHTML = this.buildResultTable(result);
        modal.style.width = 'auto';
        modal.style.minWidth = '0';
        modal.style.maxWidth = 'none';
        this.populateResultsHeader(modal);
        return true;
    }

    static populateResultsHeader(modal: HTMLElement): void {
        const header = modal.querySelector(HEATER_RESULT_UI_SELECTORS.resultsHeader) as HTMLElement | null;
        if (!header) return;

        // Disconnect previous observer and remove previous click listener before reinitializing
        this.quickbarCloneCleanup?.();
        this.quickbarCloneCleanup = null;

        header.innerHTML = '';

        const slotsSource = document.getElementById('hs-ambrosia-slots-wrapper');
        if (slotsSource) {
            const clone = slotsSource.cloneNode(true) as HTMLElement;
            clone.removeAttribute('id');
            // Strip child IDs to avoid duplicate DOM IDs
            clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
            header.appendChild(clone);
            this.quickbarCloneCleanup = this.setupQuickbarCloneLink(clone, slotsSource);
        }
    }

    private static setupQuickbarCloneLink(clone: HTMLElement, slotsSource: HTMLElement): () => void {
        const originalSlots = Array.from(slotsSource.querySelectorAll<HTMLElement>('.blueberryLoadoutSlot'));
        const cloneSlots = Array.from(clone.querySelectorAll<HTMLElement>('.blueberryLoadoutSlot'));

        // Initial sync of hs-rainbow-border state from original to clone
        originalSlots.forEach((orig, i) => {
            cloneSlots[i]?.classList.toggle('hs-rainbow-border', orig.classList.contains('hs-rainbow-border'));
        });

        // Click delegation: clone slot click → original slot click
        const onCloneClick = (event: Event) => {
            const target = (event.target as HTMLElement | null)?.closest('.blueberryLoadoutSlot') as HTMLElement | null;
            if (!target) return;
            const idx = cloneSlots.indexOf(target);
            if (idx === -1) return;
            originalSlots[idx]?.click();
        };
        clone.addEventListener('click', onCloneClick);

        // MutationObserver: sync hs-rainbow-border from original slots to clone slots
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName !== 'class') continue;
                const originalEl = mutation.target as HTMLElement;
                const idx = originalSlots.indexOf(originalEl);
                if (idx === -1) continue;
                cloneSlots[idx]?.classList.toggle('hs-rainbow-border', originalEl.classList.contains('hs-rainbow-border'));
            }
        });
        originalSlots.forEach(slot => {
            observer.observe(slot, { attributes: true, attributeFilter: ['class'] });
        });

        return () => {
            clone.removeEventListener('click', onCloneClick);
            observer.disconnect();
        };
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
        this.positionOverlayNearTarget(preview, button);
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
        this.positionOverlayNearTarget(tooltip, trigger);
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

        const imageUrl = `Pictures/Default/${upgradeMeta.iconFile}`;
        const imageClass = level > 0 ? 'dimmed' : 'superDimmed';
        const overlayText = level > 0 ? escapeHtml(String(level)) : '';

        return `
            <button class="blueberryUpgrade relative-container ${HEATER_RESULT_UI_SELECTORS.previewButton}" type="button"> 
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

    static positionOverlayNearTarget(preview: HTMLElement, button: HTMLElement): void {
        const buttonRect = button.getBoundingClientRect();
        const previewRect = preview.getBoundingClientRect();
        let left = buttonRect.right + 8;
        let top = buttonRect.top;

        if (left + previewRect.width > window.innerWidth - 8)
            left = buttonRect.left - previewRect.width - 8;
        if (top + previewRect.height > window.innerHeight - 8)
            top = window.innerHeight - previewRect.height - 8;
        if (top < 8)
            top = 8;
        if (left < 8)
            left = 8;
        preview.style.left = `${left}px`;
        preview.style.top = `${top}px`;
    }

    // === Modal/Interaction/Event Methods ===
    static getResultInteractionTarget(modal: HTMLElement, event: Event): HTMLElement | null {
        const target = (event.target as HTMLElement | null)?.closest(`.${HEATER_RESULT_UI_SELECTORS.importLoadoutBtn}, .${HEATER_RESULT_UI_SELECTORS.jsonTooltipTrigger}`) as HTMLElement | null;
        if (!target || !modal.contains(target)) return null;
        return target;
    }

    static isSelfTransitionEvent(event: Event, target: HTMLElement): boolean {
        if (!(event instanceof MouseEvent)) return false;

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
        if (!kind) return;

        const sameTarget = this.overlayState.target === target;
        const sameKind = this.overlayState.kind === kind;
        if (sameTarget && sameKind) return;

        this.clearActiveOverlay();
        if (kind === 'preview') {
            this.showLoadoutPreview(target);
        } else {
            this.showLoadoutJsonTooltip(target);
        }
        this.overlayState = { kind, target };
    }

    static hideOverlayForTarget(target: HTMLElement): void {
        if (this.overlayState.target !== target) return;
        this.clearActiveOverlay();
    }

    static toggleResultInteractionOverlay(target: HTMLElement, show: boolean): void {
        if (target.classList.contains(HEATER_RESULT_UI_SELECTORS.importLoadoutBtn)) {
            target.classList.toggle('hs-rainbow-border', show);
        }
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

        this.populateResultsHeader(modal);
    }

    static detachResultModalHandlers(modalId: string): boolean {
        const modal = document.getElementById(modalId);
        if (!modal) return false;

        const handlers = this.attachedModalHandlers.get(modal);
        if (!handlers) return false;

        handlers.detach();
        this.quickbarCloneCleanup?.();
        this.quickbarCloneCleanup = null;
        this.clearActiveOverlay();
        if (this.currentResultModalId === modalId) {
            this.currentResultData = null;
        }
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
            HSUI.Notify('Loadout imported to the active slot.', { position: 'top', notificationType: 'success' });
        } catch (error) {
            this.logResultUiIssue('import-dispatch-failed', {
                source: 'importLoadoutToGame',
                loadoutPreview: loadout.slice(0, 180),
            }, error);
            HSUI.Notify('Failed to import loadout.', { position: 'top', notificationType: 'error' });
        }
    }
}
