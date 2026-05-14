import { HSUI } from "../../hs-core/hs-ui";

export class HSHeaterStyles {
    private static heaterStylesInjected = false;

    static getHeaterBaseStylesCss(): string {
        return `
            /* === Modal Layout === */
            .hs-heater-results-modal-block { display: block; max-width: none; width: auto; }
            .hs-modal-body.hs-heater-inputs-body { display: flex; gap: 14px; align-items: stretch; min-height: 0; overflow: hidden; }
            #hs-heater-modal-left { flex: 1 1 auto; width: auto; min-width: 100px; min-height: 0; overflow-y: auto; }
            #hs-heater-modal-right { flex: 0 0 auto; display: flex; flex-direction: column; gap: 12px; width: auto; min-height: 0; overflow-y: auto; }

            /* === Table Base Styles === */
            .hs-heater-input-table, .hs-heater-results-table, .hs-heater-subtable { border-collapse: collapse; }
            .hs-heater-input-table { width: auto; table-layout: fixed; }
            .hs-heater-results-table, .hs-heater-subtable { width: auto; table-layout: auto; }
            .hs-heater-input-table td, .hs-heater-input-table th,
            .hs-heater-results-table td, .hs-heater-results-table th,
            .hs-heater-subtable td, .hs-heater-subtable th { padding: 0px 2px; border: 1px solid rgba(255,255,255,0.08); }

            /* === Input Table Styles === */
            .hs-heater-input-table td, .hs-heater-input-table th { height: 20px; line-height: 20px; min-height: 20px; }
            .hs-heater-input-table td:first-child, .hs-heater-input-table th:first-child { width: auto; white-space: nowrap; }
            .hs-heater-input-table td:nth-child(2), .hs-heater-input-table th:nth-child(2) { width: 200px; }
            .hs-heater-input-table td:nth-child(3), .hs-heater-input-table th:nth-child(3) { width: auto; text-align: center; }
            .hs-heater-input-table input { width: 100%; min-width: 165px; box-sizing: border-box; height: 18px; }

            /* === Results & Subtable Styles === */
            .hs-heater-results-table td, .hs-heater-results-table th,
            .hs-heater-subtable td, .hs-heater-subtable th { padding: 0px 8px; text-align: center; }
            .hs-heater-results-table th:first-child, .hs-heater-results-table td:first-child { width: auto; white-space: nowrap; }
            .hs-heater-results-table th:last-child, .hs-heater-results-table td:last-child { width: auto; text-align: center; }
            .hs-heater-subtable th:last-child, .hs-heater-subtable td:last-child { text-align: center; }
            .hs-heater-results-wrapper { overflow-x: auto; }

            /* === Input Controls === */
            .hs-heater-select-input { width: 100%; height: 20px; background-color: black; color: white; }
            .hs-heater-percent-input-wrap { display: inline-flex; align-items: center; gap: 2px; width: 100%; }

            /* === Lock Button === */
            .hs-heater-lock-button { border: none; background: transparent; cursor: pointer; padding: 0; }
            .hs-heater-lock-button:hover { transform: scale(1.05); }
            .hs-heater-lock-cell-locked { background: rgba(179, 25, 25, 0.58); }

            /* === Grid & Layout === */
            .hs-heater-active-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
            .hs-heater-active-label { display: flex; align-items: center; gap: 6px; }
            .hs-heater-loadout-cell { display: flex; align-items: center; gap: 8px; }
            .hs-heater-loadout-buttons { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; }

            /* === Typography & Text === */
            .hs-heater-section-title { margin: 0 0 6px 0; font-weight: bold; }
            .hs-heater-section-group-title { font-weight: bold; margin: 8px 0 2px 0; font-size: 0.95em; opacity: 0.75; }
            .hs-heater-title-row { font-weight: bold; text-align: center; padding: 4px 2px; background: rgba(255,255,255,0.05); }
            .hs-heater-header-row { background: rgba(100,100,100,0.2); }
            .hs-heater-result-cell { white-space: normal; word-break: break-word; }
            .hs-heater-json-pre { margin: 0; }

            /* === Buttons & Interactive === */
            .hs-heater-copy-loadout-btn, .hs-heater-import-loadout-btn { cursor: pointer; padding: 4px 8px; font-size: 0.85em; }
            .hs-heater-json-tooltip-trigger { display: inline-block; cursor: help; user-select: none; }
            .hs-heater-preview-button { pointer-events: none; }

            /* === Status & Colors === */
            .hs-heater-status-maxed { color: #00b14a; }
            .hs-heater-status-unmaxed { color: #b18585; }

            /* === Icons & Preview === */
            .hs-heater-icon-image { display: block; margin: auto; }
            .hs-heater-loadout-preview { display: inline-block; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .hs-heater-preview-empty-cell { width: 32px; height: 32px; }

            /* === Section Groups === */
            .hs-heater-section-group { margin-bottom: 12px; }
        `;
    }

    static getHeaterOverlayStylesCss(): string {
        return `
            .hs-modal-body.hs-heater-scrollable {
                max-height: calc(100vh - 20px);
                overflow-y: auto;
            }
            .hs-heater-loadout-preview {
                position: fixed;
                z-index: 9999;
                background: rgba(0, 0, 0, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.35);
                box-shadow: 0 0 18px rgba(0, 0, 0, 0.75);
                padding: 8px;
                border-radius: 8px;
                display: grid;
                gap: 4px;
                max-width: 560px;
                pointer-events: none;
            }

            .hs-heater-loadout-json-tooltip {
                position: fixed;
                z-index: 9999;
                background: #1e1e1e;
                color: #e0e0e0;
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 4px;
                padding: 6px 8px;
                white-space: pre;
                font-family: monospace;
                font-size: 0.78em;
                max-height: 280px;
                overflow-y: auto;
                min-width: 220px;
                max-width: 480px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                pointer-events: none;
            }

            .hs-heater-loadout-preview-row {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .hs-heater-loadout-preview .blueberryUpgrade,
            .hs-heater-loadout-preview .redAmbrosiaUpgrade {
                width: 32px;
                height: 32px;
                min-width: 32px;
                min-height: 32px;
                padding: 0;
                border: none;
                background: none;
            }

            .hs-heater-loadout-preview .blueberryUpgrade img,
            .hs-heater-loadout-preview .redAmbrosiaUpgrade img,
            .hs-heater-loadout-preview .ambrosiaBorder img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                display: block;
            }

            .hs-heater-loadout-preview .level-overlay {
                font-size: 1em;
                line-height: 1;
                min-width: 1.2em;
                padding: 0 2px;
                background-color: transparent;
            }

            .hs-heater-loadout-preview .ambrosiaBorder {
                width: 32px;
                height: 32px;
            }
        `;
    }

    static ensureHeaterStylesInjected(): void {
        if (this.heaterStylesInjected) return;

        HSUI.injectStyle(`${this.getHeaterBaseStylesCss()}\n${this.getHeaterOverlayStylesCss()}`);
        this.heaterStylesInjected = true;
    }
}
