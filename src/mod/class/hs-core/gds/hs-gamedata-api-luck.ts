import { EventBuffType } from "../../../types/data-types/hs-event-data";
import { parseGameDataDecimal, parseGameDataNumber } from "./hs-gamedata-utils";
import type { GameData } from "../../../types/data-types/hs-player-savedata";
import type { CalculationCache, CalculationMode, CachedValue, RuneKeys, SingularityDebuffs, TalismanKeys, TalismanTypeMap } from "../../../types/data-types/hs-gamedata-api-types";

export interface LuckHelperContext {
    getGameData: () => GameData | undefined;
    isEvent: boolean;
    getPCoinUpgradeLevel: (upgradeKey: string) => number;
    getSingularityChallengeEffect: (challengeKey: string, effectKey: string) => number;
    getShopUpgradeEffects: (upgradeKey: string, effectKey: string, mode?: CalculationMode) => number | boolean;
    getShopLevel: (upgradeKey: string, mode?: CalculationMode) => number;
    getShopLevelDependencies: (upgradeKey: string) => number[];
    getAmbrosiaUpgradeEffects: (upgradeKey: string, mode?: CalculationMode) => any;
    getRedAmbrosiaUpgradeEffects: (upgradeKey: string) => any;
    getRuneEffectiveLevel: (rune: RuneKeys) => number;
    getRuneEffects: (rune: RuneKeys) => any;
    getTalismanEffects: <K extends TalismanKeys>(t: K, rarity?: number) => TalismanTypeMap[K];
    calculateEventSourceBuff: (buffType: EventBuffType) => number;
    calculateSingularityDebuff: (debuff: SingularityDebuffs, singularityCount?: number) => number;
    calculateSynergismLevel: () => number;
    calculateChallenge15Reward: (rewardName: string) => number;
    getSavedUpgradeFreeLevel: (upgrade?: { freeLevel?: number; freeLevels?: number }) => number;
    checkCalculationCache: (cacheName: keyof CalculationCache, calculationVars: number[]) => number | undefined;
    updateCalculationCache: (cacheName: keyof CalculationCache, item: CachedValue) => void;
    getCampaignTokens: () => number;
    getVanillaGlobalEventAmbrosiaLuck: () => number;
    getEventBellAmount: () => number;
}

export class LuckHelper {
    readonly #ctx: LuckHelperContext;

    constructor(ctx: LuckHelperContext) {
        this.#ctx = ctx;
    }

    calculateLuck(reduce_vals = true, true_base = false): { luckBase: number; luckMult: number; luckTotal: number } | { luckBase: number[]; luckMult: number[] } {
        const data = this.#ctx.getGameData();
        if (!data) return reduce_vals ? { luckBase: 0, luckMult: 0, luckTotal: 0 } : { luckBase: [0], luckMult: [0] };

        const { additiveComponents, rawLuckComponents } = this.getLuckCalculationComponentValues(true_base);

        if (reduce_vals) {
            const additivesTotal = additiveComponents.reduce((a, b) => a + b, 0);
            const rawTotal = rawLuckComponents.reduce((a, b) => a + b, 0);
            return {
                luckBase: rawTotal,
                luckMult: additivesTotal,
                luckTotal: additivesTotal * rawTotal,
            };
        }

        return {
            luckBase: rawLuckComponents,
            luckMult: additiveComponents,
        };
    }

    calculateLuckConversion(reduce_vals = true, true_base = false) {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const cacheName = (`LuckConversion${true_base ? '_TRUE_BASE' : ''}`) as keyof CalculationCache;
        const calculationVars: number[] = this.getLuckConversionCalculationDeps();
        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (reduce_vals && cached !== undefined) return cached;

        const mode: CalculationMode = true_base ? 'true_base' : 'normal';
        const c1 = this.#ctx.getRedAmbrosiaUpgradeEffects('conversionImprovement1').conversionImprovement;
        const c2 = this.#ctx.getRedAmbrosiaUpgradeEffects('conversionImprovement2').conversionImprovement;
        const c3 = this.#ctx.getRedAmbrosiaUpgradeEffects('conversionImprovement3').conversionImprovement;
        const horseShoeLevel = this.#ctx.getRuneEffectiveLevel('horseShoe');

        const effectiveShopRedLuck1 = this.#ctx.getShopLevel('shopRedLuck1', mode);
        const effectiveShopRedLuck2 = this.#ctx.getShopLevel('shopRedLuck2', mode);
        const effectiveShopRedLuck3 = this.#ctx.getShopLevel('shopRedLuck3', mode);

        const vals = [
            20,
            c1,
            c2,
            c3,
            -0.01 * Math.floor(effectiveShopRedLuck1 / 20),
            -0.01 * Math.floor(effectiveShopRedLuck2 / 20),
            -0.01 * Math.floor(effectiveShopRedLuck3 / 20),
            -0.5 * horseShoeLevel / (horseShoeLevel + 50),
        ];

        const reduced = vals.reduce((a, b) => a + b, 0);
        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduce_vals ? reduced : vals;
    }

    calculateRedAmbrosiaLuck(reduce_vals = true, true_base = true) {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const cacheName = 'RedAmbrosiaLuck' as keyof CalculationCache;
        const pseudoLvl = this.#ctx.getPCoinUpgradeLevel('RED_LUCK_BUFF');
        const pseudoLuck = pseudoLvl ? pseudoLvl * 20 : 0;
        const cube77 = data.cubeUpgrades[77] ?? 0;

        const calculationVars: number[] = [
            pseudoLuck,
            1,
            data.singularityChallenges.noSingularityUpgrades.completions,
            data.highestSingularityCount,
            ...this.#ctx.getShopLevelDependencies('shopAmbrosiaLuckMultiplier4'),
            data.singularityChallenges.noAmbrosiaUpgrades.completions,
            cube77,
            this.#ctx.isEvent ? 1 : 0,
            this.#ctx.getVanillaGlobalEventAmbrosiaLuck(),
            this.#ctx.getEventBellAmount(),
            data.ambrosiaUpgrades.ambrosiaLuck4.ambrosiaInvested,
            data.ambrosiaUpgrades.ambrosiaBrickOfLead.ambrosiaInvested,
            data.singularityChallenges.taxmanLastStand.completions,
            parseGameDataNumber(data.talismans.horseShoe.shard),
            parseGameDataNumber(data.talismans.horseShoe.commonFragment),
            parseGameDataNumber(data.talismans.horseShoe.uncommonFragment),
            parseGameDataNumber(data.talismans.horseShoe.rareFragment),
            parseGameDataNumber(data.talismans.horseShoe.epicFragment),
            parseGameDataNumber(data.talismans.horseShoe.legendaryFragment),
            parseGameDataNumber(data.talismans.horseShoe.mythicalFragment),
            this.#ctx.getPCoinUpgradeLevel('AMBROSIA_LUCK_BUFF'),
            this.#ctx.getCampaignTokens(),
            data.goldenQuarkUpgrades.singAmbrosiaLuck.level,
            data.goldenQuarkUpgrades.singAmbrosiaLuck2.level,
            data.goldenQuarkUpgrades.singAmbrosiaLuck3.level,
            data.goldenQuarkUpgrades.singAmbrosiaLuck4.level,
            data.highestSingularityCount >= 131 ? 1 : 0,
            data.highestSingularityCount >= 269 ? 1 : 0,
            ...this.getAmbrosiaLuckShopUpgradeCalculationDeps(),
            ...this.getAmbrosiaLuckSingularityUpgradeCalculationDeps(),
            ...this.getAmbrosiaLuckOcteractUpgradeCalculationDeps(),
            ...this.#ctx.getShopLevelDependencies('shopOcteractAmbrosiaLuck'),
            data.shopUpgrades.shopPanthema,
            data.ambrosiaUpgrades.ambrosiaFreeLuckUpgrades.ambrosiaInvested,
            data.redAmbrosiaUpgrades.freeLevelsRow2,
            data.highestSingularityCount,
            data.goldenQuarkUpgrades.singInfiniteShopUpgrades.level,
            data.octUpgrades.octeractInfiniteShopUpgrades.level,
            data.shopUpgrades.shopInfiniteShopUpgrades,
            data.redAmbrosiaUpgrades.infiniteShopUpgrades,
            ...(Object.values(data.singularityChallenges) as any[]).map((c) => c.completions),
            ...(data.singularityChallenges.noAmbrosiaUpgrades.enabled
                ? []
                : [
                    data.redAmbrosiaUpgrades.freeLevelsRow4,
                    data.redAmbrosiaUpgrades.freeLevelsRow5,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades1.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades2.ambrosiaInvested,
                ]),
            data.redAmbrosiaUpgrades.redLuck,
            data.redAmbrosiaUpgrades.viscount,
            ...this.getLuckConversionCalculationDeps(),
        ].flat();

        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (reduce_vals && cached !== undefined) return cached;

        const redLuck = this.#ctx.getRedAmbrosiaUpgradeEffects('redLuck').redAmbrosiaLuck;
        const viscount = this.#ctx.getRedAmbrosiaUpgradeEffects('viscount').redLuckBonus;
        const horseShoeLevel = this.#ctx.getRuneEffectiveLevel('horseShoe');
        const { additiveComponents, rawLuckComponents } = this.getLuckCalculationComponentValues(true_base);

        const mode = true_base ? 'true_base' as const : 'normal' as const;
        const effectiveShopRedLuck1 = this.#ctx.getShopLevel('shopRedLuck1', mode);
        const effectiveShopRedLuck2 = this.#ctx.getShopLevel('shopRedLuck2', mode);
        const effectiveShopRedLuck3 = this.#ctx.getShopLevel('shopRedLuck3', mode);
        const luckConversion = this.calculateLuckConversion(true, true_base) as number;
        const panthemaRedLuck = this.calculatePanthemaRedLuck(true_base);
        const synergismLevelBonus = Math.max(0, (this.#ctx.calculateSynergismLevel() ?? 0) - 259);

        const totalLuck = additiveComponents.reduce((a, b) => a + b, 0) * rawLuckComponents.reduce((a, b) => a + b, 0);
        const vals = [
            100,
            pseudoLuck,
            synergismLevelBonus,
            Math.floor((totalLuck - 100) / luckConversion),
            redLuck,
            this.#ctx.getSingularityChallengeEffect('noAmbrosiaUpgrades', 'redLuck'),
            effectiveShopRedLuck1 * 0.05,
            effectiveShopRedLuck2 * 0.075,
            effectiveShopRedLuck3 * 0.1,
            viscount,
            horseShoeLevel * 0.2,
            panthemaRedLuck,
        ];

        const reduced = vals.reduce((a, b) => a + b, 0);
        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduce_vals ? reduced : vals;
    }

    calculateDilatedFiveLeafBonus() {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const cacheName = 'DilatedFiveLeafBonus' as keyof CalculationCache;
        const calculationVars: number[] = [data.highestSingularityCount];
        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached;

        const thresholds = [100, 150, 200, 225, 250, 255, 260, 265, 269, 272];
        let val = thresholds.length / 100;
        for (let i = 0; i < thresholds.length; i++) {
            if (data.highestSingularityCount < thresholds[i]) {
                val = i / 100;
                break;
            }
        }

        this.#ctx.updateCalculationCache(cacheName, { value: val, cachedBy: calculationVars });
        return val;
    }

    calculateAmbrosiaLuckShopUpgrade(reduce_vals = true, true_base = false) {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const cacheName = (`AmbrosiaLuckShopUpgrade${true_base ? '_TRUE_BASE' : ''}`) as keyof CalculationCache;
        const calculationVars = [...this.getAmbrosiaLuckShopUpgradeCalculationDeps(), true_base ? 1 : 0];
        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (reduce_vals && cached !== undefined) return cached;

        const noQuarkUpgrades = data.singularityChallenges.noQuarkUpgrades.enabled;
        const ambrosiaLuckBonusLevels = true_base
            ? this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaFreeLuckUpgrades', 'true_base').freeLuckUpgrades
            : this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaFreeLuckUpgrades').freeLuckUpgrades;

        const effectiveLevels = noQuarkUpgrades
            ? [0, 0, 0, 0]
            : [
                (data.shopUpgrades.shopAmbrosiaLuck1 ?? 0) + ambrosiaLuckBonusLevels,
                (data.shopUpgrades.shopAmbrosiaLuck2 ?? 0) + ambrosiaLuckBonusLevels,
                (data.shopUpgrades.shopAmbrosiaLuck3 ?? 0) + ambrosiaLuckBonusLevels,
                (data.shopUpgrades.shopAmbrosiaLuck4 ?? 0) + ambrosiaLuckBonusLevels,
            ];

        const vals = [
            2 * effectiveLevels[0],
            2 * effectiveLevels[1],
            2 * effectiveLevels[2],
            0.6 * effectiveLevels[3],
        ];

        const reduced = vals.reduce((a, b) => a + b, 0);
        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduce_vals ? reduced : vals;
    }

    calculatePanthemaAmbrosiaLuck(true_base = false) {
        const cacheName = (`PanthemaAmbrosiaLuck${true_base ? '_TRUE_BASE' : ''}`) as keyof CalculationCache;
        const calculationVars = [...this.getPanthemaAmbrosiaLuckCalculationDeps(), true_base ? 1 : 0];
        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached;

        const reduced = true_base
            ? this.#ctx.getShopUpgradeEffects('shopPanthema', 'ambrosiaLuck', 'true_base') as number
            : this.#ctx.getShopUpgradeEffects('shopPanthema', 'ambrosiaLuck') as number;

        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduced;
    }

    calculatePanthemaRedLuck(true_base = false) {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const cacheName = (`PanthemaRedLuck${true_base ? '_TRUE_BASE' : ''}`) as keyof CalculationCache;
        const calculationVars: number[] = [
            data.shopUpgrades.shopPanthema,
            data.ambrosiaUpgrades.ambrosiaFreeLuckUpgrades.ambrosiaInvested,
            data.redAmbrosiaUpgrades.freeLevelsRow4,
            data.highestSingularityCount,
            data.goldenQuarkUpgrades.singInfiniteShopUpgrades.level,
            data.octUpgrades.octeractInfiniteShopUpgrades.level,
            data.shopUpgrades.shopInfiniteShopUpgrades,
            data.redAmbrosiaUpgrades.infiniteShopUpgrades,
            ...(Object.values(data.singularityChallenges) as any[]).map((c) => c.completions),
            ...(data.singularityChallenges.noAmbrosiaUpgrades.enabled
                ? []
                : [
                    data.redAmbrosiaUpgrades.freeLevelsRow4,
                    data.redAmbrosiaUpgrades.freeLevelsRow5,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades1.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades2.ambrosiaInvested,
                ]),
        ].flat();

        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached;

        const reduced = true_base
            ? this.#ctx.getShopUpgradeEffects('shopPanthema', 'redLuck', 'true_base') as number
            : this.#ctx.getShopUpgradeEffects('shopPanthema', 'redLuck') as number;

        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduced;
    }

    calculateCampaignLuckBonus() {
        const tokens = this.#ctx.getCampaignTokens();
        const cacheName = 'CampaignLuckBonus' as keyof CalculationCache;
        const calculationVars: number[] = [tokens];
        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached;

        let campaignBonus;
        if (tokens < 2000) {
            campaignBonus = 0;
        } else {
            campaignBonus = 10
                + 40 * 1 / 2000 * Math.min(tokens - 2000, 2000)
                + 50 * (1 - Math.exp(-Math.max(tokens - 4000, 0) / 2500));
        }

        this.#ctx.updateCalculationCache(cacheName, { value: campaignBonus, cachedBy: calculationVars });
        return campaignBonus;
    }

    calculateCookieUpgrade29Luck() {
        const data = this.#ctx.getGameData();
        if (!data) return 0;
        return (data.cubeUpgrades[79] === 0 || data.lifetimeRedAmbrosia === 0)
            ? 0
            : 10 * Math.pow(Math.log10(data.lifetimeRedAmbrosia), 2);
    }

    calculateAmbrosiaLuckSingularityUpgrade(reduce_vals = true) {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const vals = [
            +data.goldenQuarkUpgrades.singAmbrosiaLuck.level * 4,
            +data.goldenQuarkUpgrades.singAmbrosiaLuck2.level * 2,
            +data.goldenQuarkUpgrades.singAmbrosiaLuck3.level * 3,
            +data.goldenQuarkUpgrades.singAmbrosiaLuck4.level * 5,
        ];

        const reduced = vals.reduce((a, b) => a + b, 0);
        return reduce_vals ? reduced : vals;
    }

    calculateSingularityAmbrosiaLuckMilestoneBonus() {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        let bonus = 0;
        const thresholds1 = [35, 42, 49, 56, 63, 70, 77];
        const thresholds2 = [135, 142, 149, 156, 163, 170, 177];

        for (const threshold of thresholds1) {
            if (data.highestSingularityCount >= threshold) bonus += 5;
        }
        for (const threshold of thresholds2) {
            if (data.highestSingularityCount >= threshold) bonus += 6;
        }

        return bonus;
    }

    calculateAmbrosiaLuckOcteractUpgrade(reduce_vals = true) {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const cacheName = 'AmbrosiaLuckOcteractUpgrade' as keyof CalculationCache;
        const calculationVars = this.getAmbrosiaLuckOcteractUpgradeCalculationDeps();
        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (reduce_vals && cached !== undefined) return cached;

        const vals = [
            +data.octUpgrades.octeractAmbrosiaLuck.level * 4,
            +data.octUpgrades.octeractAmbrosiaLuck2.level * 2,
            +data.octUpgrades.octeractAmbrosiaLuck3.level * 3,
            +data.octUpgrades.octeractAmbrosiaLuck4.level * 5,
        ];

        const reduced = vals.reduce((a, b) => a + b, 0);
        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduce_vals ? reduced : vals;
    }

    private getLuckCalculationComponentValues(true_base = false) {
        const data = this.#ctx.getGameData();
        if (!data) {
            return { additiveComponents: [0], rawLuckComponents: [0] };
        }

        const mode: CalculationMode = true_base ? 'true_base' : 'normal';
        const cube77 = data.cubeUpgrades[77] ?? 0;
        const P_BUFF_LVL = this.#ctx.getPCoinUpgradeLevel('AMBROSIA_LUCK_BUFF');
        const P_BUFF = P_BUFF_LVL ? P_BUFF_LVL * 20 : 0;

        const additiveComponents: number[] = [
            1,
            this.#ctx.getSingularityChallengeEffect('noSingularityUpgrades', 'additiveLuckMult'),
            this.calculateDilatedFiveLeafBonus(),
            this.#ctx.getShopUpgradeEffects('shopAmbrosiaLuckMultiplier4', 'additiveAmbrosiaLuckMult') as number,
            this.#ctx.getSingularityChallengeEffect('noAmbrosiaUpgrades', 'additiveLuckMult'),
            0.001 * cube77,
            this.#ctx.isEvent ? this.#ctx.calculateEventSourceBuff(EventBuffType.AmbrosiaLuck) : 0,
            this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaLuck4', mode).ambrosiaLuckPercentage,
            this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaBrickOfLead', mode).additiveLuckMult,
            this.#ctx.getTalismanEffects('horseShoe').luckPercentage,
        ];

        const rawLuckComponents: number[] = [
            100,
            P_BUFF,
            this.calculateCampaignLuckBonus(),
            this.calculateSingularityAmbrosiaLuckMilestoneBonus(),
            this.calculateAmbrosiaLuckShopUpgrade(true, true_base) as number,
            this.calculateAmbrosiaLuckSingularityUpgrade(true),
            this.calculateAmbrosiaLuckOcteractUpgrade(true),
            data.highestSingularityCount >= 131 ? 131 : 0,
            data.highestSingularityCount >= 269 ? 269 : 0,
            this.#ctx.getShopUpgradeEffects('shopOcteractAmbrosiaLuck', 'ambrosiaLuck') as number,
            this.calculatePanthemaAmbrosiaLuck(true_base),
            this.#ctx.getSingularityChallengeEffect('noAmbrosiaUpgrades', 'ambrosiaLuck'),
            this.#ctx.getRedAmbrosiaUpgradeEffects('regularLuck').ambrosiaLuck,
            this.#ctx.getRedAmbrosiaUpgradeEffects('regularLuck2').ambrosiaLuck,
            this.#ctx.getRedAmbrosiaUpgradeEffects('viscount').luckBonus,
            2 * cube77,
            this.calculateCookieUpgrade29Luck(),
            this.#ctx.getShopUpgradeEffects('shopAmbrosiaUltra', 'ambrosiaLuck') as number,
            Math.max(0, ((this.#ctx.calculateSynergismLevel() ?? 0) - 229) * 4),
            this.#ctx.getRuneEffectiveLevel('horseShoe'),
            this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaLuck1', mode).ambrosiaLuck,
            this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaLuck2', mode).ambrosiaLuck,
            this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaLuck3', mode).ambrosiaLuck,
            this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaCubeLuck1', mode).ambrosiaLuck,
            this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaQuarkLuck1', mode).ambrosiaLuck,
        ];

        return { additiveComponents, rawLuckComponents };
    }

    private getLuckConversionCalculationDeps(): number[] {
        const data = this.#ctx.getGameData();
        if (!data) return [0];

        return [
            data.shopUpgrades.shopRedLuck1,
            data.shopUpgrades.shopRedLuck2,
            data.shopUpgrades.shopRedLuck3,
            data.redAmbrosiaUpgrades.conversionImprovement1,
            data.redAmbrosiaUpgrades.conversionImprovement2,
            data.redAmbrosiaUpgrades.conversionImprovement3,
            ...this.getHorseShoeLevelCalculationDeps(),
            data.ambrosiaUpgrades.ambrosiaFreeRedLuckUpgrades.ambrosiaInvested,
            data.redAmbrosiaUpgrades.freeLevelsRow4,
        ];
    }

    private getHorseShoeLevelCalculationDeps(): number[] {
        const data = this.#ctx.getGameData();
        if (!data) return [0];

        return [
            parseGameDataDecimal(data.runes.horseShoe).log10(),
            data.singularityChallenges.taxmanLastStand.completions,
            ...this.#ctx.getShopLevelDependencies('shopHorseShoe'),
        ];
    }

    private getAmbrosiaLuckShopUpgradeCalculationDeps(): number[] {
        const data = this.#ctx.getGameData();
        if (!data) return [0];

        return [
            data.shopUpgrades.shopAmbrosiaLuck1,
            data.shopUpgrades.shopAmbrosiaLuck2,
            data.shopUpgrades.shopAmbrosiaLuck3,
            data.shopUpgrades.shopAmbrosiaLuck4,
            data.ambrosiaUpgrades.ambrosiaFreeLuckUpgrades.ambrosiaInvested,
            data.redAmbrosiaUpgrades.freeLevelsRow2,
            data.singularityChallenges.noAmbrosiaUpgrades.enabled ? 1 : 0,
        ];
    }

    private getPanthemaAmbrosiaLuckCalculationDeps(): number[] {
        const data = this.#ctx.getGameData();
        if (!data) return [0];

        return [
            data.shopUpgrades.shopPanthema,
            data.ambrosiaUpgrades.ambrosiaFreeLuckUpgrades.ambrosiaInvested,
            data.redAmbrosiaUpgrades.freeLevelsRow2,
            data.highestSingularityCount,
            data.goldenQuarkUpgrades.singInfiniteShopUpgrades.level,
            data.octUpgrades.octeractInfiniteShopUpgrades.level,
            data.shopUpgrades.shopInfiniteShopUpgrades,
            data.redAmbrosiaUpgrades.infiniteShopUpgrades,
            ...(Object.values(data.singularityChallenges) as any[]).map((c) => c.completions),
            ...(data.singularityChallenges.noAmbrosiaUpgrades.enabled
                ? []
                : [
                    data.redAmbrosiaUpgrades.freeLevelsRow4,
                    data.redAmbrosiaUpgrades.freeLevelsRow5,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades1.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades2.ambrosiaInvested,
                ]),
        ].flat();
    }

    private getAmbrosiaLuckSingularityUpgradeCalculationDeps(): number[] {
        const data = this.#ctx.getGameData();
        if (!data) return [0];

        return [
            data.goldenQuarkUpgrades.singAmbrosiaLuck.level,
            data.goldenQuarkUpgrades.singAmbrosiaLuck2.level,
            data.goldenQuarkUpgrades.singAmbrosiaLuck3.level,
            data.goldenQuarkUpgrades.singAmbrosiaLuck4.level,
        ];
    }

    private getAmbrosiaLuckOcteractUpgradeCalculationDeps(): number[] {
        const data = this.#ctx.getGameData();
        if (!data) return [0];

        return [
            data.octUpgrades.octeractAmbrosiaLuck.level,
            data.octUpgrades.octeractAmbrosiaLuck2.level,
            data.octUpgrades.octeractAmbrosiaLuck3.level,
            data.octUpgrades.octeractAmbrosiaLuck4.level,
        ];
    }
}
