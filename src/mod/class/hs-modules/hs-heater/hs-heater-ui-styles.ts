import { HSUI } from "../../hs-core/hs-ui";

export class HSHeaterStyles {
    private static heaterStylesInjected = false;

    static getHeaterBaseStylesCss(): string {
        return `
            .hs-heater-inputs-body .hs-panel-btn {
                width: auto;
            }

            /* === Modal Layout === */
            .hs-modal-body.hs-heater-inputs-body {
                display: flex;
                gap: 14px;
                align-items: stretch;
                min-height: 0;
                overflow: hidden;
            }

            #hs-heater-inputs-body-left {
                flex: 1 1 auto;
                min-width: 100px;
                min-height: 0;
                max-height: 100%;
                overflow-y: auto;
            }

            #hs-heater-inputs-body-right {
                flex: 0 0 auto;
                display: flex;
                flex-direction: column;
                gap: 12px;
                min-height: 0;
                max-height: 100%;
                overflow-y: auto;
                padding-right: 6px;
            }

            /* === Shared Table Base Styles === */
            .hs-heater-input-table,
            .hs-heater-results-table,
            .hs-heater-subtable {
                border-collapse: collapse;
            }

            .hs-heater-input-table {
                table-layout: fixed;
            }

            .hs-heater-results-table,
            .hs-heater-subtable {
                table-layout: auto;
            }

            .hs-heater-input-table td, .hs-heater-input-table th,
            .hs-heater-results-table td, .hs-heater-results-table th,
            .hs-heater-subtable td, .hs-heater-subtable th {
                padding: 0px 2px;
                border: 1px solid rgba(255,255,255,0.08);
            }

            /* === Input Table Styles === */
            .hs-heater-input-table td,
            .hs-heater-input-table th {
                height: 20px;
                line-height: 20px;
                min-height: 20px;
            }

            .hs-heater-input-table td:first-child,
            .hs-heater-input-table th:first-child {
                width: auto;
                white-space: nowrap;
            }

            .hs-heater-input-table td:nth-child(2),
            .hs-heater-input-table th:nth-child(2) {
                width: 200px;
            }

            .hs-heater-input-table td:nth-child(3),
            .hs-heater-input-table th:nth-child(3) {
                width: auto;
                text-align: center;
            }

            .hs-heater-input-table input {
                width: 100%;
                min-width: 165px;
                box-sizing: border-box;
            }

            /* === Results Table Styles === */
            .hs-heater-results-table th:first-child,
            .hs-heater-results-table td:first-child {
                white-space: nowrap;
            }

            .hs-heater-results-table th:last-child,
            .hs-heater-results-table td:last-child {
                text-align: center;
            }

            .hs-heater-results-wrapper {
                overflow-x: auto;
            }

            .hs-heater-results-header {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                box-sizing: border-box;
                margin-left: auto;
                margin-right: auto;
            }

            .hs-heater-results-header > * {
                align-self: center;
                margin-top: 0;
                margin-bottom: 0;
            }

            /* === Results & Subtable Styles === */
            .hs-heater-results-table td, .hs-heater-results-table th,
            .hs-heater-subtable td, .hs-heater-subtable th {
                padding: 0px 8px;
                text-align: center;
            }

            .hs-heater-subtable th:last-child,
            .hs-heater-subtable td:last-child {
                text-align: center;
            }

            /* === Input Controls === */
            .hs-heater-select-input {
                width: 100%;
                height: 20px;
                background-color: black;
                color: white;
            }

            .hs-heater-percent-input-wrap {
                display: inline-flex;
                align-items: center;
                gap: 2px;
                width: 100%;
            }

            /* === Lock Button === */
            .hs-heater-lock-button {
                border: none;
                background: transparent;
                cursor: pointer;
                padding: 0;
            }

            .hs-heater-lock-button:hover {
                transform: scale(1.05);
            }

            .hs-heater-lock-cell-locked {
                background: rgba(179, 25, 25, 0.58);
            }

            /* === Grid & Layout === */
            .hs-heater-active-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 2px;
            }

            .hs-heater-active-label {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .hs-heater-loadout-buttons {
                display: flex;
                align-items: center;
                gap: 2px;
                flex-wrap: nowrap;
            }

            /* === Type Selector Styles === */
            .hs-heater-inputs-title {
                font-weight: 700;
                text-align: left;
            }

            .hs-heater-type-selects-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 4px;
            }

            .hs-heater-type-select-row {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .hs-heater-type-select-loadout-label {
                width: 24px;
                min-width: 24px;
                text-align: center;
                font-weight: 600;
            }

            .hs-heater-type-select-icon {
                background-repeat: no-repeat;
                background-size: 80%;
                background-position: center;
                height: 30px;
                width: 30px;
                border: 2px solid blue;
                pointer-events: none;
                outline: none;
            }

            #hs-heater-inputs-body-left input[type="checkbox"] {
                accent-color: #a22a2a;
            }

            .hs-heater-type-select {
                flex: 1 1 auto;
                min-width: 100px;
                height: 22px;
                background-color: black;
                color: white;
            }

            .hs-heater-type-select-checkbox {
                width: 16px;
                height: 16px;
                margin-left: 6px;
                cursor: pointer;
                accent-color: #0505ad;
                box-sizing: border-box;
                padding: 0;
                border: 0;
                flex-shrink: 0;
            }

            .hs-heater-active-checkbox {
                width: 16px;
                height: 16px;
                cursor: pointer;
                accent-color: #a22a2a;
                box-sizing: border-box;
                padding: 0;
                border: 0;
                flex-shrink: 0;
            }

            /* === Typography & Text === */
            .hs-heater-title-row {
                font-weight: bold;
                text-align: center;
                padding: 4px 2px;
                background: rgba(255,255,255,0.05);
            }

            .hs-heater-header-row {
                background: rgba(100,100,100,0.2);
            }

            .hs-heater-result-cell {
                white-space: normal;
                word-break: break-word;
            }

            .hs-heater-json-pre {
                margin: 0;
            }

            .hs-heater-results-table td:has(.hs-heater-type-icon),
            .hs-heater-subtable td:has(.hs-heater-type-icon) {
                display: flex;
                align-items: center;
                gap: 0;
            }

            .hs-heater-type-label {
                flex: 1;
                text-align: center;
                box-sizing: border-box;
                padding: 0 18px;
            }

            .hs-heater-type-icon {
                flex-shrink: 0;
                width: 25px;
                height: 25px;
                object-fit: contain;
                pointer-events: none;
            }

            /* === Buttons & Interactive === */
            .hs-heater-copy-loadout-btn,
            .hs-heater-import-loadout-btn {
                cursor: pointer;
                padding: 4px 8px;
                font-size: 0.85em;
                border: 2px solid transparent;
            }

            .hs-heater-json-tooltip-trigger {
                display: inline-block;
                cursor: help;
                user-select: none;
            }

            /* === Status & Colors === */
            .hs-heater-status-maxed { color: #00b14a; }
            .hs-heater-status-unmaxed { color: #b18585; }

            .redButton { background-color: #3f0101; }
            .redButton:hover { background-color: #b71919; }
            .blueButton { background-color: #05013f; }
            .blueButton:hover { background-color: #291ece; }

            /* === Icons & Preview === */
            .hs-heater-icon-image {
                display: block;
                margin: auto;
            }
        `;
    }

    static getHeaterOverlayStylesCss(): string {
        return `
            /* === Floating Preview Container (base) === */
            #hs-heater-loadout-preview {
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

            /* === Floating Preview Rows (base) === */
            .hs-heater-loadout-preview-row {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-bottom: 4px;
            }

            /* === Floating Preview Item/Button === */
            .hs-heater-preview-button {
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
                pointer-events: none;
            }

            .hs-heater-preview-button img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            /* === Floating Preview Empty Placeholder === */
            .hs-heater-preview-empty-cell {
                width: 32px;
                height: 32px;
                background: rgba(100, 100, 100, 0.3);
                border-radius: 2px;
            }

            /* === JSON Tooltip (by id) === */
            #hs-heater-loadout-json-tooltip {
                position: fixed;
                z-index: 9999;
                background: #1e1e1e;
                color: #e0e0e0;
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 4px;
                padding: 6px 8px;
                white-space: pre-wrap;
                word-break: break-word;
                font-family: monospace;
                font-size: 0.78em;
                max-width: 480px;
                max-height: 280px;
                overflow-y: auto;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            }
        `;
    }

    static ensureHeaterStylesInjected(): void {
        if (this.heaterStylesInjected) return;

        HSUI.injectStyle(`${this.getHeaterBaseStylesCss()}\n${this.getHeaterOverlayStylesCss()}`);
        this.heaterStylesInjected = true;
    }
}
