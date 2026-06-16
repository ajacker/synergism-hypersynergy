import { HSModule } from "../hs-core/module/hs-module";
import { HSModuleOptions } from "../../types/hs-types";
import { HSLogger } from "../hs-core/hs-logger";
import { HSSettings } from "../hs-core/settings/hs-settings";
import zhCN from "inline:../../resource/json/zh.json";

/**
 * Class: HSLocalization
 * IsExplicitHSModule: Yes
 * Description:
 *     Provides Chinese localization for the Hypersynergism mod UI.
 *     Patches all visible text after the mod is initialized.
 * Author: ajacker
 */
export class HSLocalization extends HSModule {
    #context = 'HSLocalization';
    #translations: Record<string, string> = {};
    #observer: MutationObserver | null = null;
    #interval: number | null = null;
    #checkCount = 0;

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
    }

    async init(): Promise<void> {
        if (this.isInitialized) return;

        try {
            this.#translations = JSON.parse(zhCN) as Record<string, string>;
            HSLogger.log(`Loaded ${Object.keys(this.#translations).length} Chinese translations`, this.#context);
        } catch (e) {
            HSLogger.error(`Failed to parse zh.json: ${e}`, this.#context);
            return;
        }

        this.#applyTranslation();
        this.#startWatchers();

        this.isInitialized = true;
        HSLogger.log('Chinese localization enabled', this.#context);
    }

    #applyTranslation(): void {
        const T = this.#translations;

        // Helper: translate text content
        const tr = (el: Element | null, fallback?: string) => {
            if (!el) return;
            const key: string = fallback ?? el.textContent?.trim() ?? '';
            if (key && T[key] !== undefined) {
                if (el.textContent?.trim() === key) {
                    el.textContent = T[key];
                }
            }
            // Also translate title attribute
            const title = el.getAttribute('title');
            if (title && T[title] !== undefined) {
                el.setAttribute('title', T[title]);
            }
        };

        const trSelector = (sel: string, key?: string) => tr(document.querySelector(sel), key);
        const trAll = (sel: string) => document.querySelectorAll(sel).forEach(el => tr(el));
        const trTitle = (sel: string) => {
            const el = document.querySelector(sel);
            if (el) {
                const t = el.getAttribute('title');
                if (t && T[t]) el.setAttribute('title', T[t]);
            }
        };

        // Panel
        trSelector('#hs-panel-version');
        trSelector('#hs-panel-tab-1', 'Log');
        trSelector('#hs-panel-tab-5', 'Info');
        trSelector('#hs-panel-tab-2', 'Tools');
        trSelector('#hs-panel-tab-3', 'Settings');
        trSelector('#hs-panel-tab-4', 'Debug');
        trSelector('#hs-ui-log-clear', 'Clear Log');
        trSelector('#hs-ui-log-copy', 'Copy Log');
        trTitle('#hs-panel-minimize-btn');
        trTitle('#hs-panel-close-btn');

        // Settings navigation, section headers, descriptions + tooltips
        trAll('.hs-panel-subtab');
        trAll('.hs-panel-grid-section-header');
        document.querySelectorAll('.hs-panel-setting-block-text').forEach(el => {
            tr(el);
            const ti = el.getAttribute('title');
            if (ti && T[ti]) el.setAttribute('title', T[ti]);
        });

        // Tools panel
        trAll('#hs-tools-panel button');
        trAll('#hs-tools-panel p');
        trSelector('#hs-panel-amb-heater-p');

        // Potion buttons (dynamically injected)
        ['offeringPotionMultiUseButton', 'offeringPotionMultiBuyButton',
         'obtainiumPotionMultiUseButton', 'obtainiumPotionMultiBuyButton',
         'hs-add-10-btn'].forEach(id => {
            const e = document.getElementById(id);
            if (e) tr(e);
        });

        // GQ Distributor
        const gq = document.getElementById('hs-gq-distributor');
        if (gq) gq.querySelectorAll('h3, button').forEach(el => tr(el));

        // Ambrosia quickbar tooltips
        document.querySelectorAll('.blueberryLoadoutSlot').forEach(el => {
            const ti = el.getAttribute('title');
            if (ti && T[ti]) el.setAttribute('title', T[ti]);
        });

        // Quick access menu
        document.querySelectorAll('#hs-quick-access-menu button span').forEach(el => tr(el));

        // Info panel
        document.querySelectorAll('#hs-info-panel h1').forEach(el => tr(el));
        document.querySelectorAll('#hs-info-panel h2').forEach(el => tr(el));
        document.querySelectorAll('#hs-info-panel p').forEach(p => {
            const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
            let n: Text | null;
            while ((n = walker.nextNode() as Text | null)) {
                const t = n.textContent?.trim() ?? '';
                if (t && T[t] !== undefined) n.textContent = T[t];
            }
        });
    }

    #startWatchers(): void {
        // Periodic check for dynamically generated elements (60 seconds)
        this.#interval = window.setInterval(() => {
            this.#applyTranslation();
            this.#checkCount++;
            if (this.#checkCount > 30) {
                if (this.#interval) window.clearInterval(this.#interval);
            }
        }, 2000);

        // MutationObserver for DOM changes
        this.#observer = new MutationObserver(() => this.#applyTranslation());
        this.#observer.observe(document.body, { childList: true, subtree: true });
    }

    destroy(): void {
        if (this.#interval) window.clearInterval(this.#interval);
        if (this.#observer) this.#observer.disconnect();
    }
}
