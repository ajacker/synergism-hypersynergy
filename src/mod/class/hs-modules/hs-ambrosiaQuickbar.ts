import type { HSAmbrosia } from "./hs-ambrosia";
import { HSQuickbarManager } from "./hs-qolQuickbarManager";
import { HSLogger } from "../hs-core/hs-logger";
import { HSUI } from "../hs-core/hs-ui";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSSetting } from "../hs-core/settings/hs-setting";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSGlobal } from "../hs-core/hs-global";
import { HSAmbrosiaHelper } from "./hs-ambrosiaHelper";
import { resolveHeaterIconFromSemanticId } from "./hs-heater/hs-heater-ui-result-renderer";
import { HSQuickbarIconPickerController } from "./hs-qolQuickbarIconPicker";

export interface HeaterSlotIconApplyResult {
    setCount: number;
    clearedCount: number;
    missingCount: number;
}

export class HSAmbrosiaQuickbar {
    readonly context = 'HSAmbrosiaQuickbar';
    readonly host: HSAmbrosia;
    #quickBarClickHandlers: Map<HTMLButtonElement, (e: Event) => Promise<void>> = new Map();
    #quickBarContextMenuHandlers: Map<HTMLButtonElement, (e: Event) => void> = new Map();
    #originalQuickBarButtons: Map<string, HTMLButtonElement> = new Map();

    // Icon picking (mirrors HSQOLCorruptionQuickbar)
    readonly #AMBROSIA_ICON_STORAGE_KEY = 'hs-ambrosia-quickbar-icons';
    #ambrosiaSlotIcons: Map<string, string> = new Map();
    #iconPicker = new HSQuickbarIconPickerController<string>({
        shouldIgnoreClickTarget: (target: Element) => {
            const groupWrapper = HSQuickbarManager.getInstance().getSection("ambrosia");
            const quickbar = groupWrapper?.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement | null;
            return !!(quickbar && quickbar.contains(target));
        },
        setSlotPickModeVisual: (slotId: string, active: boolean) => {
            const groupWrapper = HSQuickbarManager.getInstance().getSection("ambrosia");
            const quickbar = groupWrapper?.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement | null;
            if (!quickbar) return;

            quickbar.querySelectorAll(".blueberryLoadoutSlot").forEach((btn) => {
                const b = btn as HTMLElement;
                const originalId = b.dataset.originalId;
                b.classList.toggle("hs-quickbar-slot-pickmode", !!active && originalId === slotId);
            });
        },
        clearAllSlotPickModeVisuals: () => {
            const groupWrapper = HSQuickbarManager.getInstance().getSection("ambrosia");
            const quickbar = groupWrapper?.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement | null;
            if (!quickbar) return;

            quickbar.querySelectorAll(".blueberryLoadoutSlot").forEach((btn) => {
                (btn as HTMLElement).classList.remove("hs-quickbar-slot-pickmode");
            });
        },
        assignIconToSlot: (slotId: string, iconUrl: string) => {
            this.#setIconForSlot(slotId, iconUrl);
        },
    });

    constructor(host: HSAmbrosia) {
        this.host = host;
    }

    async init() {
        await this.ensureInjectedQuickbar();
        await this.setupQuickbar();
    }

    #registerQuickbarSection() {
        HSQuickbarManager.getInstance().removeSection("ambrosia");
        HSQuickbarManager.getInstance().registerSection("ambrosia", () => {
            HSLogger.debug(() => "Ambrosia Quickbar section factory called", this.context);
            const pageHeader = this.host.getPageHeader();
            if (!pageHeader) return { element: document.createElement("div") };
            const quickbarsRow = HSQuickbarManager.ensureQuickbarsRow();
            let groupWrapper = quickbarsRow.querySelector("#hs-ambrosia-group-wrapper") as HTMLElement;
            if (!groupWrapper) {
                groupWrapper = document.createElement("div");
                groupWrapper.id = "hs-ambrosia-group-wrapper";
                groupWrapper.style.display = "flex";
                groupWrapper.style.flexDirection = "column";
                groupWrapper.style.justifyContent = "flex-end";
                quickbarsRow.appendChild(groupWrapper);
            }
            if (quickbarsRow.lastChild !== groupWrapper) {
                quickbarsRow.appendChild(groupWrapper);
            }
            return { element: groupWrapper };
        });
        HSQuickbarManager.getInstance().injectSection("ambrosia");
    }

    async ensureInjectedQuickbar() {
        const quickbarManager = HSQuickbarManager.getInstance();

        if (!quickbarManager.isInjected("ambrosia")) {
            this.#registerQuickbarSection();
        }

        await quickbarManager.whenSectionInjected("ambrosia");
    }

    public async setupQuickbar() {
        await this.ensureInjectedQuickbar();
        await this.createPersistentQuickbarContainer();

        const groupWrapper = HSQuickbarManager.getInstance().getSection("ambrosia");
        if (!groupWrapper) {
            HSLogger.error("setupQuickbar: group wrapper missing after injection!", this.context, true);
            return;
        }

        const quickbarSetting = HSSettings.getSetting("ambrosiaQuickBar") as HSSetting<boolean>;
        const quickbar = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;

        if (quickbar) {
            if (quickbarSetting && !quickbarSetting.isEnabled()) {
                quickbar.style.display = "none";
                HSLogger.debug(() => "quickbar hidden due to settings", this.context);
            } else {
                this.setupQuickbarSectionEvents();
                await this.refreshQuickbarIcons();
                await this.host.refreshActiveLoadoutFromState();
                HSUI.injectStyle(this.host.getQuickbarCSS(), this.host.getQuickbarCSSId());
            }
        }
    }

    async createPersistentQuickbarContainer() {
        const pageHeader = this.host.getPageHeader();
        if (!pageHeader) return;

        // Load persisted slot icons once before building the container
        if (this.#ambrosiaSlotIcons.size === 0) {
            this.#loadAmbrosiaIcons();
        }

        const quickbarsRow = HSQuickbarManager.ensureQuickbarsRow();
        let groupWrapper = quickbarsRow.querySelector("#hs-ambrosia-group-wrapper") as HTMLElement;
        if (!groupWrapper) {
            groupWrapper = document.createElement("div");
            groupWrapper.id = "hs-ambrosia-group-wrapper";
            groupWrapper.style.display = "flex";
            groupWrapper.style.flexDirection = "column";
            groupWrapper.style.justifyContent = "flex-end";
            quickbarsRow.appendChild(groupWrapper);
        }

        if (quickbarsRow.lastChild !== groupWrapper) {
            quickbarsRow.appendChild(groupWrapper);
        }

        if (groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`)) {
            HSLogger.debug(() => "Quickbar already exists in group wrapper", this.context);
            return;
        }

        const loadoutContainer = this.host.getLoadoutContainer();
        if (loadoutContainer) {
            const clone = loadoutContainer.cloneNode(true) as HTMLElement;
            clone.id = HSGlobal.HSAmbrosia.quickBarId;
            clone.className = 'hs-quickbar-slots-wrapper';
            clone.style.display = "inline-flex";

            const cloneSettingButton = clone.querySelector(".blueberryLoadoutSetting") as HTMLButtonElement;
            const cloneLoadoutButtons = clone.querySelectorAll(".blueberryLoadoutSlot") as NodeListOf<HTMLButtonElement>;

            cloneLoadoutButtons.forEach((button) => {
                const buttonId = button.id;
                button.dataset.originalId = buttonId;
                button.id = `${HSGlobal.HSAmbrosia.quickBarLoadoutIdPrefix}-${buttonId}`;
                button.title = 'Alt+Click to pick an icon | Right-click to clear';
                this.#cacheOriginalLoadoutButton(buttonId);
            });

            if (cloneSettingButton) {
                cloneSettingButton.remove();
            }

            if (groupWrapper.childNodes.length > 0) {
                if (groupWrapper.childNodes.length === 1) {
                    groupWrapper.appendChild(clone);
                } else {
                    groupWrapper.insertBefore(clone, groupWrapper.childNodes[1]);
                }
            } else {
                groupWrapper.appendChild(clone);
            }
        }
    }

    public getQuickbarSection(): HTMLElement {
        const loadoutContainer = this.host.getLoadoutContainer();
        if (!loadoutContainer) {
            HSLogger.error("getQuickbarSection called but loadoutContainer is not initialized", this.context, true);
            throw new Error("Ambrosia loadout container not initialized");
        }

        const clone = loadoutContainer.cloneNode(true) as HTMLElement;
        clone.id = HSGlobal.HSAmbrosia.quickBarId;
        clone.className = 'hs-quickbar-slots-wrapper';
        clone.style.display = "inline-flex";

        const cloneSettingButton = clone.querySelector(".blueberryLoadoutSetting") as HTMLButtonElement;
        if (cloneSettingButton) {
            cloneSettingButton.remove();
        }

        const cloneLoadoutButtons = clone.querySelectorAll(".blueberryLoadoutSlot") as NodeListOf<HTMLButtonElement>;
        cloneLoadoutButtons.forEach((button) => {
            const buttonId = button.id;
            button.dataset.originalId = buttonId;
            button.id = buttonId;
        });

        return clone;
    }

    setupQuickbarSectionEvents() {
        const quickbar = HSQuickbarManager.getInstance().getSection("ambrosia");
        if (!quickbar) return;

        quickbar.querySelectorAll(".blueberryLoadoutSlot").forEach((button: Element) => {
            const btn = button as HTMLButtonElement;
            const clone = btn.cloneNode(true) as HTMLButtonElement;
            btn.replaceWith(clone);

            const buttonId = clone.dataset.originalId || "";
            if (buttonId) {
                this.#cacheOriginalLoadoutButton(buttonId);
            }
            clone.title = 'Alt+Click to pick an icon | Right-click to clear';

            const buttonHandler = async (e: Event) => {
                const mouseEvent = e as MouseEvent;
                if (mouseEvent.altKey) {
                    mouseEvent.preventDefault();
                    mouseEvent.stopPropagation();
                    this.#iconPicker.start(buttonId);
                    return;
                }
                await this.onQuickBarClick(e, buttonId);
            };
            const contextMenuHandler = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.#clearIconForSlot(buttonId);
                HSUI.Notify('Ambrosia slot icon cleared', { notificationType: 'default' });
            };
            clone.addEventListener("click", buttonHandler);
            clone.addEventListener("contextmenu", contextMenuHandler);
            this.#quickBarClickHandlers.set(clone, buttonHandler);
            this.#quickBarContextMenuHandlers.set(clone, contextMenuHandler);
        });
    }

    cleanupQuickbarClickHandlers() {
        for (const [button, handler] of this.#quickBarClickHandlers.entries()) {
            button.removeEventListener("click", handler);
        }
        for (const [button, handler] of this.#quickBarContextMenuHandlers.entries()) {
            button.removeEventListener("contextmenu", handler);
        }
        this.#quickBarClickHandlers.clear();
        this.#quickBarContextMenuHandlers.clear();
        this.#originalQuickBarButtons.clear();
    }

    #cacheOriginalLoadoutButton(buttonId: string) {
        if (!buttonId || this.#originalQuickBarButtons.has(buttonId)) return;

        const originalButton = document.getElementById(buttonId) as HTMLButtonElement | null;
        if (originalButton) {
            this.#originalQuickBarButtons.set(buttonId, originalButton);
        }
    }

    async refreshQuickbarIcons() {
        const ambQuickBar = this.host.getPageHeader()?.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;

        if (ambQuickBar) {
            const quickbarSlots = ambQuickBar.querySelectorAll(".blueberryLoadoutSlot") as NodeListOf<HTMLElement>;
            quickbarSlots.forEach((slot) => {
                const originalSlotId = slot.dataset.originalId;
                if (!originalSlotId) return;
                const customUrl = this.#getAmbrosiaSlotIcon(originalSlotId);
                if (customUrl) {
                    slot.classList.add("hs-ambrosia-slot");
                    slot.style.backgroundImage = `url(${customUrl})`;
                } else {
                    slot.classList.remove("hs-ambrosia-slot");
                    slot.style.backgroundImage = "";
                }
            });
        }

        const originalBar = document.querySelector("#bbLoadoutContainer");
        if (originalBar) {
            const originalSlots = originalBar.querySelectorAll(".blueberryLoadoutSlot") as NodeListOf<HTMLElement>;
            originalSlots.forEach((slot) => {
                const customUrl = this.#getAmbrosiaSlotIcon(slot.id);
                if (customUrl) {
                    slot.classList.add("hs-ambrosia-slot");
                    slot.style.backgroundImage = `url(${customUrl})`;
                } else {
                    slot.classList.remove("hs-ambrosia-slot");
                    slot.style.backgroundImage = "";
                }
            });
        }
    }

    async updateQuickBar() {
        await HSQuickbarManager.getInstance().whenSectionInjected("ambrosia");
        const quickbarSetting = HSSettings.getSetting("ambrosiaQuickBar") as HSSetting<boolean>;

        if (quickbarSetting.isEnabled()) {
            await this.refreshQuickbarIcons();
        }
    }

    async onQuickBarClick(e: Event, buttonId: string) {
        const realButton = this.#originalQuickBarButtons.get(buttonId) ?? document.getElementById(buttonId) as HTMLButtonElement | null;
        if (!realButton) { HSLogger.warn(`Could not find real button for ${buttonId}`, this.context); return; }

        await HSAmbrosiaHelper.ensureLoadoutModeIsLoad();
        await HSUtils.hiddenAction(async () => { realButton.click(); });
    }

    async showQuickBar() {
        const groupWrapper = await this.ensureAmbrosiaSection();
        if (!groupWrapper) {
            HSLogger.warn("Could not find group wrapper for quickbar", this.context);
            return;
        }
        const wrapper = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;
        if (wrapper) {
            wrapper.style.display = "inline-flex";
            HSUI.injectStyle(this.host.getQuickbarCSS(), this.host.getQuickbarCSSId());
            await this.refreshQuickbarIcons();
            await this.host.refreshActiveLoadoutFromState();
        } else {
            HSLogger.warn("Could not find quickbar wrapper", this.context);
        }
    }

    async hideQuickBar() {
        const groupWrapper = await this.ensureAmbrosiaSection();
        if (!groupWrapper) {
            HSLogger.warn("Could not find group wrapper for quickbar", this.context);
            return;
        }
        const ambQuickBar = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;
        if (ambQuickBar) {
            ambQuickBar.style.display = "none";
            HSUI.removeInjectedStyle(this.host.getQuickbarCSSId());
        }
    }

    async destroy() {
        this.#iconPicker.dispose();
        this.cleanupQuickbarClickHandlers();
        HSQuickbarManager.getInstance().removeSection("ambrosia");
        HSUI.removeInjectedStyle(this.host.getQuickbarCSSId());
    }

    // ======================================================
    // ------------------- Icon storage --------------------
    // ======================================================

    #loadAmbrosiaIcons(): void {
        try {
            const raw = localStorage.getItem(this.#AMBROSIA_ICON_STORAGE_KEY);
            if (!raw) { this.#ambrosiaSlotIcons = new Map(); return; }
            const parsed = JSON.parse(raw) as Record<string, string>;
            this.#ambrosiaSlotIcons = new Map(Object.entries(parsed));
        } catch (error) {
            HSLogger.warn(`HSAmbrosiaQuickbar.loadAmbrosiaIcons failed: ${String(error)}`, this.context);
            this.#ambrosiaSlotIcons = new Map();
        }
    }

    #saveAmbrosiaIcons(): void {
        try {
            const obj: Record<string, string> = {};
            this.#ambrosiaSlotIcons.forEach((url, key) => { obj[key] = url; });
            localStorage.setItem(this.#AMBROSIA_ICON_STORAGE_KEY, JSON.stringify(obj));
        } catch (error) {
            HSLogger.warn(`HSAmbrosiaQuickbar.saveAmbrosiaIcons failed: ${String(error)}`, this.context);
        }
    }

    #getAmbrosiaSlotIcon(slotId: string): string | undefined {
        return this.#ambrosiaSlotIcons.get(slotId);
    }

    #setAmbrosiaSlotIcon(slotId: string, url: string): void {
        this.#ambrosiaSlotIcons.set(slotId, url);
        this.#saveAmbrosiaIcons();
    }

    #clearAmbrosiaSlotIcon(slotId: string): void {
        this.#ambrosiaSlotIcons.delete(slotId);
        this.#saveAmbrosiaIcons();
    }

    #setIconForSlot(slotId: string, url: string): void {
        this.#setAmbrosiaSlotIcon(slotId, url);
        void this.refreshQuickbarIcons();
    }

    #clearIconForSlot(slotId: string): void {
        this.#clearAmbrosiaSlotIcon(slotId);
        void this.refreshQuickbarIcons();
    }

    public async applySlotIconsBulk(iconBySlotId: Record<string, string | null | undefined>): Promise<void> {
        let changed = false;

        for (const [slotId, iconUrl] of Object.entries(iconBySlotId)) {
            if (!slotId) continue;

            const normalizedUrl = typeof iconUrl === 'string' ? iconUrl.trim() : '';
            if (normalizedUrl) {
                if (this.#ambrosiaSlotIcons.get(slotId) !== normalizedUrl) {
                    this.#ambrosiaSlotIcons.set(slotId, normalizedUrl);
                    changed = true;
                }
            } else if (this.#ambrosiaSlotIcons.has(slotId)) {
                this.#ambrosiaSlotIcons.delete(slotId);
                changed = true;
            }
        }

        if (changed) {
            this.#saveAmbrosiaIcons();
        }

        await this.refreshQuickbarIcons();
    }

    public async applyHeaterSlotIconSemanticsBulk(iconSemanticBySlotId: Record<string, string | null | undefined>): Promise<HeaterSlotIconApplyResult> {
        const iconBySlotId: Record<string, string | null> = {};
        let setCount = 0;
        let clearedCount = 0;
        let missingCount = 0;

        for (const [slotId, semanticId] of Object.entries(iconSemanticBySlotId)) {
            if (!slotId) continue;

            const normalizedSemanticId = typeof semanticId === "string" ? semanticId.trim() : "";
            if (!normalizedSemanticId || normalizedSemanticId === "none") {
                iconBySlotId[slotId] = null;
                clearedCount++;
                continue;
            }

            const resolvedUrl = resolveHeaterIconFromSemanticId(normalizedSemanticId);
            if (resolvedUrl) {
                iconBySlotId[slotId] = resolvedUrl;
                setCount++;
            } else {
                iconBySlotId[slotId] = null;
                clearedCount++;
                missingCount++;
                HSLogger.warn(`Unknown heater icon semantic ID: ${normalizedSemanticId}`, this.context);
            }
        }

        await this.applySlotIconsBulk(iconBySlotId);

        return {
            setCount,
            clearedCount,
            missingCount,
        };
    }

    private async ensureAmbrosiaSection(): Promise<HTMLElement | null> {
        await HSQuickbarManager.getInstance().whenSectionInjected("ambrosia");
        const section = HSQuickbarManager.getInstance().getSection("ambrosia");
        return section ?? null;
    }
}
