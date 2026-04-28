import { HeaterExportData, HeaterPreviewResult, HeaterSheetData, HeaterOptimizerInput, HeaterOptimizationResult } from "../../../types/data-types/hs-heater-types";

export class HSHeaterAPI {
    static getHeaterExportField(data: HeaterExportData | undefined, ...path: Array<string | number>): unknown {
        if (!data) return undefined;

        return path.reduce((current: any, key: string | number) => {
            if (current === undefined || current === null) return undefined;
            if (typeof key === 'number') {
                return Array.isArray(current) ? current[key] : undefined;
            }
            return current[key];
        }, data as any);
    }

    static serializeHeaterExport(data: HeaterExportData): string {
        return JSON.stringify(data);
    }

    static serializeHeaterExportToBase64(data: HeaterExportData): string {
        return this.stringToBase64(JSON.stringify(data));
    }

    static deserializeHeaterExport(serialized: string): HeaterExportData | undefined {
        try {
            const parsed = JSON.parse(serialized);
            return this.isValidHeaterExport(parsed) ? parsed : undefined;
        } catch {
            return undefined;
        }
    }

    static deserializeHeaterExportFromBase64(serialized: string): HeaterExportData | undefined {
        try {
            const json = this.base64ToString(serialized);
            return this.deserializeHeaterExport(json);
        } catch {
            return undefined;
        }
    }

    static isValidHeaterExport(data: unknown): data is HeaterExportData {
        if (!data || typeof data !== 'object') return false;
        const candidate = data as Partial<HeaterExportData>;
        const hsData = candidate.hs_data as Partial<HeaterSheetData> | undefined;
        if (!hsData || typeof hsData !== 'object') return false;

        const requiredNumericFields = [
            'lifeTimeAmbrosia',
            'lifeTimeRedAmbrosia',
            'quarks',
            'platonic4x4',
            'baseLuck',
            'luckMult',
            'totalLuck',
            'trueBaseLuck',
            'redAmbrosiaLuck',
            'luckConversion',
            'totalCubes',
            'effectiveSingularity',
            'transcription',
            'ascSpeed',
            'ascSpeed2',
            'blueberries',
            'bonusRow2',
            'bonusRow3',
            'bonusRow4',
            'bonusRow5',
            'spread',
            'totalInfinityVouchers',
            'baseTalismanPower',
            'sirc',
            'bonussi',
            'totalbonusia',
            'talismanbonusia',
            'blueAmbrosiaBarValue',
            'redAmbrosiaBarValue',
            'blueAmbrosiaBarMax',
            'redAmbrosiaBarMax',
            'ambrosiaSpeedMult',
            'ambrosiaSpeed',
            'ambrosiaGainChance',
            'trueAmbrosiaGainChance',
            'ambrosiaAcceleratorCount',
        ] as const;

        for (const field of requiredNumericFields) {
            if (typeof (hsData as any)[field] !== 'number') {
                return false;
            }
        }

        if (typeof hsData.isInsideSingularityChallenge !== 'boolean') return false;

        return true;
    }

    static createHeaterSheetData(data: HeaterExportData): HeaterSheetData {
        return {
            lifeTimeAmbrosia: data.hs_data.lifeTimeAmbrosia,
            lifeTimeRedAmbrosia: data.hs_data.lifeTimeRedAmbrosia,
            quarks: data.hs_data.quarks,
            platonic4x4: data.hs_data.platonic4x4,
            baseLuck: data.hs_data.baseLuck,
            luckMult: data.hs_data.luckMult,
            totalLuck: data.hs_data.totalLuck,
            trueBaseLuck: data.hs_data.trueBaseLuck,
            totalCubes: data.hs_data.totalCubes,
            effectiveSingularity: data.hs_data.effectiveSingularity,
            transcription: data.hs_data.transcription,
            ascSpeed: data.hs_data.ascSpeed,
            ascSpeed2: data.hs_data.ascSpeed2,
            blueberries: data.hs_data.blueberries,
            bonusRow2: data.hs_data.bonusRow2,
            bonusRow3: data.hs_data.bonusRow3,
            bonusRow4: data.hs_data.bonusRow4,
            bonusRow5: data.hs_data.bonusRow5,
            spread: data.hs_data.spread,
            totalInfinityVouchers: data.hs_data.totalInfinityVouchers,
            tokens: data.hs_data.tokens,
            maxTokens: data.hs_data.maxTokens,
            isAtMaxTokens: data.hs_data.isAtMaxTokens,
            isEvent: data.hs_data.isEvent,
            bellStacks: data.hs_data.bellStacks,
            personalQuarkBonus: data.hs_data.personalQuarkBonus,
            isInsideSingularityChallenge: data.hs_data.isInsideSingularityChallenge,
            blueAmbrosiaBarValue: data.hs_data.blueAmbrosiaBarValue,
            redAmbrosiaBarValue: data.hs_data.redAmbrosiaBarValue,
            blueAmbrosiaBarMax: data.hs_data.blueAmbrosiaBarMax,
            redAmbrosiaBarMax: data.hs_data.redAmbrosiaBarMax,
            ambrosiaSpeedMult: data.hs_data.ambrosiaSpeedMult,
            baseTalismanPower: data.hs_data.baseTalismanPower,
            sirc: data.hs_data.sirc,
            bonussi: data.hs_data.bonussi,
            totalbonusia: data.hs_data.totalbonusia,
            talismanbonusia: data.hs_data.talismanbonusia,
            ambrosiaSpeed: data.hs_data.ambrosiaSpeed,
            ambrosiaGainChance: data.hs_data.ambrosiaGainChance,
            trueAmbrosiaGainChance: data.hs_data.trueAmbrosiaGainChance,
            ambrosiaAcceleratorCount: data.hs_data.ambrosiaAcceleratorCount,
            redAmbrosiaLuck: data.hs_data.redAmbrosiaLuck,
            luckConversion: data.hs_data.luckConversion,
            pseudoCoinUpgrades: data.hs_data.pseudoCoinUpgrades,
        };
    }

    static createHeaterPreview(data: HeaterExportData): HeaterPreviewResult {
        const sheetData = this.createHeaterSheetData(data);
        const estimatedAmbrosiaRate = sheetData.ambrosiaSpeed;
        const estimatedBlueAmbrosiaBarRemaining = Math.max(0, sheetData.blueAmbrosiaBarMax - sheetData.blueAmbrosiaBarValue);
        const estimatedRedAmbrosiaBarRemaining = Math.max(0, sheetData.redAmbrosiaBarMax - sheetData.redAmbrosiaBarValue);
        const estimatedBlueAmbrosiaFillTimeSeconds = estimatedAmbrosiaRate > 0 ? estimatedBlueAmbrosiaBarRemaining / estimatedAmbrosiaRate : Number.POSITIVE_INFINITY;
        const estimatedRedAmbrosiaFillTimeSeconds = estimatedAmbrosiaRate > 0 ? estimatedRedAmbrosiaBarRemaining / estimatedAmbrosiaRate : Number.POSITIVE_INFINITY;
        const blueAmbrosiaBarProgress = sheetData.blueAmbrosiaBarMax > 0 ? sheetData.blueAmbrosiaBarValue / sheetData.blueAmbrosiaBarMax : 0;
        const redAmbrosiaBarProgress = sheetData.redAmbrosiaBarMax > 0 ? sheetData.redAmbrosiaBarValue / sheetData.redAmbrosiaBarMax : 0;

        return {
            sheetData,
            estimatedAmbrosiaRate,
            estimatedBlueAmbrosiaBarRemaining,
            estimatedRedAmbrosiaBarRemaining,
            estimatedBlueAmbrosiaFillTimeSeconds,
            estimatedRedAmbrosiaFillTimeSeconds,
            blueAmbrosiaBarProgress,
            redAmbrosiaBarProgress,
        };
    }

    static createHeaterOptimizerInput(data: HeaterExportData): HeaterOptimizerInput {
        return {
            amb: data.hs_data.lifeTimeAmbrosia,
            quark: data.hs_data.quarks,
            plat4x4: data.hs_data.platonic4x4,
            baseluck: data.hs_data.baseLuck,
            multluck: data.hs_data.luckMult,
            cube: data.hs_data.totalCubes,
            singularity: data.hs_data.effectiveSingularity,
            exalt: data.hs_data.isInsideSingularityChallenge ? 1 : 0,
            postaoag: data.runes?.antiquities ? 1 : 0,
            transcription: data.hs_data.transcription,
            ascspeed1: data.hs_data.ascSpeed,
            ascspeed2: data.hs_data.ascSpeed2,
            spread: data.hs_data.spread,
            voucher: data.hs_data.totalInfinityVouchers,
            baseobt: Math.max(1, data.hs_data.pseudoCoinUpgrades.baseObtainiumBuffLevel * 3),
            baseoff: Math.max(1, data.hs_data.pseudoCoinUpgrades.baseOfferingBuffLevel * 6),
            bb: data.hs_data.blueberries,
            btp: data.hs_data.baseTalismanPower,
            bonusRow2: data.hs_data.bonusRow2,
            bonusRow3: data.hs_data.bonusRow3,
            bonusRow4: data.hs_data.bonusRow4,
            bonusRow5: data.hs_data.bonusRow5,
            ramb: data.hs_data.lifeTimeRedAmbrosia,
            runeexp: Array.isArray(data.runeexp) && data.runeexp.length > 0 ? data.runeexp[0] : 0,
            sirc: data.hs_data.sirc,
            bonussi: data.hs_data.bonussi,
            totalbonusia: data.hs_data.totalbonusia,
            talismanbonusia: data.hs_data.talismanbonusia,
            noSingularityUpgradesCompletions: data.singularityChallenges?.noSingularityUpgrades?.completions ?? 0,
            noAmbrosiaUpgradesCompletions: data.singularityChallenges?.noAmbrosiaUpgrades?.completions ?? 0,
            active: Array(8).fill(true),
        };
    }

    static createHeaterOptimizerResult(data: HeaterExportData): HeaterOptimizationResult {
        return this.createHeaterOptimizerResultFromInput(this.createHeaterOptimizerInput(data));
    }

    static createHeaterOptimizerResultFromInput(input: HeaterOptimizerInput): HeaterOptimizationResult {
        const {
            amb,
            quark,
            plat4x4,
            baseluck,
            multluck,
            cube,
            singularity,
            exalt,
            postaoag,
            transcription,
            ascspeed1,
            ascspeed2,
            spread,
            voucher,
            baseobt,
            baseoff,
            bb,
            ramb,
            runeexp,
            sirc,
            bonussi,
            totalbonusia,
            talismanbonusia,
            btp,
            noSingularityUpgradesCompletions,
            noAmbrosiaUpgradesCompletions,
            active,
        } = input;

        const noSingularityChallengeCompleted = noSingularityUpgradesCompletions > 0;
        const noAmbrosiaChallengeCompleted = noAmbrosiaUpgradesCompletions > 0;

        const notes: string[] = [];
        if (sirc === 1 || bonussi === 0 || totalbonusia === 0 || talismanbonusia === 0 || btp === 1) {
            notes.push('Some advanced talisman / rune intelligence values were approximated from available export data.');
        }

        const module_name = [
            'ambrosiaTutorial','ambrosiaPatreon','ambrosiaObtainium1','ambrosiaOffering1','ambrosiaHyperflux','ambrosiaQuarks1','ambrosiaCubes1','ambrosiaLuck1','ambrosiaCubeQuark1','ambrosiaLuckQuark1','ambrosiaLuckCube1','ambrosiaQuarkCube1','ambrosiaCubeLuck1','ambrosiaQuarkLuck1','ambrosiaQuarks2','ambrosiaCubes2','ambrosiaLuck2','ambrosiaQuarks3','ambrosiaCubes3','ambrosiaLuck3','ambrosiaBaseObtainium1','ambrosiaBaseOffering1','ambrosiaBaseObtainium2','ambrosiaBaseOffering2','ambrosiaSingReduction1','ambrosiaSingReduction2','ambrosiaInfiniteShopUpgrades1','ambrosiaInfiniteShopUpgrades2','ambrosiaLuck4','ambrosiaTalismanBonusRuneLevel','ambrosiaRuneOOMBonus','ambrosiaFreeLuckUpgrades','ambrosiaFreeGenerationUpgrades','ambrosiaFreeRedLuckUpgrades','ambrosiaFreeQuarkUpgrades'
        ];
        const loadout_length = module_name.length;
        const true_base_tree = Array.from({ length: loadout_length }, (_, i) => Math.floor(Math.pow(10, 1 - i)));
        const max_level = [10,1,2,2,7,100,100,100,25,25,25,25,25,25,100,100,100,10,100,100,20,40,30,60,2,2,20,20,50,100,100,25,3,40,10];
        const bonus = [[input.bonusRow2], [input.bonusRow3], [input.bonusRow4], [input.bonusRow5]];
        const activeFlags = input.active;
        const obtofoff = [0,0,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,1,2,3,3,3,3,0,3,3,0,0,0,0];
        const bonus_level = [-1,-1,-1,-1,-1,0,0,0,1,1,1,1,1,1,2,2,2,3,3,3,-1,-1,-1,-1,-1,-1,-1,-1,3,-1,2,-1,-1,-1,-1];
        const alt_level_list = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,6,7,14,15,16,0,0,0,0,0,0,0,26,0,0,0,0,0,0,0];
        let force_tree = new Array(loadout_length).fill(0);
        let l4_digits = 2 + Math.floor(Math.log10(Math.max(1, amb))) + Math.floor(Math.log10(Math.max(1, ramb)));
        const originalIAtotal = Math.floor((runeexp - 75) * (0.5 + 0.001 * bonus[2][0])) + totalbonusia;
        const originalSItotal = Math.floor((runeexp - 12) * sirc) + bonussi;
        let greater_than_1 = 1 - 2 * (ascspeed1 < 1 ? 1 : 0);
        let reduced_asc = Math.pow(Math.pow(ascspeed1, 1 / (1 + spread * greater_than_1)), greater_than_1);
        let luck_zero = 0;

        function singDebuff(singnum: number): [number, number] {
            function effectiveSing(sing: number): number {
                let eff = sing * Math.min(4.75, 0.75 * sing / 10 + 1);
                if (sing > 10) { eff *= 1.5 * Math.min(4, 1.25 * sing / 10 - 0.25); }
                if (sing > 25) { eff *= 2.5 * Math.min(6, 1.5 * sing / 25 - 0.5); }
                if (sing > 36) { eff *= 4 * Math.min(5, sing / 18 - 1) * Math.pow(1.1, Math.min(sing - 36, 64)); }
                if (sing > 50) { eff *= 5 * Math.min(8, 2 * sing / 50 - 1) * Math.pow(1.1, Math.min(sing - 50, 50)); }
                if (sing > 100) { eff *= 2 * sing / 25 * Math.pow(1.1, sing - 100); }
                if (sing > 150) { eff *= 2 * Math.pow(1.05, sing - 150); }
                if (sing > 200) { eff *= 1.5 * Math.pow(1.275, sing - 200); }
                if (sing > 215) { eff *= 1.25 * Math.pow(1.2, sing - 215); }
                if (sing > 230) { eff *= 2; }
                if (sing > 269) { eff *= Math.pow(3, Math.max(0, sing - 269) + 1); }
                return eff;
            }
            const effSing = effectiveSing(singnum);
            let cubemult = 1;
            if (singnum < 150) {
                cubemult *= 1 + Math.sqrt(effSing) / 5;
            } else {
                cubemult *= 1 + Math.pow(effSing, 0.75) / 10000;
            }
            let temp = 1;
            if (singnum >= 100) {
                temp = Math.pow(1.02, singnum - 100);
            }
            if (singnum < 150) {
                cubemult *= 1 + (Math.sqrt(effSing) * temp / 4);
            } else {
                cubemult *= 1 + (Math.pow(effSing, 0.75) * temp / 1000);
            }
            let omult = Math.pow(1.02, singnum);
            if (singnum < 150) {
                omult *= Math.sqrt(effSing + 1);
            } else {
                omult *= Math.pow(effSing, 2 / 3) / 400;
            }
            omult *= 1 + Math.sqrt(effSing) / 4;
            return [cubemult, omult];
        }

        function singReductionEffect(singnum: number, count: number): [number, number] {
            const base = singDebuff(singnum);
            const previous = singDebuff(singnum - count);
            return [base[0] / previous[0], base[1] / previous[1]];
        }

        function deltaIA(ctype: number, delta: number): number {
            let newIAtotal = -1;
            if (ctype === 1) {
                newIAtotal = originalIAtotal + talismanbonusia * delta / btp;
            } else if (ctype === 2) {
                newIAtotal = Math.floor((runeexp - 75) * (0.5 + delta)) + totalbonusia;
            }
            return newIAtotal - originalIAtotal;
        }

        function changeinIA(ctype: number, delta: number): [number, number] {
            let newIAtotal = -1;
            if (ctype === 1) {
                newIAtotal = originalIAtotal + talismanbonusia * delta / btp;
            } else if (ctype === 2) {
                newIAtotal = Math.floor((runeexp - 75) * (0.5 + delta)) + totalbonusia;
            }
            const qchange = (500 + newIAtotal) / (500 + originalIAtotal);
            const cchange = (100 + newIAtotal) / (100 + originalIAtotal);
            return [qchange, cchange];
        }

        function talismanO(delta: number): number {
            const newbonusSI = bonussi * delta / btp;
            return 1 + newbonusSI / originalSItotal;
        }

        function rcmO(level: number): number {
            const newSI = Math.floor((runeexp - 12) * (sirc + level - bonus[2][0])) + bonussi;
            return newSI / originalSItotal;
        }

        const ambrosiaPrerequisites: Record<number, Record<number, number>> = {
            1: { 0: 10 },
            2: { 0: 10 },
            3: { 0: 10 },
            5: { 0: 10 },
            6: { 0: 10 },
            7: { 0: 10 },
            8: { 6: 30, 5: 20 },
            9: { 5: 30, 7: 20 },
            10: { 7: 30, 6: 20 },
            11: { 6: 30, 5: 20 },
            12: { 7: 30, 6: 20 },
            13: { 5: 30, 7: 20 },
            14: { 5: 40 },
            15: { 6: 40 },
            16: { 7: 40 },
            17: { 5: 100, 14: 50 },
            18: { 6: 100, 15: 50 },
            19: { 7: 90, 16: 50 },
            22: { 20: 15, 21: 20 },
            23: { 21: 30, 20: 10 },
            24: { 4: 4 },
            26: { 6: 70, 21: 20, 20: 10 },
            27: { 26: 20, 15: 50, 23: 20, 22: 10 },
            33: { 31: 10 }
        };

        function isUpgradeUnlocked(upgrade: number, level: number, loadout?: number[]): boolean {
            if (level <= 0) {
                return true;
            }

            if (upgrade === 31 || upgrade === 32) {
                return noSingularityChallengeCompleted;
            }
            if (upgrade === 33) {
                return noAmbrosiaChallengeCompleted && (loadout ? (loadout[31] ?? 0) >= 10 : true);
            }
            if (upgrade === 34) {
                return noAmbrosiaChallengeCompleted;
            }

            if (!loadout) {
                return true;
            }

            const prereq = ambrosiaPrerequisites[upgrade];
            if (!prereq) {
                return true;
            }

            for (const [reqKey, requiredLevel] of Object.entries(prereq)) {
                const prereqUpgrade = Number(reqKey);
                if ((loadout[prereqUpgrade] ?? 0) < requiredLevel) {
                    return false;
                }
            }

            return true;
        }

        function calculateCost(upgrade: number, level: number, loadout?: number[]): number {
            if (typeof level !== 'number' || !Number.isFinite(level) || level < 0) {
                return Number.POSITIVE_INFINITY;
            }
            if (!isUpgradeUnlocked(upgrade, level, loadout)) {
                return Number.POSITIVE_INFINITY;
            }
            switch (upgrade) {
                case 0: return 10 * level;
                case 1: return level;
                case 2: return level === 0 ? 0 : level === 1 ? 50000 : 1300000;
                case 3: return level === 0 ? 0 : level === 1 ? 50000 : 1300000;
                case 4: {
                    switch (level) {
                        case 0: return 0;
                        case 1: return 33333;
                        case 2: return 99999;
                        case 3: return 199998;
                        case 4: return 333330;
                        case 5: return 499995;
                        case 6: return 999990;
                        case 7: return 2499975;
                        default: return 1e9;
                    }
                }
                case 5: return Math.pow(level, 3);
                case 6: return Math.pow(level, 3);
                case 7: return Math.pow(level, 3);
                case 8: return Math.pow(level, 3) * 500;
                case 9: return Math.pow(level, 3) * 500;
                case 10: return Math.pow(level, 3) * 250;
                case 11: return Math.pow(level, 3) * 250;
                case 12: return Math.pow(level, 3) * 100;
                case 13: return Math.pow(level, 3) * 100;
                case 14: return Math.pow(level, 2) * 500;
                case 15: return Math.pow(level, 2) * 500;
                case 16: return Math.pow(level, 2) * 250;
                case 17: return level * (1450000 + 50000 * level) / 2;
                case 18: return level * (145000 + 5000 * level) / 2;
                case 19: return level * 50000;
                case 20: return Math.pow(level, 3) * 40;
                case 21: return Math.pow(level, 3) * 5;
                case 22: return Math.pow(level, 3) * 160;
                case 23: return Math.pow(level, 3) * 20;
                case 24: return 100000 * (Math.pow(99, level) - 1) / 98;
                case 25: return Math.pow(level, 2) * 12500000;
                case 26: return level * 25000;
                case 27: return level * 75000;
                case 28: return (480000 + 20000 * level) * level / 2;
                case 29: return 100 * level * level;
                case 30: return rcmcost[level];
                case 31: return 5000 * (2 * level + 1);
                case 32: return level > 0 ? 5000 * 9 * Math.pow(10, level - 1) : 0;
                case 33: return 10000 * (2 * level + 1);
                case 34: return 25000 * (Math.pow(level + 1, 3) - Math.pow(level, 3));
                default: return NaN;
            }
        }

        function calculateLoadoutCost(Loadout: number[]): number {
            if (!Array.isArray(Loadout)) {
                return -1;
            }
            return Loadout.reduce((sum, level, index) => sum + calculateCost(index, level, Loadout), 0);
        }

        function safeVectorValue(vector: any[], index: number): number {
            return Array.isArray(vector) && Number.isFinite(vector[index]) ? vector[index] : 0;
        }

        function isLoadoutValid(loadout: number[]): boolean {
            return calculateLoadoutCost(loadout) !== Number.POSITIVE_INFINITY;
        }

        function buildLuckLoadout(baseTree: number[], vector: any[]): number[] {
            const loadout = [...baseTree];
            loadout[7] = safeVectorValue(vector, 0);
            loadout[16] = safeVectorValue(vector, 1);
            loadout[19] = safeVectorValue(vector, 2);
            loadout[10] = safeVectorValue(vector, 3);
            loadout[11] = safeVectorValue(vector, 4);
            loadout[28] = safeVectorValue(vector, 5);
            return loadout;
        }

        function calculateTrueEffect(upgrade: number, level: number, luck: number, altlevel: number): [number, number, number, number, number, number] {
            switch (upgrade) {
                case 0: return [0, 1 + 0.01 * level, 1 + 0.05 * level, 1 + 0.05 * level, 0, 1];
                case 1: return [0, 1, 1, 1, 0, 1];
                case 2: return [0, 1, 1, 1, 0, 1 + 0.001 * level * luck];
                case 3: return [0, 1, 1, 1, 0, 1 + 0.001 * level * luck];
                case 4: return [0, 1, Math.pow(1 + level * 0.01, plat4x4), 1, 0, 1];
                case 5: return [0, 1 + 0.01 * level, 1, 1, 0, 1];
                case 6: return [0, (1 + 0.05 * level) * Math.pow(1.1, Math.floor(level / 5)), (1 + 0.05 * level) * Math.pow(1.1, Math.floor(level / 5)), 0, 0, 1];
                case 7: return [2 * level + 12 * Math.floor(level / 10), 1, 1, 1, 0, 1];
                case 8: return [0, 1 + 0.0001 * level * cube, 1, 1, 0, 1];
                case 9: return [0, 1 + 0.0001 * level * Math.min(luck, Math.pow(1000 * luck, 0.5)), 1, 1, 0, 1];
                case 10: return [0, 1, 1 + 0.0005 * level * luck, 1 + 0.0005 * level * luck, 0, 1];
                case 11: return [0, 1, 1 + 0.001 * level * quark, 1 + 0.001 * level * quark, 0, 1];
                case 12: return [0.02 * level * cube, 1, 1, 1, 0, 1];
                case 13: return [0.02 * level * quark, 1, 1, 1, 0, 1];
                case 14: return [0, 1 + level * (0.01 + Math.floor(altlevel / 10) / 1000), 1, 1, 0, 1];
                case 15: return [0, 1, (1 + level * (0.1 + 0.01 * Math.floor(altlevel / 10))) * Math.pow(1.15, Math.floor(level / 5)), (1 + level * (0.1 + 0.01 * Math.floor(altlevel / 10))) * Math.pow(1.15, Math.floor(level / 5)), 0, 1];
                case 16: return [level * (3 + 0.3 * Math.floor(altlevel / 10)) + 40 * Math.floor(level / 10), 1, 1, 1, 0, 1];
                case 17: return [0, 1 + 0.05 * level * (1 + 0.01 * altlevel), 1, 1, 0, 1];
                case 18: return [0, 1, (1 + 0.2 * level * (1 + 0.03 * altlevel)) * Math.pow(1.2, Math.floor(level / 5)), (1 + 0.2 * level * (1 + 0.03 * altlevel)) * Math.pow(1.2, Math.floor(level / 5)), 0, 1];
                case 19: return [level * bb, 1, 1, 1, 0, 1];
                case 20: return [0, 1, 1, 1, level, 1];
                case 21: return [0, 1, 1, 1, level, 1];
                case 22: return [0, 1, 1, 1, level, 1];
                case 23: return [0, 1, 1, 1, level, 1];
                case 24: return [0, 1, singReductionEffect(singularity, level)[0], singReductionEffect(singularity, level)[0], 0, singReductionEffect(singularity, level)[1]];
                case 25: return [0, 1, singReductionEffect(singularity, level)[0], singReductionEffect(singularity, level)[0], 0, singReductionEffect(singularity, level)[1]];
                case 26: {
                    const localGreaterThanOne = 1 - 2 * (ascspeed1 < 1 ? 1 : 0);
                    const localReducedAsc = Math.pow(Math.pow(ascspeed1, 1 / (1 + spread * localGreaterThanOne)), localGreaterThanOne);
                    return [0, 1, Math.pow(1.012 * Math.pow(1.006, (1 + spread * localGreaterThanOne)), level) * Math.pow(localReducedAsc * Math.pow(1.006, level), 0.001 * (Math.floor((voucher + level) / 40) - Math.floor(voucher / 40))), Math.pow(1.012, level * 1.25) * Math.pow(Math.pow(1.006, level * (1 + spread * localGreaterThanOne)) * Math.pow(localReducedAsc * Math.pow(1.006, level), 0.001 * (Math.floor((voucher + level) / 40) - Math.floor(voucher / 40))), transcription), 0, Math.pow(1.012, level) * Math.pow(1.06, Math.floor((voucher + level) / 25) - Math.floor(voucher / 25))];
                }
                case 27: {
                    const localGreaterThanOne = 1 - 2 * (ascspeed1 < 1 ? 1 : 0);
                    const localReducedAsc = Math.pow(Math.pow(ascspeed1, 1 / (1 + spread * localGreaterThanOne)), localGreaterThanOne);
                    return [0, 1, Math.pow(1.012 * Math.pow(1.006, (1 + spread * localGreaterThanOne)), level) * Math.pow(localReducedAsc * Math.pow(1.006, level), 0.001 * (Math.floor((voucher + level + altlevel) / 40) - Math.floor((voucher + altlevel) / 40))), Math.pow(1.012, level * 1.25) * Math.pow(Math.pow(1.006, level * (1 + spread * localGreaterThanOne)) * Math.pow(localReducedAsc * Math.pow(1.006, level), 0.001 * (Math.floor((voucher + level + altlevel) / 40) - Math.floor((voucher + altlevel) / 40))), transcription), 0, Math.pow(1.012, level) * Math.pow(1.06, Math.floor((voucher + level + altlevel) / 25) - Math.floor((voucher + altlevel) / 25))];
                }
                case 28: return [0.0001 * l4_digits * level, 1, 1, 1, 0, 1];
                case 29: {
                    const [qchange] = changeinIA(1, 0.005 * level);
                    const [cchange] = changeinIA(1, 0.005 * level);
                    return [0, qchange, cchange, 1, 0, talismanO(0.005 * level)];
                }
                case 30: return [0, changeinIA(2, 0.001 * level)[0], changeinIA(2, 0.001 * level)[1], 1, 0, rcmO(level)];
                case 31: return [6.6 * level, 1, 1, 1, 0, 1];
                case 32: return [0, 1 + level / 100, 1 + level / 100, 1 + level / 100, 0, 1];
                case 33: return [0, 1, 1, 1, 0, 1];
                case 34: return [0, 1 + 0.05 * level, 1, 1, 0, 1];
                default: return [0, 1, 1, 1, 0, 1];
            }
        }

        function calculateEffect(upgrade: number, level: number, luck: number, altlevel: number): [number, number, number, number, number, number] {
            let transfer_level = level;
            if (bonus_level[upgrade] !== -1) {
                transfer_level += bonus[bonus_level[upgrade]][0];
            }
            return calculateTrueEffect(upgrade, transfer_level, luck, altlevel);
        }

        function calculateLoadoutEffect(Loadout: number[]): [number, number, number, number, number, number, number, number] {
            let e_luck = baseluck - luck_zero;
            let m_luck = multluck;
            const levels = [...Loadout];
            if (Array.isArray(levels)) {
                for (let i = 0; i < levels.length; i++) {
                    const a = calculateEffect(i, levels[i], baseluck, levels[alt_level_list[i]])[0];
                    e_luck += a * (i !== 28 ? 1 : 0);
                    m_luck += a * (i === 28 ? 1 : 0);
                }
                e_luck *= 1 + m_luck;
                let e_quark = 1;
                let e_cube = 1;
                let e_oct = 1;
                let a_obt = 0;
                let a_off = 0;
                let m_obt = 1;
                let m_off = 1;
                for (let i = 0; i < levels.length; i++) {
                    const [a, b, c, d, e, f] = calculateEffect(i, levels[i], e_luck, levels[alt_level_list[i]]);
                    e_quark *= b;
                    e_cube *= c;
                    e_oct *= d;
                    if (obtofoff[i] % 2 === 1) {
                        a_obt += e;
                        m_obt *= f;
                    }
                    if (obtofoff[i] > 1) {
                        a_off += e;
                        m_off *= f;
                    }
                }
                return [e_luck, e_quark, e_cube, e_oct, a_obt, a_off, m_obt, m_off];
            }
            return [-1, -1, -1, -1, -1, -1, -1, -1];
        }

        function Matrix_assembly(full_matrix: any[]): any[] {
            full_matrix.sort((x, y) => ((x[1] === y[1]) ? (y[2] - x[2]) : (x[1] - y[1])));
            const matrix: any[] = [full_matrix[0]];
            let lst = 0;
            for (let i = 1; i < full_matrix.length; i++) {
                if (full_matrix[i][2] > full_matrix[lst][2]) {
                    lst = i;
                    matrix.push(full_matrix[i]);
                }
            }
            return matrix;
        }

        function arrayToText(Loadout: number[]): string {
            return '{' + Loadout.map((value, index) => `"${module_name[index]}":${value}`).join(',') + '}';
        }

        const rcmcost: number[] = [0];
        function calculateRCMcost(): void {
            for (let i = 1; i <= 100; i++) {
                const delta = Math.ceil(2500 * (Math.pow(i, 1.5) - Math.pow(i - 1, 1.5)));
                rcmcost.push(rcmcost[i - 1] + delta);
            }
        }
        calculateRCMcost();

        function Q_I_matrix_generator(): any[] {
            const full_matrix: any[] = [];
            for (let a = 0; a <= 100; a++) {
                for (let d = 0; d <= 100 * (a >= 40 ? 1 : 0); d++) {
                    const cost = Math.pow(a, 3) + 500 * Math.pow(d, 2);
                    const effect = (1 + 0.01 * (a + bonus[0][0])) * (1 + (d + bonus[2][0]) * (0.01 + Math.floor((a + bonus[0][0]) / 10) / 1000));
                    full_matrix.push([[a, d], cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function L_I_matrix_generator(): any[] {
            const full_matrix: any[] = [];
            for (let x = 0; x <= 100; x++) {
                for (let t = 0; t <= 100 * (x >= 40 ? 1 : 0); t++) {
                    for (let j = 0; j <= 100 * (x >= 90 ? 1 : 0) * (t >= 50 ? 1 : 0); j++) {
                        const partialLoadout = Array(loadout_length).fill(0);
                        partialLoadout[7] = x;
                        partialLoadout[16] = t;
                        partialLoadout[19] = j;
                        const cost = calculateCost(7, x, partialLoadout) + calculateCost(16, t, partialLoadout) + calculateCost(19, j, partialLoadout);
                        let effect = calculateEffect(7, x, 0, 0)[0] + calculateEffect(16, t, 0, x)[0] + calculateEffect(19, j, 0, x)[0];
                        effect = Math.round(effect * 100) / 100;
                        full_matrix.push([[x, t, j], cost, effect]);
                    }
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function L_I_1_matrix_generator(matrix_L_I: any[]): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_L_I.length; i++) {
                for (let j = 0; j <= 50; j++) {
                    const cost = matrix_L_I[i][1] + calculateCost(28, j);
                    const bluck = matrix_L_I[i][2];
                    const mluck = calculateEffect(28, j, 0, 0)[0];
                    const effect = (baseluck + bluck - luck_zero) * (1 + multluck + mluck);
                    const copy = [...matrix_L_I[i][0]];
                    copy.push(j);
                    full_matrix.push([copy, cost, effect, bluck, mluck]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function L_D_matrix_generator(cubeValue: number, quarkValue: number, type: number): any[] {
            const cube_pre = type > 1 ? 0 : 1;
            const quark_pre = type % 2 === 1 ? 0 : 1;
            const full_matrix: any[] = [];
            for (let y = 0; y <= 25; y++) {
                for (let z = 0; z <= 25; z++) {
                    const cost = 100 * Math.pow(y, 3) + 100 * Math.pow(z, 3) + 8000 * (y > 0 ? 1 : 0) * cube_pre + 8000 * (z > 0 ? 1 : 0) * quark_pre;
                    const effect = 0.02 * (y + bonus[1][0]) * cubeValue + 0.02 * (z + bonus[1][0]) * quarkValue;
                    full_matrix.push([[y, z], cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function L_matrix_generator(matrix_L_I: any[], matrix_L_D: any[]): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_L_I.length; i++) {
                for (let j = 0; j <= (matrix_L_D.length - 1) * (matrix_L_I[i][0][0] >= 30 ? 1 : 0); j++) {
                    const cost = matrix_L_I[i][1] + matrix_L_D[j][1];
                    const bluck = matrix_L_I[i][3] + matrix_L_D[j][2];
                    const mluck = matrix_L_I[i][4];
                    const effect = (baseluck + bluck - luck_zero) * (1 + multluck + mluck);
                    full_matrix.push([matrix_L_I[i][0].concat(matrix_L_D[j][0]), cost, effect, bluck, mluck]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function Luck_batch(matrix_L: any[], tree: number[], amb_total: number): any[] {
            const cost = calculateLoadoutCost(tree);
            let pointer = 0;
            for (let i = 0; i < matrix_L.length; i++) {
                if (amb_total - cost < matrix_L[i][1]) {
                    break;
                } else {
                    pointer = i;
                }
            }
            let bestTree = buildLuckLoadout(tree, matrix_L[pointer][0]);
            let bestCost = calculateLoadoutCost(bestTree);
            while (pointer > 0 && bestCost === Number.POSITIVE_INFINITY) {
                pointer -= 1;
                bestTree = buildLuckLoadout(tree, matrix_L[pointer][0]);
                bestCost = calculateLoadoutCost(bestTree);
            }
            if (bestCost === Number.POSITIVE_INFINITY) {
                bestTree = [...tree];
                bestCost = calculateLoadoutCost(bestTree);
            }
            let bestEffect = calculateLoadoutEffect(bestTree)[0];
            for (let f = 0; f <= 25; f++) {
                const candidateTree = [...bestTree];
                candidateTree[31] = f;
                const candidateCost = calculateLoadoutCost(candidateTree);
                if (candidateCost > amb_total) {
                    break;
                }
                const candidateEffect = calculateLoadoutEffect(candidateTree)[0];
                if (candidateEffect > bestEffect) {
                    bestEffect = candidateEffect;
                    bestTree = candidateTree;
                    bestCost = candidateCost;
                }
            }
            const effect = calculateLoadoutEffect(bestTree);
            const max = bestTree[7] === 100 && bestTree[11] !== 25;
            const batch: any[] = [bestTree, bestCost, effect[0], effect[1], effect[2], effect[3], max];
            batch[0] = arrayToText(batch[0]);
            return batch;
        }

        function Q_I_1_matrix_generator(): any[] {
            const matrix_1 = Q_I_matrix_generator();
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_1.length; i++) {
                for (let j = 0; j <= 10 * (matrix_1[i][0][0] >= 100 ? 1 : 0) * (matrix_1[i][0][1] >= 50 ? 1 : 0); j++) {
                    const cost = matrix_1[i][1] + j * (1450000 + 50000 * j) / 2;
                    const effect = matrix_1[i][2] * (1 + 0.05 * (j + bonus[3][0]) * (1 + 0.01 * (matrix_1[i][0][1] + bonus[2][0])));
                    const copy = [...matrix_1[i][0]];
                    copy.push(j);
                    full_matrix.push([copy, cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function Q_P_matrix_generator(matrix_Q_I: any[]): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_Q_I.length; i++) {
                const quarks = matrix_Q_I[i][0][0];
                const cubes = matrix_Q_I[i][0][1];
                for (let b = 0; b <= 25 * (cubes >= 30 && quarks >= 20 ? 1 : 0); b++) {
                    const cost = matrix_Q_I[i][1] + 500 * Math.pow(b, 3) + 8000 * (b > 0 ? 1 : 0);
                    const effect = matrix_Q_I[i][2] * calculateEffect(8, b, 0, 0)[1];
                    const copy = [...matrix_Q_I[i][0]];
                    copy.push(b);
                    full_matrix.push([copy, cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function Rune_IA_matrix_generator(): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i <= 100; i++) {
                for (let j = 0; j <= 100; j++) {
                    const cost = calculateCost(29, i) + calculateCost(30, j);
                    const effect = deltaIA(1, 0.005 * i) + deltaIA(2, 0.001 * (j + bonus[2][0]));
                    full_matrix.push([[i, j], cost, effect]);
                }
            }
            const matrix = Matrix_assembly(full_matrix);
            const short_matrix: any[] = [];
            for (let i = 0; i < matrix.length; i++) {
                if (i % 10 === 0 || i === matrix.length - 1) {
                    short_matrix.push(matrix[i]);
                }
            }
            return short_matrix;
        }

        function Q_R_matrix_generator(matrix_Q_P: any[], matrix_Q_R: any[]): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_Q_P.length; i++) {
                for (let j = 0; j < matrix_Q_R.length; j++) {
                    const cost = matrix_Q_P[i][1] + matrix_Q_R[j][1];
                    const effect = matrix_Q_P[i][2] * (1 + matrix_Q_R[j][2] / (500 + originalIAtotal));
                    full_matrix.push([matrix_Q_P[i][0].concat(matrix_Q_R[j][0]), cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function Q_tree_generator(matrix_Q_P: any[], amb_total: number, matrix_L: any[]): any[] {
            const full_matrix: any[] = [];
            let pointer = -1;
            const luck_0 = matrix_L[0][2];
            for (let i = 0; i < matrix_Q_P.length; i++) {
                let cost = matrix_Q_P[i][1];
                if (cost > amb_total) {
                    break;
                }
                for (let j = 0; j <= 25 * (matrix_Q_P[i][0][0] >= 30 ? 1 : 0); j++) {
                    cost = matrix_Q_P[i][1] + 500 * Math.pow(j, 3);
                    let effect = JSON.parse(JSON.stringify(matrix_Q_P[i][2]));
                    let pointerIndex = 0;
                    if (cost > amb_total) {
                        break;
                    }
                    if ((j + bonus[2][0]) > 0) {
                        pointerIndex = matrix_L.length - 1;
                        for (let k = 0; k <= pointerIndex; k++) {
                            if (matrix_L[k][1] > amb_total - cost) {
                                pointerIndex = Math.max(0, k - 1);
                                break;
                            }
                        }
                        const pointerCost = matrix_L[pointerIndex][1];
                        cost += pointerCost;
                        effect *= calculateEffect(9, j, matrix_L[pointerIndex][2], 0)[1];
                    }
                    if (pointerIndex === 0 && j > 0) {
                        const copy = [...matrix_Q_P[i][0]];
                        copy.push(0);
                        full_matrix.push([copy.concat(matrix_L[0][0]), matrix_Q_P[i][1], matrix_Q_P[i][2], i]);
                        break;
                    }
                    if (cost <= amb_total) {
                        const copy = [...matrix_Q_P[i][0]];
                        copy.push(j);
                        full_matrix.push([copy.concat(matrix_L[pointerIndex][0]), cost, effect, i]);
                    }
                }
            }
            let bestPointer = -1;
            let bestEffect = 1;
            let bestCost = 0;
            for (let i = 0; i < full_matrix.length; i++) {
                if (full_matrix[i][2] > bestEffect || (full_matrix[i][2] === bestEffect && full_matrix[i][1] < bestCost)) {
                    bestCost = full_matrix[i][1];
                    bestEffect = full_matrix[i][2];
                    bestPointer = i;
                }
            }
            if (bestPointer === -1) {
                return Array(12).fill(0);
            }
            return full_matrix[bestPointer][0];
        }

        function Quark_batch(matrix_Q_R: any[], matrix_L: any[], tree: number[], amb_total: number): any[] {
            const originalTree = [...tree];
            const cost = calculateLoadoutCost(tree);
            const vector = Q_tree_generator(matrix_Q_R, amb_total - cost, matrix_L);
            if (!Array.isArray(vector) || vector.length !== 12) {
                console.warn('[Heater] Quark vector has unexpected shape', { length: Array.isArray(vector) ? vector.length : 'not-array', vector, amb_total, cost });
            }
            if (vector[12] === undefined) {
                console.warn('[Heater] Quark vector missing expected index 12', { vector });
            }
            tree[5] = safeVectorValue(vector, 0);
            tree[6] = safeVectorValue(vector, 6) > 0 ? 20 : 0;
            tree[7] = safeVectorValue(vector, 7);
            tree[8] = safeVectorValue(vector, 3);
            tree[9] = safeVectorValue(vector, 6);
            tree[12] = safeVectorValue(vector, 11);
            tree[13] = safeVectorValue(vector, 12);
            tree[14] = safeVectorValue(vector, 1);
            tree[16] = safeVectorValue(vector, 8);
            tree[17] = safeVectorValue(vector, 2);
            tree[19] = safeVectorValue(vector, 9);
            tree[28] = safeVectorValue(vector, 10);
            tree[29] = safeVectorValue(vector, 4);
            tree[30] = safeVectorValue(vector, 5);
            const baseTree = [...tree];
            let bestTree = [...baseTree];
            let bestCost = calculateLoadoutCost(bestTree);
            if (bestCost === Number.POSITIVE_INFINITY) {
                bestTree = [...originalTree];
                bestCost = calculateLoadoutCost(bestTree);
            }
            let bestEffect = calculateLoadoutEffect(bestTree)[1];
            for (let g = 0; g <= 3; g++) {
                for (let f = 0; f <= 10; f++) {
                    const candidateTree = [...baseTree];
                    candidateTree[32] = g;
                    candidateTree[34] = f;
                    const candidateCost = calculateLoadoutCost(candidateTree);
                    if (candidateCost === Number.POSITIVE_INFINITY || candidateCost > amb_total) {
                        continue;
                    }
                    const candidateEffect = calculateLoadoutEffect(candidateTree)[1];
                    if (candidateEffect > bestEffect) {
                        bestEffect = candidateEffect;
                        bestTree = candidateTree;
                        bestCost = candidateCost;
                    }
                }
            }
            const max = bestTree[5] === 100 && bestTree[6] === 20 && bestTree[7] === 100 && bestTree[8] === 25 && bestTree[9] === 25 && bestTree[12] === 25 && bestTree[13] === 25 && bestTree[14] === 100 && bestTree[16] === 100 && bestTree[17] === 10 && bestTree[19] === 100 && bestTree[28] === 50 && bestTree[29] === 100 && bestTree[30] === 100;
            const effect = calculateLoadoutEffect(bestTree);
            const batch: any[] = [bestTree, bestCost, effect[0], effect[1], effect[2], effect[3], max];
            batch[0] = arrayToText(batch[0]);
            return batch;
        }

        function C_I_matrix_generator(): any[] {
            const full_matrix: any[] = [];
            for (let a = 0; a <= 100; a++) {
                for (let d = 0; d <= 100 * (a >= 40 ? 1 : 0); d++) {
                    const cost = Math.pow(a, 3) + 500 * Math.pow(d, 2);
                    const effect = (1 + (a + bonus[0][0]) * 0.05) * Math.pow(1.1, Math.floor((a + bonus[0][0]) / 5)) * (1 + (d + bonus[2][0]) * (0.1 + 0.01 * Math.floor((a + bonus[0][0]) / 10))) * Math.pow(1.15, Math.floor((d + bonus[2][0]) / 5));
                    full_matrix.push([[a, d], cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function C_I_1_matrix_generator(): any[] {
            const matrix_1 = C_I_matrix_generator();
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_1.length; i++) {
                for (let j = 0; j <= 100 * (matrix_1[i][0][0] >= 100 ? 1 : 0) * (matrix_1[i][0][1] >= 50 ? 1 : 0); j++) {
                    const cost = matrix_1[i][1] + j * (145000 + 5000 * j) / 2;
                    const effect = matrix_1[i][2] * (1 + 0.2 * (j + bonus[3][0]) * (1 + 0.03 * (matrix_1[i][0][1] + bonus[2][0]))) * Math.pow(1.2, Math.floor((j + bonus[3][0]) / 5));
                    const copy = [...matrix_1[i][0]];
                    copy.push(j);
                    full_matrix.push([copy, cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function C_Inf_matrix_generator(type: number = 0): any[] {
            const full_matrix: any[] = [[[0, 0], 0, 1]];
            for (let i = 1; i <= 20; i++) {
                const cost = 80000 + i * 25000;
                const effect = type === 0 ? calculateEffect(26, i, 0, 0)[2] : calculateEffect(26, i, 0, 0)[3];
                full_matrix.push([[i, 0], cost, effect]);
            }
            for (let i = 1; i <= 20; i++) {
                const cost = 1090000 + i * 75000;
                const effect = type === 0
                    ? calculateEffect(26, 25, 0, 0)[2] * calculateEffect(27, i, 0, 25)[2]
                    : calculateEffect(26, 25, 0, 0)[3] * calculateEffect(27, i, 0, 25)[3];
                full_matrix.push([[20, i], cost, effect]);
            }
            return full_matrix;
        }

        function C_Inf_1_matrix_generator(type: number = 0): any[] {
            const matrix_1 = C_I_1_matrix_generator();
            const matrix_2 = C_Inf_matrix_generator(type);
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_1.length; i++) {
                for (let j = 0; j <= (matrix_1[i][0][0] >= 70 ? 1 : 0) * (20 + (matrix_1[i][0][1] >= 50 ? 20 : 0)); j++) {
                    const cost = matrix_1[i][1] + matrix_2[j][1];
                    const effect = matrix_1[i][2] * matrix_2[j][2];
                    full_matrix.push([matrix_1[i][0].concat(matrix_2[j][0]), cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function C_P_matrix_generator(matrix_C_I: any[], prereq = 1): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_C_I.length; i++) {
                for (let c = 0; c <= 25 * (matrix_C_I[i][0][0] >= 30 ? 1 : 0); c++) {
                    const cost = matrix_C_I[i][1] + 250 * Math.pow(c, 3) + 8000 * (c > 0 ? 1 : 0) * prereq - 8000 * (prereq === 0 ? 1 : 0);
                    const effect = matrix_C_I[i][2] * (1 + 0.001 * (c + bonus[2][0]) * quark);
                    const copy = [...matrix_C_I[i][0]];
                    copy.push(c);
                    full_matrix.push([copy, cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function O_R_matrix_generator(matrix_C_P: any[]): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_C_P.length; i++) {
                const cost = matrix_C_P[i][1];
                const effect = matrix_C_P[i][2];
                full_matrix.push([matrix_C_P[i][0].concat([0, 0]), cost, effect]);
            }
            return full_matrix;
        }

        function C_R_matrix_generator(matrix_C_P: any[], matrix_C_R: any[]): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_C_P.length; i++) {
                for (let j = 0; j < matrix_C_R.length; j++) {
                    const cost = matrix_C_P[i][1] + matrix_C_R[j][1];
                    const effect = matrix_C_P[i][2] * (1 + matrix_C_R[j][2] / (100 + originalIAtotal));
                    full_matrix.push([matrix_C_P[i][0].concat(matrix_C_R[j][0]), cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function C_H_matrix_generator(matrix_C_P: any[], force_h = -1, type = 1): any[] {
            const full_matrix: any[] = [];
            let hs = [...Array(8).keys()];
            if (force_h !== -1) {
                hs = [force_h];
            }
            if (force_tree[24] !== 0) {
                hs = hs.filter((e) => e >= 4);
            }
            for (let i = 0; i < matrix_C_P.length; i++) {
                for (let h = 0; h < hs.length; h++) {
                    for (let s = force_tree[24] * (exalt === 0 ? 1 : 0) + force_tree[25] * (exalt === 1 ? 1 : 0);
                         s <= (((exalt === 0 ? (hs[h] >= 4 ? 1 : 0) : 0) + (exalt === 1 ? 1 : 0)) * 2) * (type === 0 ? 1 : 0);
                         s++) {
                        const cost = matrix_C_P[i][1] + calculateCost(4, hs[h]) + calculateCost(24 + (exalt === 1 ? 1 : 0), s);
                        const effect = matrix_C_P[i][2] * Math.pow(1 + hs[h] * 0.01, plat4x4) * singReductionEffect(singularity, s)[0];
                        full_matrix.push([matrix_C_P[i][0].concat([hs[h], s * (exalt === 0 ? 1 : 0), s * (exalt === 1 ? 1 : 0)]), cost, effect]);
                    }
                }
            }
            return full_matrix;
        }

        function C_tree_generator(matrix_C: any[], matrix_L: any[], amb_total: number, matrix_L_backup: any[] = []): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_C.length; i++) {
                let cost = matrix_C[i][1];
                if (cost > amb_total) {
                    break;
                }
                for (let j = 0; j <= 25 * (matrix_C[i][0][0] >= 30 ? 1 : 0); j++) {
                    cost = matrix_C[i][1] + 250 * Math.pow(j, 3);
                    let effect = JSON.parse(JSON.stringify(matrix_C[i][2]));
                    let pointerIndex = 0;
                    if (cost > amb_total) {
                        break;
                    }
                    if (matrix_L.length === 1) {
                        cost += matrix_L[0][1];
                        effect *= calculateEffect(10, j, matrix_L[pointerIndex][2], 0)[2];
                    } else if ((j + bonus[2][0]) > 0) {
                        pointerIndex = matrix_L.length - 1;
                        for (let k = 0; k <= pointerIndex; k++) {
                            if (matrix_L[k][1] > amb_total - cost) {
                                pointerIndex = Math.max(0, k - 1);
                                break;
                            }
                        }
                        const pointerCost = matrix_L[pointerIndex][1];
                        cost += pointerCost;
                        effect *= calculateEffect(10, j, matrix_L[pointerIndex][2], 0)[2];
                        if (pointerIndex === 0 && j > 0) {
                            const copy = [...matrix_C[i][0]];
                            copy.push(j);
                            full_matrix.push([copy.concat(matrix_L[0][0]), matrix_C[i][1], matrix_C[i][2]]);
                            break;
                        }
                    }
                    if (cost <= amb_total) {
                        const copy = [...matrix_C[i][0]];
                        copy.push(j);
                        full_matrix.push([copy.concat(matrix_L[pointerIndex][0]), cost, effect]);
                    }
                }
            }
            let bestPointer = -1;
            let bestEffect = 1;
            let bestCost = 0;
            for (let i = 0; i < full_matrix.length; i++) {
                if (full_matrix[i][2] > bestEffect || (full_matrix[i][2] === bestEffect && full_matrix[i][1] < bestCost)) {
                    bestCost = full_matrix[i][1];
                    bestEffect = full_matrix[i][2];
                    bestPointer = i;
                }
            }
            if (bestPointer === -1) {
                return Array(18).fill(0);
            }
            return full_matrix[bestPointer][0];
        }

        function Cube_batch(matrix_C_H: any[], matrix_L: any[], tree: number[], amb_total: number): any[] {
            const originalTree = [...tree];
            const max_h = matrix_C_H[matrix_C_H.length - 1][0][8];
            const hasnt_talisman = matrix_C_H[matrix_C_H.length - 1][0][6] === 0;
            const cost = calculateLoadoutCost(tree);
            const vector = C_tree_generator(matrix_C_H, matrix_L, amb_total - cost);
            tree[4] = safeVectorValue(vector, 8);
            tree[5] = safeVectorValue(vector, 5) > 0 ? 20 : 0;
            tree[6] = safeVectorValue(vector, 0);
            tree[7] = safeVectorValue(vector, 12);
            tree[10] = safeVectorValue(vector, 11);
            tree[11] = safeVectorValue(vector, 5);
            tree[12] = safeVectorValue(vector, 16);
            tree[13] = safeVectorValue(vector, 17);
            tree[15] = safeVectorValue(vector, 1);
            tree[16] = safeVectorValue(vector, 13);
            tree[18] = safeVectorValue(vector, 2);
            tree[19] = safeVectorValue(vector, 14);
            tree[20] = (safeVectorValue(vector, 3) > 0 ? 10 : 0) + (safeVectorValue(vector, 4) > 0 ? 5 : 0);
            tree[21] = (safeVectorValue(vector, 3) > 0 ? 20 : 0) + (safeVectorValue(vector, 4) > 0 ? 10 : 0);
            tree[22] = safeVectorValue(vector, 4) > 0 ? 10 : 0;
            tree[23] = safeVectorValue(vector, 4) > 0 ? 20 : 0;
            tree[24] = safeVectorValue(vector, 9);
            tree[25] = safeVectorValue(vector, 10);
            tree[26] = safeVectorValue(vector, 2);
            tree[27] = safeVectorValue(vector, 3);
            tree[28] = safeVectorValue(vector, 12);
            tree[29] = safeVectorValue(vector, 4);
            tree[30] = safeVectorValue(vector, 5);
            const baseTree = [...tree];
            let bestTree = [...baseTree];
            let bestCost = calculateLoadoutCost(bestTree);
            if (bestCost === Number.POSITIVE_INFINITY) {
                bestTree = [...originalTree];
                bestCost = calculateLoadoutCost(bestTree);
            }
            let bestEffect = calculateLoadoutEffect(bestTree)[2];
            for (let g = 0; g <= 3; g++) {
                const candidateTree = [...baseTree];
                candidateTree[32] = g;
                const candidateCost = calculateLoadoutCost(candidateTree);
                if (candidateCost === Number.POSITIVE_INFINITY || candidateCost > amb_total) {
                    continue;
                }
                const candidateEffect = calculateLoadoutEffect(candidateTree)[2];
                if (candidateEffect > bestEffect) {
                    bestEffect = candidateEffect;
                    bestTree = candidateTree;
                    bestCost = candidateCost;
                }
            }
            const max = bestTree[4] >= max_h && bestTree[6] === 100 && bestTree[7] === 100 && bestTree[10] === 25 && bestTree[11] === 25 && bestTree[12] === 25 && bestTree[13] === 25 && bestTree[15] === 100 && bestTree[16] === 100 && bestTree[18] === 100 && bestTree[19] === 100 && bestTree[26] === 20 && bestTree[27] === 20 && bestTree[28] === 50 && (hasnt_talisman || (bestTree[29] === 100 && bestTree[30] === 100));
            const effect = calculateLoadoutEffect(bestTree);
            const batch: any[] = [bestTree, calculateLoadoutCost(bestTree), effect[0], effect[1], effect[2], effect[3], max];
            batch[0] = arrayToText(batch[0]);
            return batch;
        }

        function Base_Obt_matrix_generator(): any[] {
            const full_matrix: any[] = [];
            for (let a = 0; a <= 20; a++) {
                for (let b = 0; b <= 30 * (a >= 15 ? 1 : 0); b++) {
                    for (let c = 0; c <= 20 * (a >= 10 ? 1 : 0) + 20 * (b >= 10 ? 1 : 0); c++) {
                        const t1 = Math.min(20, c);
                        const t2 = Math.max(0, c - 20);
                        const base_module_cost = calculateCost(20, a) + calculateCost(22, b) + calculateCost(26, t1) + calculateCost(27, t2);
                        const basic_alt_cost = calculateCost(21, Math.max(20 * (b > 0 ? 1 : 0), 20 * (t1 > 0 ? 1 : 0), 30 * (t2 > 0 ? 1 : 0))) + calculateCost(23, 20 * (t2 > 0 ? 1 : 0));
                        const cube_cost = calculateCost(6, 70 * (t1 > 0 ? 1 : 0)) + calculateCost(15, 50 * (t2 > 0 ? 1 : 0));
                        const cost = base_module_cost + basic_alt_cost + cube_cost;
                        const base_increase = a + b;
                        const base_effect = 1 + base_increase / baseobt;
                        const mult_effect = calculateEffect(26, c, 0, 0)[5];
                        const effect = base_effect * mult_effect;
                        full_matrix.push([[a, b, t1, t2], cost, effect, base_increase]);
                    }
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function Base_Off_matrix_generator(): any[] {
            const full_matrix: any[] = [];
            for (let a = 0; a <= 40; a++) {
                for (let b = 0; b <= 60 * (a >= 30 ? 1 : 0); b++) {
                    for (let c = 0; c <= 20 * (a >= 20 ? 1 : 0) + 20 * (b >= 20 ? 1 : 0); c++) {
                        const t1 = Math.min(20, c);
                        const t2 = Math.max(0, c - 20);
                        const base_module_cost = calculateCost(21, a) + calculateCost(23, b) + calculateCost(26, t1) + calculateCost(27, t2);
                        const basic_alt_cost = calculateCost(20, Math.max(10 * (b > 0 ? 1 : 0), 10 * (t1 > 0 ? 1 : 0), 15 * (t2 > 0 ? 1 : 0))) + calculateCost(22, 10 * (t2 > 0 ? 1 : 0));
                        const cube_cost = calculateCost(6, 70 * (t1 > 0 ? 1 : 0)) + calculateCost(15, 50 * (t2 > 0 ? 1 : 0));
                        const cost = base_module_cost + basic_alt_cost + cube_cost;
                        const base_increase = a + b;
                        const base_effect = 1 + base_increase / baseoff;
                        const mult_effect = calculateEffect(26, c, 0, 0)[5];
                        const effect = base_effect * mult_effect;
                        full_matrix.push([[a, b, t1, t2], cost, effect, base_increase]);
                    }
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function Rune_SI_matrix_generator(): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i <= 100; i++) {
                for (let j = 0; j <= 100; j++) {
                    const cost = calculateCost(29, i) + calculateCost(30, j);
                    const effect = calculateEffect(29, i, 0, 0)[5] * calculateEffect(30, j, 0, 0)[5];
                    full_matrix.push([[i, j], cost, effect]);
                }
            }
            const matrix = Matrix_assembly(full_matrix);
            const short_matrix: any[] = [];
            for (let i = 0; i < matrix.length; i++) {
                if (i % 10 === 0 || i === matrix.length - 1) {
                    short_matrix.push(matrix[i]);
                }
            }
            return short_matrix;
        }

        function Obt_I_generator(type = 0): any[] {
            const matrix_1 = type === 0 ? Base_Obt_matrix_generator() : Base_Off_matrix_generator();
            const matrix_2 = Rune_SI_matrix_generator();
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_1.length; i++) {
                for (let j = 0; j < matrix_2.length; j++) {
                    const cost = matrix_1[i][1] + matrix_2[j][1];
                    const effect = matrix_1[i][2] * matrix_2[j][2];
                    const base_increase = matrix_1[i][3];
                    full_matrix.push([matrix_1[i][0].concat(matrix_2[j][0]), cost, effect, base_increase]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function Obt_SR_matrix_generator(matrix_Obt: any[], type = 1): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_Obt.length; i++) {
                for (let s = 0; s <= 2 * (type === 0 ? 1 : 0); s++) {
                    const cost = matrix_Obt[i][1] + calculateCost(4, 4 * ((exalt === 0 && s > 0) ? 1 : 0)) + calculateCost(24 + (exalt === 1 ? 1 : 0), s);
                    const effect = matrix_Obt[i][2] * singReductionEffect(singularity, s)[1];
                    full_matrix.push([matrix_Obt[i][0].concat([s * (exalt === 0 ? 1 : 0), s * (exalt === 1 ? 1 : 0)]), cost, effect, matrix_Obt[i][3]]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function O_tree_generator(matrix_O: any[], matrix_L: any[], amb_total: number): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_O.length; i++) {
                let cost = matrix_O[i][1];
                if (cost > amb_total) {
                    break;
                }
                for (let j = 0; j <= 2; j++) {
                    cost = matrix_O[i][1] + calculateCost(2, j);
                    let effect = JSON.parse(JSON.stringify(matrix_O[i][2]));
                    let pointerIndex = 0;
                    if (cost > amb_total) {
                        break;
                    }
                    if (matrix_L.length === 1) {
                        cost += matrix_L[0][1];
                        effect *= calculateEffect(2, j, matrix_L[pointerIndex][2], 0)[5];
                    } else if (j > 0) {
                        pointerIndex = matrix_L.length - 1;
                        for (let k = 0; k <= pointerIndex; k++) {
                            if (matrix_L[k][1] > amb_total - cost) {
                                pointerIndex = k - 1;
                                cost += matrix_L[pointerIndex][1];
                                effect *= calculateEffect(2, j, matrix_L[pointerIndex][2], 0)[5];
                                break;
                            }
                        }
                        if (pointerIndex === matrix_L.length - 1 && matrix_L.length !== 1) {
                            cost += matrix_L[pointerIndex][1];
                            effect *= calculateEffect(2, j, matrix_L[pointerIndex][2], 0)[5];
                        }
                        if (pointerIndex === 0 && j > 0) {
                            const copy = [...matrix_O[i][0]];
                            copy.push(0);
                            full_matrix.push([copy.concat(matrix_L[0][0]), matrix_O[i][1], matrix_O[i][2], matrix_O[i][3]]);
                            break;
                        }
                    }
                    if (cost <= amb_total) {
                        const copy = [...matrix_O[i][0]];
                        copy.push(j);
                        full_matrix.push([copy.concat(matrix_L[pointerIndex][0]), cost, effect, matrix_O[i][3]]);
                    }
                }
            }
            let bestPointer = -1;
            let bestEffect = 1;
            let bestCost = 0;
            for (let i = 0; i < full_matrix.length; i++) {
                if (full_matrix[i][2] > bestEffect || (full_matrix[i][2] === bestEffect && full_matrix[i][1] < bestCost)) {
                    bestCost = full_matrix[i][1];
                    bestEffect = full_matrix[i][2];
                    bestPointer = i;
                }
            }
            return full_matrix[bestPointer];
        }

        function O_batch(matrix_O: any[], matrix_L: any[], tree: number[], amb_total: number, type = 0): any[] {
            const cost = calculateLoadoutCost(tree);
            const output = O_tree_generator(matrix_O, matrix_L, amb_total - cost);
            const vector = output[0];
            tree[2] = type === 0 ? vector[8] : 0;
            tree[3] = type === 1 ? vector[8] : 0;
            tree[4] = vector[6] > 0 ? 4 : 0;
            tree[5] = vector[14] > 0 ? 20 : 0;
            tree[6] = Math.max(vector[13] > 0 ? 20 : 0, vector[2] > 0 ? 70 : 0);
            tree[7] = vector[9];
            tree[12] = vector[13];
            tree[13] = vector[14];
            tree[15] = vector[3] > 0 ? 50 : 0;
            tree[16] = vector[10];
            tree[19] = vector[11];
            tree[20] = Math.max(type === 0 ? vector[0] : 0, vector[1] > 0 ? 10 : 0, vector[2] > 0 ? 10 : 0, vector[3] > 0 ? 15 : 0);
            tree[21] = Math.max(type === 1 ? vector[0] : 0, vector[1] > 0 ? 20 : 0, vector[2] > 0 ? 20 : 0, vector[3] > 0 ? 30 : 0);
            tree[22] = vector[1] > 0 ? 10 : 0;
            tree[23] = vector[3] > 0 ? 20 : 0;
            tree[24] = vector[6];
            tree[25] = vector[7];
            tree[26] = vector[2];
            tree[27] = vector[3];
            tree[28] = vector[12];
            tree[29] = vector[4];
            tree[30] = vector[5];
            const max = ((tree[2] === 2) || (tree[3] === 2)) && tree[7] === 100 && tree[12] === 25 && tree[13] === 25 && tree[16] === 100 && tree[19] === 100 && ((tree[20] === 20) || (tree[21] === 40)) && ((tree[22] === 30) || (tree[23] === 60)) && tree[27] === 20 && tree[28] === 50 && tree[29] === 100 && tree[30] === 100 && (postaoag === 1 || tree[24] === 2 || tree[25] === 2);
            const loadoutCost = calculateLoadoutCost(tree);
            const effect = calculateLoadoutEffect(tree);
            let batch: any[];
            if (type === 0) {
                batch = [tree, loadoutCost, 0, 0, effect[4], effect[6], max];
            } else {
                batch = [tree, loadoutCost, 0, 0, effect[5], effect[7], max];
            }
            batch[0] = arrayToText(batch[0]);
            return batch;
        }

        luck_zero = calculateLoadoutEffect(true_base_tree)[0] / (1 + multluck + calculateEffect(28, 0, baseluck, 0)[0]) - baseluck;

        const matrix_L_I_0 = L_I_matrix_generator();
        const matrix_L_I = L_I_1_matrix_generator(matrix_L_I_0);
        const matrix_Q_I = Q_I_1_matrix_generator();
        const matrix_C_I = C_Inf_1_matrix_generator(0);
        const matrix_O_I = C_Inf_1_matrix_generator(1);
        const matrix_RuneIA = Rune_IA_matrix_generator();

        let matrix_L_0: any[] = [];
        let matrix_L_3: any[] = [];
        let matrix_Q_P: any[] = [];
        let matrix_Q_R: any[] = [];
        let matrix_C_P: any[] = [];
        let matrix_C_R: any[] = [];
        let matrix_O_P: any[] = [];
        let matrix_O_R: any[] = [];
        let matrix_O_H_0: any[] = [];
        let matrix_Obt_I: any[] = [];
        let matrix_Off_I: any[] = [];
        let matrix_Obt_SR: any[] = [];
        let matrix_Off_SR: any[] = [];

        if (activeFlags[3] || activeFlags[4] || activeFlags[7]) {
            const matrix_L_D_0 = L_D_matrix_generator(cube, quark, 0);
            matrix_L_0 = L_matrix_generator(matrix_L_I, matrix_L_D_0);
        }
        if (activeFlags[0] || activeFlags[1] || activeFlags[2] || activeFlags[5] || activeFlags[6]) {
            const matrix_L_D_3 = L_D_matrix_generator(cube, quark, 3);
            matrix_L_3 = L_matrix_generator(matrix_L_I, matrix_L_D_3);
            matrix_L_3 = [matrix_L_3[0]].concat(matrix_L_3.slice(20));
        }
        if (activeFlags[0]) {
            matrix_Q_P = Q_P_matrix_generator(matrix_Q_I);
            matrix_Q_R = Q_R_matrix_generator(matrix_Q_P, matrix_RuneIA);
        }
        if (activeFlags[1] || activeFlags[5] || activeFlags[6]) {
            matrix_C_P = C_P_matrix_generator(matrix_C_I);
            matrix_C_R = C_R_matrix_generator(matrix_C_P, matrix_RuneIA);
        }
        if (activeFlags[2]) {
            matrix_O_P = C_P_matrix_generator(matrix_O_I);
            matrix_O_R = O_R_matrix_generator(matrix_O_P);
            matrix_O_H_0 = C_H_matrix_generator(matrix_O_R, 0);
        }
        if (activeFlags[4]) {
            matrix_Obt_I = Obt_I_generator(0);
            matrix_Off_I = Obt_I_generator(1);
            matrix_Obt_SR = Obt_SR_matrix_generator(matrix_Obt_I, postaoag === 0 ? 0 : 1);
            matrix_Off_SR = Obt_SR_matrix_generator(matrix_Off_I, postaoag === 0 ? 0 : 1);
        }

        const result: HeaterOptimizationResult = {
            input,
            notes,
        };

        if (activeFlags[0]) {
            const tree = [...true_base_tree];
            result.c1 = Quark_batch(matrix_Q_R, matrix_L_3, tree, amb);
        }
        if (activeFlags[1]) {
            const tree = [...true_base_tree];
            const matrix_C_H = C_H_matrix_generator(matrix_C_R);
            result.c2 = Cube_batch(matrix_C_H, matrix_L_3, tree, amb);
        }
        if (activeFlags[2]) {
            const tree = [...true_base_tree];
            result.c3 = Cube_batch(matrix_O_H_0, matrix_L_3, tree, amb);
        }
        if (activeFlags[3]) {
            const tree = [...true_base_tree];
            result.c4 = Luck_batch(matrix_L_0, tree, amb);
        }
        if (activeFlags[4]) {
            const treeA1 = [...true_base_tree];
            result.a1 = O_batch(matrix_Obt_SR, matrix_L_0, treeA1, amb, 0);
            const treeA2 = [...true_base_tree];
            result.a2 = O_batch(matrix_Off_SR, matrix_L_0, treeA2, amb, 1);
        }
        if (activeFlags[5]) {
            const output: any[] = [];
            const cost = [101, 33434, 100100, 200099, 333431, 500096, 1000091, 2500076];
            for (let i = 0; i <= 7; i++) {
                if (cost[i] < amb) {
                    const tree = [...true_base_tree];
                    const matrix_C_H = C_H_matrix_generator(matrix_O_R, i, 0);
                    const batch = Cube_batch(matrix_C_H, matrix_L_3, tree, amb);
                    batch[2] = batch[1];
                    batch[4] = batch[4] / calculateEffect(4, i, 0, 0)[2];
                    if (i === 0) {
                        batch[5] = 0;
                    } else {
                        batch[5] = Math.ceil(Math.log10(output[i - 1][4] / batch[4]) / Math.log10((1 + 0.01 * i) / (1 + 0.01 * (i - 1))));
                        if (batch[5] > 50) {
                            batch[5] = 'Never';
                        }
                    }
                    output.push(batch);
                } else {
                    output.push(['Unaffordable', '', 'N/A', '', 'N/A', 'N/A', false]);
                }
            }
            if (typeof output[4][5] === 'number' && output[4][5] <= 0) {
                output[0][5] = 'Never';
                output[1][5] = 'Never';
                output[2][5] = 'Never';
                output[3][5] = 'Never';
                output[4][5] = 0;
            }
            result.h0 = output[0];
            result.h1 = output[1];
            result.h2 = output[2];
            result.h3 = output[3];
            result.h4 = output[4];
            result.h5 = output[5];
            result.h6 = output[6];
            result.h7 = output[7];
        }
        if (activeFlags[6]) {
            const output: any[] = [];
            const tree = [...true_base_tree];
            const basecost_1 = 333431;
            const basecost_2 = 101;
            let batch: any[];
            const cost_1 = Array.from({ length: max_level[24] }, (_, i) => basecost_1 + calculateCost(24, i + 1));
            if (exalt) {
                batch = ['In Exalt', '', '', '', 'N/A', '', false];
            } else if (amb < cost_1[0]) {
                batch = ['Unaffordable', '', '', '', 'N/A', '', false];
            } else {
                let r1 = 1;
                for (let i = 1; i <= max_level[24]; i++) {
                    if (amb >= cost_1[i - 1]) {
                        r1 = i;
                    } else {
                        break;
                    }
                }
                force_tree[24] = r1;
                const matrix_C_H = C_H_matrix_generator(matrix_C_R, -1, 0);
                batch = Cube_batch(matrix_C_H, matrix_L_3, tree, amb);
                batch[4] = batch[1];
                force_tree[24] = 0;
            }
            output.push(batch);
            const cost_2 = Array.from({ length: max_level[25] }, (_, i) => basecost_2 + calculateCost(25, i + 1));
            if (!exalt) {
                batch = ['Outside Exalt', '', '', '', 'N/A', '', false];
            } else if (amb < cost_2[0]) {
                batch = ['Unaffordable', '', '', '', 'N/A', '', false];
            } else {
                let r2 = 1;
                for (let i = 1; i <= max_level[25]; i++) {
                    if (amb >= cost_2[i - 1]) {
                        r2 = i;
                    } else {
                        break;
                    }
                }
                force_tree[25] = r2;
                const matrix_C_H = C_H_matrix_generator(matrix_C_R, -1, 0);
                batch = Cube_batch(matrix_C_H, matrix_L_3, tree, amb);
                batch[4] = batch[1];
                force_tree[25] = 0;
            }
            output.push(batch);
            result.s1 = output[0];
            result.s2 = output[1];
        }
        if (activeFlags[7]) {
            const tree = [...true_base_tree];
            const affordable = Luck_batch(matrix_L_0, tree, amb)[6];
            if (!affordable) {
                result.m0 = ['Unaffordable', '', 'N/A', '', 'N/A', 'N/A', false];
            } else {
                const matrix_C_P = C_P_matrix_generator(matrix_C_I, 0);
                const matrix_C_R = C_R_matrix_generator(matrix_C_P, matrix_RuneIA);
                const matrix_C_H = C_H_matrix_generator(matrix_C_R, 0).slice(20);
                const tree2 = [...true_base_tree];
                result.m0 = Cube_batch(matrix_C_H, [matrix_L_0[matrix_L_0.length - 1]], tree2, amb);
            }
        }
        return result;
    }

    private static stringToBase64(value: string): string {
        if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
            return window.btoa(unescape(encodeURIComponent(value)));
        }

        const nodeBuffer = typeof globalThis !== 'undefined' ? (globalThis as any).Buffer : undefined;
        if (nodeBuffer && typeof nodeBuffer.from === 'function') {
            return nodeBuffer.from(value, 'utf8').toString('base64');
        }

        throw new Error('Base64 encoding is not available in this environment.');
    }

    private static base64ToString(encoded: string): string {
        if (typeof window !== 'undefined' && typeof window.atob === 'function') {
            return decodeURIComponent(escape(window.atob(encoded)));
        }

        const nodeBuffer = typeof globalThis !== 'undefined' ? (globalThis as any).Buffer : undefined;
        if (nodeBuffer && typeof nodeBuffer.from === 'function') {
            return nodeBuffer.from(encoded, 'base64').toString('utf8');
        }

        throw new Error('Base64 decoding is not available in this environment.');
    }
}
