import Decimal from "break_infinity.js";
import { HSUtils } from "../../hs-utils/hs-utils";
import type { Achievement, AchievementRewards, RuneKeys, AchievementHelperContext, CalculationCache } from "../../../types/data-types/hs-gamedata-api-types";
import { AntProducers, AntUpgrades } from "../../../types/data-types/hs-gamedata-api-types";
import type { Player } from "../../../types/data-types/hs-player-savedata";
import { ACHIEVEMENT_REWARD_TYPES } from "../../../types/data-types/hs-gamedata-api-types";

const ACHIEVEMENT_REWARD_CACHE_PREFIX = 'ACH_REWARD_';

const flattenNumericValues = (value: unknown, depth = 2): number[] => {
    if (depth < 0 || value === null || value === undefined) return [];
    if (typeof value === 'number') return [value];
    if (typeof value === 'boolean') return [Number(value)];
    if (value instanceof Decimal) return [value.toNumber()];
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? [parsed] : [];
    }
    if (Array.isArray(value)) {
        return value.flatMap((item) => flattenNumericValues(item, depth - 1));
    }
    if (typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).flatMap((item) => flattenNumericValues(item, depth - 1));
    }
    return [];
};

const getAchievementRewardCacheName = (rewardType: AchievementRewards, suffix: 'sum' | 'product' | 'unlock'): string =>
    `${ACHIEVEMENT_REWARD_CACHE_PREFIX}${suffix}_${rewardType}`;

const getAchievementRewardCalculationVars = (env: AchievementHelperContext): number[] => {
    const data = env.getGameData();
    if (!data) return [];

    return [
        ...Object.values(data.achievements).map((value) => Number(value)),
        ...Object.values(data.progressiveAchievements).map((value) => Number(value)),
        ...(data.stats ? flattenNumericValues(data.stats, 3) : []),
        ...(data.unlocks ? flattenNumericValues(data.unlocks, 3) : []),
        ...(data.runes ? flattenNumericValues(data.runes, 2) : []),
        ...(data.shopUpgrades ? flattenNumericValues(data.shopUpgrades, 2) : []),
        ...(data.goldenQuarkUpgrades ? flattenNumericValues(data.goldenQuarkUpgrades, 2) : []),
        ...(data.octUpgrades ? flattenNumericValues(data.octUpgrades, 2) : []),
        ...(data.ambrosiaUpgrades ? flattenNumericValues(data.ambrosiaUpgrades, 2) : []),
        ...(data.redAmbrosiaUpgrades ? flattenNumericValues(data.redAmbrosiaUpgrades, 2) : []),
        ...(data.constantUpgrades ? flattenNumericValues(data.constantUpgrades, 2) : []),
        ...(data.cubeUpgrades ? flattenNumericValues(data.cubeUpgrades, 2) : []),
        ...(data.singularityChallenges ? flattenNumericValues(data.singularityChallenges, 2) : []),
        ...(data.currentChallenge ? flattenNumericValues(data.currentChallenge, 2) : []),
        Number(data.prestigePoints ?? 0),
        Number(data.transcendPoints ?? 0),
        Number(data.reincarnationPoints ?? 0),
        Number(data.firstOwnedCoin ?? 0),
        Number(data.secondOwnedCoin ?? 0),
        Number(data.thirdOwnedCoin ?? 0),
        Number(data.fourthOwnedCoin ?? 0),
        Number(data.fifthOwnedCoin ?? 0),
        Number(data.highestSingularityCount ?? 0),
    ];
};

export class AchievementHelper {
    readonly #ctx: AchievementHelperContext;

    constructor(context: AchievementHelperContext) {
        this.#ctx = context;
        this.R_achievements = this.buildAchievements();
        this.R_calculateAchievementsByReward = this.buildCalculateAchievementsByReward();
        this.R_AchRewards = this.buildAchievementRewards();
    }

    get gameData(): Player | undefined {
        return this.#ctx.getGameData();
    }

    public readonly R_achievements: Achievement[];

    get achievements(): Achievement[] {
        return this.R_achievements;
    }

    get campaignData(): any {
        return this.#ctx.getCampaignData();
    }

    private hasAchievement(index: number): boolean {
        return Boolean(this.gameData?.achievements[index]);
    }

    private static floorLog10PlusOne(value: number): number {
        return value > 0 ? 1 + Math.floor(Math.log10(value)) : 1;
    }

    private sumAchievementRewards<K extends AchievementRewards>(rewardType: K, getter: (reward: any) => number): number {
        const cacheName = getAchievementRewardCacheName(rewardType, 'sum') as keyof CalculationCache;
        const calculationVars = getAchievementRewardCalculationVars(this.#ctx);
        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached;

        const result = this.R_calculateAchievementsByReward[rewardType].reduce(
            (sum, index) => sum + (this.hasAchievement(index) ? getter(this.achievements[index].reward!) : 0),
            0,
        );

        this.#ctx.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
        return result;
    }

    private productAchievementRewards<K extends AchievementRewards>(rewardType: K, getter: (reward: any) => number): number {
        const cacheName = getAchievementRewardCacheName(rewardType, 'product') as keyof CalculationCache;
        const calculationVars = getAchievementRewardCalculationVars(this.#ctx);
        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached;

        const result = this.R_calculateAchievementsByReward[rewardType].reduce(
            (prod, index) => prod * (this.hasAchievement(index) ? getter(this.achievements[index].reward!) : 1),
            1,
        );

        this.#ctx.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
        return result;
    }

    private achievementUnlocked(rewardType: AchievementRewards): boolean {
        const cacheName = getAchievementRewardCacheName(rewardType, 'unlock') as keyof CalculationCache;
        const calculationVars = getAchievementRewardCalculationVars(this.#ctx);
        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached === 1;

        const result = (() => {
            const indices = this.R_calculateAchievementsByReward[rewardType];
            return indices.length > 0 && this.hasAchievement(indices[0]);
        })();

        this.#ctx.updateCalculationCache(cacheName, { value: result ? 1 : 0, cachedBy: calculationVars });
        return result;
    }

    public readonly R_calculateAchievementsByReward: Record<AchievementRewards, number[]>;

    public readonly R_AchRewards: Record<AchievementRewards, () => number | boolean>;

    private buildAchievements(): Achievement[] {
        return [
    { pointValue: 5, unlockCondition: () => true, group: 'ungrouped' }, // Free Achievement Perhaps?
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.firstOwnedCoin ?? 0) >= 1,
        group: 'firstOwnedCoin',
    },
    { pointValue: 10, unlockCondition: () => (this.gameData?.firstOwnedCoin ?? 0) >= 10, group: 'firstOwnedCoin' },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.firstOwnedCoin ?? 0) >= 100,
        group: 'firstOwnedCoin',
        reward: { acceleratorPower: () => 0.001 }
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.firstOwnedCoin ?? 0) >= 1000,
        group: 'firstOwnedCoin',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 2
    },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.firstOwnedCoin ?? 0) >= 5000,
        group: 'firstOwnedCoin',
        reward: { accelerators: () => Math.floor((this.gameData?.firstOwnedCoin ?? 0) / 500) }
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.firstOwnedCoin ?? 0) >= 10000,
        group: 'firstOwnedCoin',
        reward: { multipliers: () => Math.floor((this.gameData?.firstOwnedCoin ?? 0) / 1000) }
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.firstOwnedCoin ?? 0) >= 20000,
        group: 'firstOwnedCoin',
        reward: { accelBoosts: () => Math.floor((this.gameData?.firstOwnedCoin ?? 0) / 2000) }
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.secondOwnedCoin ?? 0) >= 1,
        group: 'secondOwnedCoin',
    },
    { pointValue: 10, unlockCondition: () => (this.gameData?.secondOwnedCoin ?? 0) >= 10, group: 'secondOwnedCoin' },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.secondOwnedCoin ?? 0) >= 100,
        group: 'secondOwnedCoin',
        reward: { acceleratorPower: () => 0.0015 }
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.secondOwnedCoin ?? 0) >= 500,
        group: 'secondOwnedCoin',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 2
    },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.secondOwnedCoin ?? 0) >= 5000,
        group: 'secondOwnedCoin',
        reward: { accelerators: () => Math.floor((this.gameData?.secondOwnedCoin ?? 0) / 500) }
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.secondOwnedCoin ?? 0) >= 10000,
        group: 'secondOwnedCoin',
        reward: { multipliers: () => Math.floor((this.gameData?.secondOwnedCoin ?? 0) / 1000) }
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.secondOwnedCoin ?? 0) >= 20000,
        group: 'secondOwnedCoin',
        reward: { accelBoosts: () => Math.floor((this.gameData?.secondOwnedCoin ?? 0) / 2000) }
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.thirdOwnedCoin ?? 0) >= 1,
        group: 'thirdOwnedCoin',
    },
    { pointValue: 10, unlockCondition: () => (this.gameData?.thirdOwnedCoin ?? 0) >= 10, group: 'thirdOwnedCoin' },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.thirdOwnedCoin ?? 0) >= 100,
        group: 'thirdOwnedCoin',
        reward: { acceleratorPower: () => 0.002 }
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.thirdOwnedCoin ?? 0) >= 333,
        group: 'thirdOwnedCoin',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 2
    },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.thirdOwnedCoin ?? 0) >= 5000,
        group: 'thirdOwnedCoin',
        reward: { accelerators: () => Math.floor((this.gameData?.thirdOwnedCoin ?? 0) / 500) }
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.thirdOwnedCoin ?? 0) >= 10000,
        group: 'thirdOwnedCoin',
        reward: { multipliers: () => Math.floor((this.gameData?.thirdOwnedCoin ?? 0) / 1000) }
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.thirdOwnedCoin ?? 0) >= 20000,
        group: 'thirdOwnedCoin',
        reward: { accelBoosts: () => Math.floor((this.gameData?.thirdOwnedCoin ?? 0) / 2000) }
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.fourthOwnedCoin ?? 0) >= 1,
        group: 'fourthOwnedCoin',
    },
    { pointValue: 10, unlockCondition: () => (this.gameData?.fourthOwnedCoin ?? 0) >= 10, group: 'fourthOwnedCoin' },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.fourthOwnedCoin ?? 0) >= 100,
        group: 'fourthOwnedCoin',
        reward: { acceleratorPower: () => 0.002 }
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.fourthOwnedCoin ?? 0) >= 333,
        group: 'fourthOwnedCoin',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 2
    },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.fourthOwnedCoin ?? 0) >= 5000,
        group: 'fourthOwnedCoin',
        reward: { accelerators: () => Math.floor((this.gameData?.fourthOwnedCoin ?? 0) / 500) }
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.fourthOwnedCoin ?? 0) >= 10000,
        group: 'fourthOwnedCoin',
        reward: { multipliers: () => Math.floor((this.gameData?.fourthOwnedCoin ?? 0) / 1000) }
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.fourthOwnedCoin ?? 0) >= 20000,
        group: 'fourthOwnedCoin',
        reward: { accelBoosts: () => Math.floor((this.gameData?.fourthOwnedCoin ?? 0) / 2000) }
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.fifthOwnedCoin ?? 0) >= 1,
        group: 'fifthOwnedCoin',
    },
    { pointValue: 10, unlockCondition: () => (this.gameData?.fifthOwnedCoin ?? 0) >= 10, group: 'fifthOwnedCoin' },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.fifthOwnedCoin ?? 0) >= 66,
        group: 'fifthOwnedCoin',
        reward: { acceleratorPower: () => 0.003 }
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.fifthOwnedCoin ?? 0) >= 200,
        group: 'fifthOwnedCoin',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 2
    },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.fifthOwnedCoin ?? 0) >= 6666,
        group: 'fifthOwnedCoin',
        reward: { accelerators: () => Math.floor((this.gameData?.fifthOwnedCoin ?? 0) / 500) }
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.fifthOwnedCoin ?? 0) >= 17777,
        group: 'fifthOwnedCoin',
        reward: { multipliers: () => Math.floor((this.gameData?.fifthOwnedCoin ?? 0) / 1000) }
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.fifthOwnedCoin ?? 0) >= 42777,
        group: 'fifthOwnedCoin',
        reward: { accelBoosts: () => Math.floor((this.gameData?.fifthOwnedCoin ?? 0) / 2000) }
    },
    {
        pointValue: 5,
        unlockCondition: () => this.R_getPrestigePointGain().gte(1),
        group: 'prestigePointGain',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 2,
    },
    {
        pointValue: 10,
        unlockCondition: () => this.R_getPrestigePointGain().gte(1e6),
        group: 'prestigePointGain',
        reward: { crystalMultiplier: () => Math.max(1, Decimal.log((this.gameData?.prestigePoints ?? 0), Math.E)) },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 15,
        unlockCondition: () => this.R_getPrestigePointGain().gte(1e100),
        group: 'prestigePointGain',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    { pointValue: 20, unlockCondition: () => this.R_getPrestigePointGain().gte('1e1000'), group: 'prestigePointGain' },
    { pointValue: 25, unlockCondition: () => this.R_getPrestigePointGain().gte('1e10000'), group: 'prestigePointGain' },
    { pointValue: 30, unlockCondition: () => this.R_getPrestigePointGain().gte('1e77777'), group: 'prestigePointGain' },
    { pointValue: 35, unlockCondition: () => this.R_getPrestigePointGain().gte('1e250000'), group: 'prestigePointGain' },
    {
        pointValue: 5,
        unlockCondition: () => this.R_getTranscendPointGain().gte(1),
        group: 'transcendPointGain',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 2,
    },
    {
        pointValue: 10,
        unlockCondition: () => this.R_getTranscendPointGain().gte(1e6),
        group: 'transcendPointGain',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 15,
        unlockCondition: () => this.R_getTranscendPointGain().gte(1e50),
        group: 'transcendPointGain',
        reward: { taxReduction: () => 0.95 }
    },
    {
        pointValue: 20,
        unlockCondition: () => this.R_getTranscendPointGain().gte(1e308),
        group: 'transcendPointGain',
        reward: { taxReduction: () => 0.95 }
    },
    {
        pointValue: 25,
        unlockCondition: () => this.R_getTranscendPointGain().gte('1e1500'),
        group: 'transcendPointGain',
        reward: { taxReduction: () => 0.9 }
    },
    { pointValue: 30, unlockCondition: () => this.R_getTranscendPointGain().gte('1e25000'), group: 'transcendPointGain' },
    { pointValue: 35, unlockCondition: () => this.R_getTranscendPointGain().gte('1e100000'), group: 'transcendPointGain' },
    {
        pointValue: 5,
        unlockCondition: () => this.R_getReincarnationPointGain().gte(1),
        group: 'reincarnationPointGain',
        reward: { particleGain: () => 2 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3,
    },
    { pointValue: 10, unlockCondition: () => this.R_getReincarnationPointGain().gte(1e5), group: 'reincarnationPointGain' },
    { pointValue: 15, unlockCondition: () => this.R_getReincarnationPointGain().gte(1e30), group: 'reincarnationPointGain' },
    {
        pointValue: 20,
        unlockCondition: () => this.R_getReincarnationPointGain().gte(1e200),
        group: 'reincarnationPointGain'
    },
    {
        pointValue: 25,
        unlockCondition: () => this.R_getReincarnationPointGain().gte('1e1500'),
        group: 'reincarnationPointGain'
    },
    {
        pointValue: 30,
        unlockCondition: () => this.R_getReincarnationPointGain().gte('1e5000'),
        group: 'reincarnationPointGain'
    },
    {
        pointValue: 35,
        unlockCondition: () => this.R_getReincarnationPointGain().gte('1e7777'),
        group: 'reincarnationPointGain'
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.prestigenomultiplier ?? false),
        group: 'ungrouped',
        reward: { multipliers: () => 1 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.transcendnomultiplier ?? false),
        group: 'ungrouped',
        reward: { multipliers: () => 2 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.reincarnatenomultiplier ?? false),
        group: 'ungrouped',
        reward: { multipliers: () => 4 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.prestigenoaccelerator ?? false),
        group: 'ungrouped',
        reward: { accelerators: () => 2 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.transcendnoaccelerator ?? false),
        group: 'ungrouped',
        reward: { accelerators: () => 4 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.reincarnatenoaccelerator ?? false),
        group: 'ungrouped',
        reward: { accelerators: () => 8 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 35,
        unlockCondition: () => {
        return (this.gameData?.coinsThisTranscension ?? new Decimal(0)).gte('1e120000') && (this.gameData?.acceleratorBought ?? 0) === 0
            && (this.gameData?.acceleratorBoostBought ?? 0) === 0
        },
        group: 'ungrouped',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.prestigenocoinupgrades ?? false),
        group: 'ungrouped',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.transcendnocoinupgrades ?? false),
        group: 'ungrouped',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.transcendnocoinorprestigeupgrades ?? false),
        group: 'ungrouped',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.reincarnatenocoinupgrades ?? false),
        group: 'ungrouped',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.reincarnatenocoinorprestigeupgrades ?? false),
        group: 'ungrouped',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.reincarnatenocoinprestigeortranscendupgrades ?? false),
        group: 'ungrouped',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 40,
        unlockCondition: () => (this.gameData?.reincarnatenocoinprestigetranscendorgeneratorupgrades ?? false),
        group: 'ungrouped',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 10,
        unlockCondition: () => {
        return HSUtils.sumContents(this.gameData?.upgrades?.slice(101, 106) ?? []) === 1 && (this.gameData?.upgrades?.[102] ?? 0) === 1
        },
        group: 'ungrouped',
        reward: { conversionExponent: () => 0.01 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 10,
        unlockCondition: () => {
        return HSUtils.sumContents(this.gameData?.upgrades?.slice(101, 106) ?? []) === 1 && (this.gameData?.upgrades?.[103] ?? 0) === 1
        },
        group: 'ungrouped',
        reward: { conversionExponent: () => 0.01 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 15,
        unlockCondition: () => {
        return HSUtils.sumContents(this.gameData?.upgrades?.slice(101, 106) ?? []) === 1 && (this.gameData?.upgrades?.[104] ?? 0) === 1
        },
        group: 'ungrouped',
        reward: { conversionExponent: () => 0.01 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 20,
        unlockCondition: () => {
        return HSUtils.sumContents(this.gameData?.upgrades?.slice(101, 106) ?? []) === 1 && (this.gameData?.upgrades?.[105] ?? 0) === 1
        },
        group: 'ungrouped',
        reward: { conversionExponent: () => 0.01 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 25,
        unlockCondition: () => {
        return this.gameData?.currentChallenge?.transcension === 1 && (this.gameData?.coinsThisTranscension ?? new Decimal(0)).gte('1e1000')
            && HSUtils.sumContents(this.gameData?.upgrades?.slice(101, 106) ?? []) === 0
        },
        group: 'ungrouped',
        reward: { conversionExponent: () => 0.01 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 25,
        unlockCondition: () => {
        return this.gameData?.currentChallenge?.transcension === 2 && (this.gameData?.coinsThisTranscension ?? new Decimal(0)).gte('1e1000')
            && HSUtils.sumContents(this.gameData?.upgrades?.slice(101, 106) ?? []) === 0
        },
        group: 'ungrouped',
        reward: { conversionExponent: () => 0.01 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 50,
        unlockCondition: () => {
        return this.gameData?.currentChallenge?.transcension === 3 && (this.gameData?.coinsThisTranscension ?? new Decimal(0)).gte('1e99999')
            && HSUtils.sumContents(this.gameData?.upgrades?.slice(101, 106) ?? []) === 0
        },
        group: 'ungrouped',
        reward: { conversionExponent: () => 0.01 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.challengecompletions?.[1] ?? 0) >= 1,
        group: 'challenge1',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3,
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.challengecompletions?.[1] ?? 0) >= 3,
        group: 'challenge1',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.challengecompletions?.[1] ?? 0) >= 5,
        group: 'challenge1',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    { pointValue: 20, unlockCondition: () => (this.gameData?.challengecompletions?.[1] ?? 0) >= 10, group: 'challenge1' },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.challengecompletions?.[1] ?? 0) >= 20,
        group: 'challenge1',
        reward: { taxReduction: () => 0.96 }
    },
    { pointValue: 30, unlockCondition: () => (this.gameData?.challengecompletions?.[1] ?? 0) >= 50, group: 'challenge1' },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.challengecompletions?.[1] ?? 0) >= 75,
        group: 'challenge1'
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.challengecompletions?.[2] ?? 0) >= 1,
        group: 'challenge2',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3,
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.challengecompletions?.[2] ?? 0) >= 3,
        group: 'challenge2',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.challengecompletions?.[2] ?? 0) >= 5,
        group: 'challenge2',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    { pointValue: 20, unlockCondition: () => (this.gameData?.challengecompletions?.[2] ?? 0) >= 10, group: 'challenge2' },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.challengecompletions?.[2] ?? 0) >= 20,
        group: 'challenge2',
        reward: { taxReduction: () => 0.96 }
    },
    { pointValue: 30, unlockCondition: () => (this.gameData?.challengecompletions?.[2] ?? 0) >= 50, group: 'challenge2' },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.challengecompletions?.[2] ?? 0) >= 75,
        group: 'challenge2'
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.challengecompletions?.[3] ?? 0) >= 1,
        group: 'challenge3',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3,
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.challengecompletions?.[3] ?? 0) >= 3,
        group: 'challenge3',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.challengecompletions?.[3] ?? 0) >= 5,
        group: 'challenge3'
    },
    { pointValue: 20, unlockCondition: () => (this.gameData?.challengecompletions?.[3] ?? 0) >= 10, group: 'challenge3' },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.challengecompletions?.[3] ?? 0) >= 20,
        group: 'challenge3',
        reward: { taxReduction: () => 0.96 }
    },
    { pointValue: 30, unlockCondition: () => (this.gameData?.challengecompletions?.[3] ?? 0) >= 50, group: 'challenge3' },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.challengecompletions?.[3] ?? 0) >= 75,
        group: 'challenge3'
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.challengecompletions?.[4] ?? 0) >= 1,
        group: 'challenge4',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3,
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.challengecompletions?.[4] ?? 0) >= 3,
        group: 'challenge4',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.challengecompletions?.[4] ?? 0) >= 5,
        group: 'challenge4'
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.challengecompletions?.[4] ?? 0) >= 10,
        group: 'challenge4'
    },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.challengecompletions?.[4] ?? 0) >= 20,
        group: 'challenge4',
        reward: { taxReduction: () => 0.96 }
    },
    { pointValue: 30, unlockCondition: () => (this.gameData?.challengecompletions?.[4] ?? 0) >= 50, group: 'challenge4' },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.challengecompletions?.[4] ?? 0) >= 75,
        group: 'challenge4'
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.challengecompletions?.[5] ?? 0) >= 1,
        group: 'challenge5',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3,
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.challengecompletions?.[5] ?? 0) >= 3,
        group: 'challenge5',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 3
    },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.challengecompletions?.[5] ?? 0) >= 5,
        group: 'challenge5'
    },
    { pointValue: 20, unlockCondition: () => (this.gameData?.challengecompletions?.[5] ?? 0) >= 10, group: 'challenge5' },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.challengecompletions?.[5] ?? 0) >= 20,
        group: 'challenge5',
        reward: { taxReduction: () => 0.96 }
    },
    { pointValue: 30, unlockCondition: () => (this.gameData?.challengecompletions?.[5] ?? 0) >= 50, group: 'challenge5' },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.challengecompletions?.[5] ?? 0) >= 75,
        group: 'challenge5'
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.challengecompletions?.[6] ?? 0) >= 1,
        group: 'challenge6',
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 4,
    },
    { pointValue: 10, unlockCondition: () => (this.gameData?.challengecompletions?.[6] ?? 0) >= 2, group: 'challenge6' },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.challengecompletions?.[6] ?? 0) >= 3,
        group: 'challenge6'
    },
    { pointValue: 20, unlockCondition: () => (this.gameData?.challengecompletions?.[6] ?? 0) >= 5, group: 'challenge6' },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.challengecompletions?.[6] ?? 0) >= 10,
        group: 'challenge6',
        reward: { taxReduction: () => 0.95 }
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.challengecompletions?.[6] ?? 0) >= 15,
        group: 'challenge6',
        reward: {
        taxReduction: () =>
            Math.pow(
            0.9925,
            (this.gameData?.challengecompletions?.[6] ?? 0) + (this.gameData?.challengecompletions?.[7] ?? 0) + (this.gameData?.challengecompletions?.[8] ?? 0)
                + (this.gameData?.challengecompletions?.[9] ?? 0) + (this.gameData?.challengecompletions?.[10] ?? 0)
            )
        }
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.challengecompletions?.[6] ?? 0) >= 25,
        group: 'challenge6'
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.challengecompletions?.[7] ?? 0) >= 1,
        group: 'challenge7',
        reward: { diamondUpgrade18: () => 0 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 7,
    },
    { pointValue: 10, unlockCondition: () => (this.gameData?.challengecompletions?.[7] ?? 0) >= 2, group: 'challenge7' },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.challengecompletions?.[7] ?? 0) >= 3,
        group: 'challenge7'
    },
    { pointValue: 20, unlockCondition: () => (this.gameData?.challengecompletions?.[7] ?? 0) >= 5, group: 'challenge7' },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.challengecompletions?.[7] ?? 0) >= 10,
        group: 'challenge7',
        reward: { taxReduction: () => 0.95 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 10
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.challengecompletions?.[7] ?? 0) >= 15,
        group: 'challenge7'
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.challengecompletions?.[7] ?? 0) >= 25,
        group: 'challenge7',
        reward: { chronosTalisman: () => 1 }
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.challengecompletions?.[8] ?? 0) >= 1,
        group: 'challenge8',
        reward: { diamondUpgrade19: () => 1 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 10,
    },
    { pointValue: 10, unlockCondition: () => (this.gameData?.challengecompletions?.[8] ?? 0) >= 2, group: 'challenge8' },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.challengecompletions?.[8] ?? 0) >= 3,
        group: 'challenge8'
    },
    { pointValue: 20, unlockCondition: () => (this.gameData?.challengecompletions?.[8] ?? 0) >= 5, group: 'challenge8' },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.challengecompletions?.[8] ?? 0) >= 10,
        group: 'challenge8',
        reward: { taxReduction: () => 0.95 }
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.challengecompletions?.[8] ?? 0) >= 15,
        group: 'challenge8'
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.challengecompletions?.[8] ?? 0) >= 25,
        group: 'challenge8',
        reward: { midasTalisman: () => 1 }
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.challengecompletions?.[9] ?? 0) >= 1,
        group: 'challenge9',
        reward: { diamondUpgrade20: () => 1 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 20,
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.challengecompletions?.[9] ?? 0) >= 2,
        group: 'challenge9',
        reward: { talismanPower: () => 0.02 }
    },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.challengecompletions?.[9] ?? 0) >= 3,
        group: 'challenge9',
        reward: { talismanPower: () => 0.02 }
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.challengecompletions?.[9] ?? 0) >= 5,
        group: 'challenge9',
        reward: { sacrificeMult: () => 1.25, experientiaAutobuy: () => 1 }
    },
    { pointValue: 25, unlockCondition: () => (this.gameData?.challengecompletions?.[9] ?? 0) >= 10, group: 'challenge9' },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.challengecompletions?.[9] ?? 0) >= 20,
        group: 'challenge9'
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.challengecompletions?.[9] ?? 0) >= 25,
        group: 'challenge9',
        reward: { metaphysicsTalisman: () => 1 }
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.challengecompletions?.[10] ?? 0) >= 1,
        group: 'challenge10',
    },
    { pointValue: 10, unlockCondition: () => (this.gameData?.challengecompletions?.[10] ?? 0) >= 2, group: 'challenge10' },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.challengecompletions?.[10] ?? 0) >= 3,
        group: 'challenge10'
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.challengecompletions?.[10] ?? 0) >= 5,
        group: 'challenge10',
        reward: { talismanPower: () => 0.025 }
    },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.challengecompletions?.[10] ?? 0) >= 10,
        group: 'challenge10',
        reward: { talismanPower: () => 0.025 }
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.challengecompletions?.[10] ?? 0) >= 20,
        group: 'challenge10'
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.challengecompletions?.[10] ?? 0) >= 25,
        group: 'challenge10',
        reward: { polymathTalisman: () => 1 }
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.acceleratorBought ?? 0) >= 5,
        group: 'accelerators',
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.acceleratorBought ?? 0) >= 25,
        group: 'accelerators',
        reward: { acceleratorPower: () => 0.01 }
    },
    { pointValue: 15, unlockCondition: () => (this.gameData?.acceleratorBought ?? 0) >= 100, group: 'accelerators' },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.acceleratorBought ?? 0) >= 666,
        group: 'accelerators',
        reward: { accelerators: () => 5 }
    },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.acceleratorBought ?? 0) >= 2000,
        group: 'accelerators',
        reward: { accelerators: () => 12 }
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.acceleratorBought ?? 0) >= 12500,
        group: 'accelerators',
        reward: { accelerators: () => 25 }
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.acceleratorBought ?? 0) >= 100000,
        group: 'accelerators',
        reward: { accelerators: () => 50 }
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.multiplierBought ?? 0) >= 2,
        group: 'multipliers',
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.multiplierBought ?? 0) >= 20,
        group: 'multipliers',
        reward: { multipliers: () => 1 }
    },
    { pointValue: 15, unlockCondition: () => (this.gameData?.multiplierBought ?? 0) >= 100, group: 'multipliers' },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.multiplierBought ?? 0) >= 500,
        group: 'multipliers',
        reward: { multipliers: () => 1 }
    },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.multiplierBought ?? 0) >= 2000,
        group: 'multipliers',
        reward: { multipliers: () => 3 }
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.multiplierBought ?? 0) >= 12500,
        group: 'multipliers',
        reward: { multipliers: () => 6 }
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.multiplierBought ?? 0) >= 100000,
        group: 'multipliers',
        reward: { multipliers: () => 10 }
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.acceleratorBoostBought ?? 0) >= 2,
        group: 'acceleratorBoosts',
    },
    { pointValue: 10, unlockCondition: () => (this.gameData?.acceleratorBoostBought ?? 0) >= 10, group: 'acceleratorBoosts' },
    { pointValue: 15, unlockCondition: () => (this.gameData?.acceleratorBoostBought ?? 0) >= 50, group: 'acceleratorBoosts' },
    { pointValue: 20, unlockCondition: () => (this.gameData?.acceleratorBoostBought ?? 0) >= 200, group: 'acceleratorBoosts' },
    { pointValue: 25, unlockCondition: () => (this.gameData?.acceleratorBoostBought ?? 0) >= 1000, group: 'acceleratorBoosts' },
    { pointValue: 30, unlockCondition: () => (this.gameData?.acceleratorBoostBought ?? 0) >= 5000, group: 'acceleratorBoosts' },
    { pointValue: 35, unlockCondition: () => (this.gameData?.acceleratorBoostBought ?? 0) >= 15000, group: 'acceleratorBoosts' },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.ants?.crumbs ?? new Decimal(0)).gte(3),
        group: 'antCrumbs',
        reward: { antSpeed: () => Decimal.log((this.gameData?.ants?.crumbs ?? new Decimal(0)).plus(10), 10) },
    },
    { pointValue: 10, unlockCondition: () => (this.gameData?.ants?.crumbs ?? new Decimal(0)).gte(1e5), group: 'antCrumbs' },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.ants?.crumbs ?? new Decimal(0)).gte(666666666),
        group: 'antCrumbs',
        reward: { antSpeed: () => 1.2 }
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.ants?.crumbs ?? new Decimal(0)).gte(1e20),
        group: 'antCrumbs',
        reward: { antSpeed: () => 1.25 }
    },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.ants?.crumbsThisSacrifice ?? new Decimal(0)).gte(1e40),
        group: 'antCrumbs',
        reward: { antSpeed: () => 1.4, antSacrificeUnlock: () => 1, antAutobuyers: () => 1 }
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.ants?.crumbs ?? new Decimal(0)).gte('1e250'),
        group: 'antCrumbs',
        reward: { antSpeed: () => 1 + (this.gameData?.ants?.immortalELO ?? 0) / 1000, scientiaAutobuy: () => 1 }
    },
    { pointValue: 35, unlockCondition: () => (this.gameData?.ants?.crumbs ?? new Decimal(0)).gte('1e2500'), group: 'antCrumbs' },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.ants?.immortalELO ?? 0) >= 50 && (this.gameData?.ants?.producers?.[AntProducers.Breeders]?.purchased ?? 0) > 0,
        group: 'sacMult',
        reward: { antAutobuyers: () => 1, inceptusAutobuy: () => 1, fortunaeAutobuy: () => 1 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 10
    },
    {
        pointValue: 10,
        unlockCondition: () =>
        (this.gameData?.ants?.immortalELO ?? 0) >= 200 && (this.gameData?.ants?.producers?.[AntProducers.MetaBreeders]?.purchased ?? 0) > 0,
        group: 'sacMult',
        reward: { antAutobuyers: () => 1, tributumAutobuy: () => 1 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 10
    },
    {
        pointValue: 15,
        unlockCondition: () =>
        (this.gameData?.ants?.immortalELO ?? 0) >= 500 && (this.gameData?.ants?.producers?.[AntProducers.MegaBreeders]?.purchased ?? 0) > 0,
        group: 'sacMult',
        reward: { antAutobuyers: () => 1, celeritasAutobuy: () => 1, exploratoremAutobuy: () => 1 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 10
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.ants?.immortalELO ?? 0) >= 1000 && (this.gameData?.ants?.producers?.[AntProducers.Queens]?.purchased ?? 0) > 0,
        group: 'sacMult',
        reward: { antAutobuyers: () => 1, sacrificiumAutobuy: () => 1 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 10
    },
    {
        pointValue: 25,
        unlockCondition: () =>
        (this.gameData?.ants?.immortalELO ?? 0) >= 2500 && (this.gameData?.ants?.producers?.[AntProducers.LordRoyals]?.purchased ?? 0) > 0,
        group: 'sacMult',
        reward: { antAutobuyers: () => 1 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 10
    },
    {
        pointValue: 30,
        unlockCondition: () =>
        (this.gameData?.ants?.immortalELO ?? 0) >= 20000 && (this.gameData?.ants?.producers?.[AntProducers.Almighties]?.purchased ?? 0) > 0,
        group: 'sacMult',
        reward: { antAutobuyers: () => 1 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 10
    },
    {
        pointValue: 35,
        unlockCondition: () =>
        (this.gameData?.ants?.immortalELO ?? 0) >= 100000 && (this.gameData?.ants?.producers?.[AntProducers.Disciples]?.purchased ?? 0) > 0,
        group: 'sacMult',
        reward: { antAutobuyers: () => 1 },
        checkReset: () => (this.gameData?.highestSingularityCount ?? 0) >= 10
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 1,
        group: 'ascensionCount',
        reward: { freeAntUpgrades: () => 2 }
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 2,
        group: 'ascensionCount',
        reward: { preserveAnthillCount: () => 1, antSacrificeCountMultiplier: () => 2 }
    },
    { pointValue: 15, unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 10, group: 'ascensionCount' },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 100,
        group: 'ascensionCount',
        reward: { wowSquareTalisman: () => 1 }
    },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 1000,
        group: 'ascensionCount',
        reward: {
        ascensionCountMultiplier: () => Math.log10(this.R_calculateAscensionScore().effectiveScore + 100) - 1
        }
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 14142,
        group: 'ascensionCount',
        reward: {
        ascensionCountAdditive: () => ((this.gameData?.ascensionCounter ?? 0) > 10) ? 100 : 0
        }
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 141421,
        group: 'ascensionCount',
        reward: {
        ascensionCountAdditive: () => ((this.gameData?.ascensionCounter ?? 0) > 10) ? (this.gameData?.ascensionCounterReal ?? 0) * 2 : 0,
        wowCubeGain: () => 1 + 2 * Math.min(1, (this.gameData?.ascensionCount ?? 0) / 5e8)
        }
    },
    { pointValue: 5, unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte(3.14), group: 'constant' },
    { pointValue: 10, unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte(1e6), group: 'constant' },
    { pointValue: 15, unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte(4.32e10), group: 'constant' },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte(6.9e21),
        group: 'constant',
        reward: { wowCubeGain: () => 1 + Decimal.log((this.gameData?.ascendShards ?? new Decimal(0)).add(1), 10) / 400 }
    },
    { pointValue: 25, unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte(1.509e33), group: 'constant' },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte(1e66),
        group: 'constant',
        reward: {
        wowCubeGain: () => 1 + 249 * Math.min(1, Decimal.log((this.gameData?.ascendShards ?? new Decimal(0)).plus(1), 10) / 100000),
        wowTesseractGain: () => 1 + 249 * Math.min(1, Decimal.log((this.gameData?.ascendShards ?? new Decimal(0)).plus(1), 10) / 100000)
        }
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte('1.8e308'),
        group: 'constant',
        reward: { wowPlatonicGain: () => 1 + 19 * Math.min(1, Decimal.log((this.gameData?.ascendShards ?? new Decimal(0)).plus(1), 10) / 100000) }
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.challengecompletions?.[11] ?? 0) >= 1,
        group: 'challenge11',
        reward: { statTracker: () => 1 },
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.challengecompletions?.[11] ?? 0) >= 2,
        group: 'challenge11'
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.challengecompletions?.[11] ?? 0) >= 3,
        group: 'challenge11'
    },
    {
        pointValue: 40,
        unlockCondition: () => (this.gameData?.challengecompletions?.[11] ?? 0) >= 5,
        group: 'challenge11'
    },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.challengecompletions?.[11] ?? 0) >= 10,
        group: 'challenge11'
    },
    {
        pointValue: 60,
        unlockCondition: () => (this.gameData?.challengecompletions?.[11] ?? 0) >= 20,
        group: 'challenge11',
        reward: { ascensionCountAdditive: () => (this.gameData?.ascensionCounter ?? 0) * 2 }
    },
    {
        pointValue: 70,
        unlockCondition: () => (this.gameData?.challengecompletions?.[11] ?? 0) >= 30,
        group: 'challenge11',
        reward: { talismanPower: () => 0.01 }
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.challengecompletions?.[12] ?? 0) >= 1,
        group: 'challenge12',
        reward: { ascensionRewardScaling: () => 1 },
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.challengecompletions?.[12] ?? 0) >= 2,
        group: 'challenge12'
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.challengecompletions?.[12] ?? 0) >= 3,
        group: 'challenge12'
    },
    {
        pointValue: 40,
        unlockCondition: () => (this.gameData?.challengecompletions?.[12] ?? 0) >= 5,
        group: 'challenge12'
    },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.challengecompletions?.[12] ?? 0) >= 10,
        group: 'challenge12'
    },
    {
        pointValue: 60,
        unlockCondition: () => (this.gameData?.challengecompletions?.[12] ?? 0) >= 20,
        group: 'challenge12',
        reward: { ascensionCountAdditive: () => (this.gameData?.ascensionCounter ?? 0) * 2 }
    },
    {
        pointValue: 70,
        unlockCondition: () => (this.gameData?.challengecompletions?.[12] ?? 0) >= 30,
        group: 'challenge12',
        reward: { talismanPower: () => 0.01 }
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.challengecompletions?.[13] ?? 0) >= 1,
        group: 'challenge13',
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.challengecompletions?.[13] ?? 0) >= 2,
        group: 'challenge13'
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.challengecompletions?.[13] ?? 0) >= 3,
        group: 'challenge13'
    },
    {
        pointValue: 40,
        unlockCondition: () => (this.gameData?.challengecompletions?.[13] ?? 0) >= 5,
        group: 'challenge13'
    },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.challengecompletions?.[13] ?? 0) >= 10,
        group: 'challenge13'
    },
    {
        pointValue: 60,
        unlockCondition: () => (this.gameData?.challengecompletions?.[13] ?? 0) >= 20,
        group: 'challenge13',
        reward: { ascensionCountAdditive: () => (this.gameData?.ascensionCounter ?? 0) * 2 }
    },
    {
        pointValue: 70,
        unlockCondition: () => (this.gameData?.challengecompletions?.[13] ?? 0) >= 30,
        group: 'challenge13',
        reward: { talismanPower: () => 0.01 }
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.challengecompletions?.[14] ?? 0) >= 1,
        group: 'challenge14',
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.challengecompletions?.[14] ?? 0) >= 2,
        group: 'challenge14'
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.challengecompletions?.[14] ?? 0) >= 3,
        group: 'challenge14'
    },
    {
        pointValue: 40,
        unlockCondition: () => (this.gameData?.challengecompletions?.[14] ?? 0) >= 5,
        group: 'challenge14'
    },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.challengecompletions?.[14] ?? 0) >= 10,
        group: 'challenge14'
    },
    {
        pointValue: 60,
        unlockCondition: () => (this.gameData?.challengecompletions?.[14] ?? 0) >= 20,
        group: 'challenge14',
        reward: {
        ascensionCountAdditive: () => (this.gameData?.ascensionCounter ?? 0) * 2,
        wowPlatonicGain: () => 1 + 2 * Math.min(1, (this.gameData?.ascensionCount ?? 0) / 2.674e9)
        }
    },
    { pointValue: 70, unlockCondition: () => (this.gameData?.challengecompletions?.[14] ?? 0) >= 30, group: 'challenge14' },
    {
        pointValue: 5,
        unlockCondition: () => this.R_calcCorruptionStuff().effectiveScore >= 1e5,
        group: 'ascensionScore',
    },
    { pointValue: 10, unlockCondition: () => this.R_calcCorruptionStuff().effectiveScore >= 1e6, group: 'ascensionScore' },
    { pointValue: 15, unlockCondition: () => this.R_calcCorruptionStuff().effectiveScore >= 1e7, group: 'ascensionScore' },
    { pointValue: 20, unlockCondition: () => this.R_calcCorruptionStuff().effectiveScore >= 1e8, group: 'ascensionScore' },
    { pointValue: 25, unlockCondition: () => this.R_calcCorruptionStuff().effectiveScore >= 1e9, group: 'ascensionScore' },
    { pointValue: 30, unlockCondition: () => this.R_calcCorruptionStuff().effectiveScore >= 5e9, group: 'ascensionScore' },
    { pointValue: 35, unlockCondition: () => this.R_calcCorruptionStuff().effectiveScore >= 2.5e10, group: 'ascensionScore' },
    { pointValue: 10, unlockCondition: () => (this.gameData?.runeBlessings?.speed ?? new Decimal(0)).gte(20), group: 'speedBlessing' },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.runeBlessings?.speed ?? new Decimal(0)).gte(40),
        group: 'speedBlessing'
    },
    { pointValue: 30, unlockCondition: () => (this.gameData?.runeBlessings?.speed ?? new Decimal(0)).gte(80), group: 'speedBlessing' },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.runeSpirits?.speed ?? new Decimal(0)).gte(20),
        group: 'speedSpirit'
    },
    { pointValue: 20, unlockCondition: () => (this.gameData?.runeSpirits?.speed ?? new Decimal(0)).gte(40), group: 'speedSpirit' },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.runeSpirits?.speed ?? new Decimal(0)).gte(80),
        group: 'speedSpirit'
    },
    {
        pointValue: 50,
        unlockCondition: () => {
        return this.gameData?.currentChallenge?.transcension !== 0 && this.gameData?.currentChallenge?.reincarnation !== 0
            && this.gameData?.currentChallenge?.ascension !== 0
        },
        group: 'ungrouped'
    },
    { pointValue: 50, unlockCondition: () => (this.gameData?.mythicalFragments ?? new Decimal(0)).gte(1e25), group: 'ungrouped' },
    // 240: ASCENDED
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 1414213,
        group: 'ungrouped'
    },
    // 241: Global speed is SLOW
    { pointValue: 50, unlockCondition: () => true, group: 'ungrouped' },
    // 242: Global speed is FAST
    { pointValue: 50, unlockCondition: () => true, group: 'ungrouped' },
    // 243: :unsmith:
    { pointValue: 5, unlockCondition: () => true, group: 'ungrouped' },
    // 244: :smith:
    { pointValue: 5, unlockCondition: () => true, group: 'ungrouped' },
    // 245: High Speed Blessing
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.runeBlessings?.speed ?? new Decimal(0)).gte(380),
        group: 'ungrouped'
    },
    // 246: Open 1 cube with a ton of cube tributes already
    { pointValue: 50, unlockCondition: () => true, group: 'ungrouped' },
    // 247: Extra challenging
    { pointValue: 50, unlockCondition: () => true, group: 'ungrouped' },
    // 248: Seeing Red But Not Blue
    { pointValue: 50, unlockCondition: () => true, group: 'ungrouped' },
    // 249: Overtaxed
    { pointValue: 50, unlockCondition: () => true, group: 'ungrouped' },
    // 250: Thousand Suns
    {
        pointValue: 100,
        unlockCondition: () => (this.gameData?.researches ?? [])[200] === 1e5,
        group: 'ungrouped',
        reward: {
        quarkGain: () => 1.05
        }
    },
    // 251: Thousand Moons
    {
        pointValue: 150,
        unlockCondition: () => (this.gameData?.cubeUpgrades ?? [])[50] === 1e5,
        group: 'ungrouped',
        reward: {
        quarkGain: () => 1.05
        }
    },
    // 252: Sadistic II
    {
        pointValue: 50,
        unlockCondition: () => this.R_calculateChallenge15Reward('achievementUnlock') === 1,
        group: 'ungrouped'
    },
    {
        pointValue: 40,
        unlockCondition: () => this.R_calcCorruptionStuff().effectiveScore >= 1e12,
        group: 'ascensionScore',
        reward: { wowHypercubeGain: () => 1.1 }
    },
    {
        pointValue: 45,
        unlockCondition: () => this.R_calcCorruptionStuff().effectiveScore >= 1e14,
        group: 'ascensionScore',
        reward: { wowCubeGain: () => 1.1 }
    },
    {
        pointValue: 50,
        unlockCondition: () => this.R_calcCorruptionStuff().effectiveScore >= 1e17,
        group: 'ascensionScore',
        reward: { wowTesseractGain: () => 1.1 }
    },
    {
        pointValue: 55,
        unlockCondition: () => this.R_calcCorruptionStuff().effectiveScore >= 2e18,
        group: 'ascensionScore',
        reward: { wowPlatonicGain: () => 1.1, overfluxConversionRate: () => 1.05 }
    },
    {
        pointValue: 60,
        unlockCondition: () => this.R_calcCorruptionStuff().effectiveScore >= 4e19,
        group: 'ascensionScore',
        reward: { overfluxConversionRate: () => 1.05 }
    },
    {
        pointValue: 65,
        unlockCondition: () => this.R_calcCorruptionStuff().effectiveScore >= 1e21,
        group: 'ascensionScore',
        reward: { wowHepteractGain: () => 1.1 }
    },
    {
        pointValue: 70,
        unlockCondition: () => this.R_calcCorruptionStuff().effectiveScore >= 1e23,
        group: 'ascensionScore',
        reward: { ascensionScore: () => Math.pow(1.01, this.gameData?.hepteracts?.abyss?.TIMES_CAP_EXTENDED ?? 0) },
    },
    {
        pointValue: 40,
        unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 1e7,
        group: 'ascensionCount',
        reward: { ascensionCountMultiplier: () => 1.1 }
    },
    {
        pointValue: 45,
        unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 1e8,
        group: 'ascensionCount',
        reward: { ascensionCountMultiplier: () => 1.1 }
    },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 2e9,
        group: 'ascensionCount'
    },
    {
        pointValue: 55,
        unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 4e10,
        group: 'ascensionCount'
    },
    {
        pointValue: 60,
        unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 8e11,
        group: 'ascensionCount'
    },
    {
        pointValue: 65,
        unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 1.6e13,
        group: 'ascensionCount'
    },
    {
        pointValue: 70,
        unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 1e14,
        group: 'ascensionCount',
        reward: { quarkGain: () => 1 + 0.1 * Math.min((this.gameData?.ascensionCount ?? 0) / 1e15, 1) }
    },
    {
        pointValue: 40,
        unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte('1e1000'),
        group: 'constant',
        reward: { ascensionScore: () => 1 + Math.min(Decimal.log((this.gameData?.ascendShards ?? new Decimal(0)).add(1), 10) / 1e5, 1) }
    },
    { pointValue: 45, unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte('1e5000'), group: 'constant' },
    { pointValue: 50, unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte('1e15000'), group: 'constant' },
    {
        pointValue: 55,
        unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte('1e50000'),
        group: 'constant',
        reward: {
        wowHepteractGain: () => 1 + Math.min(Decimal.log((this.gameData?.ascendShards ?? new Decimal(0)).add(1), 10) / 1e6, 1),
        constUpgrade1Buff: () => 0.01,
        constUpgrade2Buff: () => 0.01
        }
    },
    {
        pointValue: 60,
        unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte('1e100000'),
        group: 'constant',
        reward: { platonicToHypercubes: () => Math.min(1, Decimal.log((this.gameData?.ascendShards ?? new Decimal(0)).add(1), 10) / 1e6) }
    },
    { pointValue: 65, unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte('1e300000'), group: 'constant' },
    { pointValue: 70, unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte('1e1000000'), group: 'constant' },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.highestSingularityCount ?? 0) >= 1,
        group: 'singularityCount',
    },
    { pointValue: 20, unlockCondition: () => (this.gameData?.highestSingularityCount ?? 0) >= 2, group: 'singularityCount' },
    { pointValue: 30, unlockCondition: () => (this.gameData?.highestSingularityCount ?? 0) >= 3, group: 'singularityCount' },
    { pointValue: 40, unlockCondition: () => (this.gameData?.highestSingularityCount ?? 0) >= 4, group: 'singularityCount' },
    { pointValue: 50, unlockCondition: () => (this.gameData?.highestSingularityCount ?? 0) >= 5, group: 'singularityCount' },
    { pointValue: 60, unlockCondition: () => (this.gameData?.highestSingularityCount ?? 0) >= 7, group: 'singularityCount' },
    {
        pointValue: 70,
        unlockCondition: () => (this.gameData?.highestSingularityCount ?? 0) >= 10,
        group: 'singularityCount',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.firstOwnedCoin ?? 0) >= 1e5, group: 'firstOwnedCoin' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.firstOwnedCoin ?? 0) >= 1e6, group: 'firstOwnedCoin' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.firstOwnedCoin ?? 0) >= 1e8,
        group: 'firstOwnedCoin',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.secondOwnedCoin ?? 0) >= 1e6, group: 'secondOwnedCoin' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.secondOwnedCoin ?? 0) >= 1e8, group: 'secondOwnedCoin' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.secondOwnedCoin ?? 0) >= 1e9,
        group: 'secondOwnedCoin',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.thirdOwnedCoin ?? 0) >= 1e7, group: 'thirdOwnedCoin' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.thirdOwnedCoin ?? 0) >= 1e8, group: 'thirdOwnedCoin' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.thirdOwnedCoin ?? 0) >= 5e9,
        group: 'thirdOwnedCoin',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.fourthOwnedCoin ?? 0) >= 1e8, group: 'fourthOwnedCoin' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.fourthOwnedCoin ?? 0) >= 1e9, group: 'fourthOwnedCoin' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.fourthOwnedCoin ?? 0) >= 2e10,
        group: 'fourthOwnedCoin',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.fifthOwnedCoin ?? 0) >= 1e9, group: 'fifthOwnedCoin' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.fifthOwnedCoin ?? 0) >= 2e10, group: 'fifthOwnedCoin' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.fifthOwnedCoin ?? 0) >= 1e12,
        group: 'fifthOwnedCoin',
    },
    { pointValue: 40, unlockCondition: () => this.R_getPrestigePointGain().gte('1e10000000'), group: 'prestigePointGain' },
    { pointValue: 45, unlockCondition: () => this.R_getPrestigePointGain().gte('1e10000000000'), group: 'prestigePointGain' },
    {
        pointValue: 50,
        unlockCondition: () => this.R_getPrestigePointGain().gte('1e10000000000000'),
        group: 'prestigePointGain',
    },
    { pointValue: 40, unlockCondition: () => this.R_getTranscendPointGain().gte('1e2500000'), group: 'transcendPointGain' },
    { pointValue: 45, unlockCondition: () => this.R_getTranscendPointGain().gte('1e2500000000'), group: 'transcendPointGain' },
    {
        pointValue: 50,
        unlockCondition: () => this.R_getTranscendPointGain().gte('1e2500000000000'),
        group: 'transcendPointGain',
    },
    {
        pointValue: 40,
        unlockCondition: () => this.R_getReincarnationPointGain().gte('1e100000'),
        group: 'reincarnationPointGain'
    },
    {
        pointValue: 45,
        unlockCondition: () => this.R_getReincarnationPointGain().gte('1e100000000'),
        group: 'reincarnationPointGain'
    },
    {
        pointValue: 50,
        unlockCondition: () => this.R_getReincarnationPointGain().gte('1e100000000000'),
        group: 'reincarnationPointGain',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.challengecompletions?.[1] ?? 0) >= 1000, group: 'challenge1' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.challengecompletions?.[1] ?? 0) >= 9000, group: 'challenge1' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.challengecompletions?.[1] ?? 0) >= 9001,
        group: 'challenge1',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.challengecompletions?.[2] ?? 0) >= 1000, group: 'challenge2' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.challengecompletions?.[2] ?? 0) >= 9000, group: 'challenge2' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.challengecompletions?.[2] ?? 0) >= 9001,
        group: 'challenge2',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.challengecompletions?.[3] ?? 0) >= 1000, group: 'challenge3' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.challengecompletions?.[3] ?? 0) >= 9000, group: 'challenge3' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.challengecompletions?.[3] ?? 0) >= 9001,
        group: 'challenge3',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.challengecompletions?.[4] ?? 0) >= 1000, group: 'challenge4' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.challengecompletions?.[4] ?? 0) >= 9000, group: 'challenge4' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.challengecompletions?.[4] ?? 0) >= 9001,
        group: 'challenge4',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.challengecompletions?.[5] ?? 0) >= 1000, group: 'challenge5' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.challengecompletions?.[5] ?? 0) >= 9000, group: 'challenge5' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.challengecompletions?.[5] ?? 0) >= 9001,
        group: 'challenge5',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.challengecompletions?.[6] ?? 0) >= 40, group: 'challenge6' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.challengecompletions?.[6] ?? 0) >= 80, group: 'challenge6' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.challengecompletions?.[6] ?? 0) >= 120,
        group: 'challenge6',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.challengecompletions?.[7] ?? 0) >= 40, group: 'challenge7' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.challengecompletions?.[7] ?? 0) >= 80, group: 'challenge7' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.challengecompletions?.[7] ?? 0) >= 125,
        group: 'challenge7',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.challengecompletions?.[8] ?? 0) >= 40, group: 'challenge8' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.challengecompletions?.[8] ?? 0) >= 80, group: 'challenge8' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.challengecompletions?.[8] ?? 0) >= 130,
        group: 'challenge8',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.challengecompletions?.[9] ?? 0) >= 40, group: 'challenge9' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.challengecompletions?.[9] ?? 0) >= 80, group: 'challenge9' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.challengecompletions?.[9] ?? 0) >= 135,
        group: 'challenge9',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.challengecompletions?.[10] ?? 0) >= 40, group: 'challenge10' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.challengecompletions?.[10] ?? 0) >= 80, group: 'challenge10' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.challengecompletions?.[10] ?? 0) >= 140,
        group: 'challenge10',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.acceleratorBought ?? 0) >= 1e6, group: 'accelerators' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.acceleratorBought ?? 0) >= 1e7, group: 'accelerators' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.acceleratorBought ?? 0) >= 1e8,
        group: 'accelerators',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.multiplierBought ?? 0) >= 3e6, group: 'multipliers' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.multiplierBought ?? 0) >= 3e7, group: 'multipliers' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.multiplierBought ?? 0) >= 3e8,
        group: 'multipliers',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.acceleratorBoostBought ?? 0) >= 1e5, group: 'acceleratorBoosts' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.acceleratorBoostBought ?? 0) >= 1e6, group: 'acceleratorBoosts' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.acceleratorBoostBought ?? 0) >= 1e7,
        group: 'acceleratorBoosts',
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.ants?.crumbs ?? new Decimal(0)).gte('1e25000'), group: 'antCrumbs' },
    { pointValue: 45, unlockCondition: () => (this.gameData?.ants?.crumbs ?? new Decimal(0)).gte('1e125000'), group: 'antCrumbs' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.ants?.crumbs ?? new Decimal(0)).gte('1e1000000'),
        group: 'antCrumbs',
    },
    {
        pointValue: 40,
        unlockCondition: () => (this.gameData?.ants?.immortalELO ?? 0) >= 400000,
        group: 'sacMult'
    },
    {
        pointValue: 45,
        unlockCondition: () => (this.gameData?.ants?.immortalELO ?? 0) >= 1500000,
        group: 'sacMult'
    },
    {
        pointValue: 50,
        unlockCondition: () =>
        (this.gameData?.ants?.immortalELO ?? 0) >= 5000000 && (this.gameData?.ants?.producers?.[AntProducers.HolySpirit]?.purchased ?? 0) > 0,
        reward: { antAutobuyers: () => 1 },
        group: 'sacMult'
    },
    { pointValue: 75, unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 1e16, group: 'ascensionCount' },
    { pointValue: 80, unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 1e20, group: 'ascensionCount' },
    { pointValue: 85, unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 1e25, group: 'ascensionCount' },
    { pointValue: 90, unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 1e35, group: 'ascensionCount' },
    { pointValue: 95, unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 1e50, group: 'ascensionCount' },
    { pointValue: 100, unlockCondition: () => (this.gameData?.ascensionCount ?? 0) >= 1e75, group: 'ascensionCount' },
    { pointValue: 75, unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte('1e2000000'), group: 'constant' },
    { pointValue: 80, unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte('1e5000000'), group: 'constant' },
    { pointValue: 85, unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte('1e10000000'), group: 'constant' },
    { pointValue: 90, unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte('1e25000000'), group: 'constant' },
    { pointValue: 95, unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte('1e50000000'), group: 'constant' },
    { pointValue: 100, unlockCondition: () => (this.gameData?.ascendShards ?? new Decimal(0)).gte('1e100000000'), group: 'constant' },
    { pointValue: 80, unlockCondition: () => (this.gameData?.challengecompletions?.[11] ?? 0) >= 40, group: 'challenge11' },
    { pointValue: 90, unlockCondition: () => (this.gameData?.challengecompletions?.[11] ?? 0) >= 50, group: 'challenge11' },
    { pointValue: 100, unlockCondition: () => (this.gameData?.challengecompletions?.[11] ?? 0) >= 60, group: 'challenge11' },
    { pointValue: 110, unlockCondition: () => (this.gameData?.challengecompletions?.[11] ?? 0) >= 65, group: 'challenge11' },
    {
        pointValue: 120,
        unlockCondition: () => (this.gameData?.challengecompletions?.[11] ?? 0) >= 70,
        group: 'challenge11',
    },
    { pointValue: 80, unlockCondition: () => (this.gameData?.challengecompletions?.[12] ?? 0) >= 40, group: 'challenge12' },
    { pointValue: 90, unlockCondition: () => (this.gameData?.challengecompletions?.[12] ?? 0) >= 50, group: 'challenge12' },
    { pointValue: 100, unlockCondition: () => (this.gameData?.challengecompletions?.[12] ?? 0) >= 60, group: 'challenge12' },
    { pointValue: 110, unlockCondition: () => (this.gameData?.challengecompletions?.[12] ?? 0) >= 65, group: 'challenge12' },
    {
        pointValue: 120,
        unlockCondition: () => (this.gameData?.challengecompletions?.[12] ?? 0) >= 70,
        group: 'challenge12',
    },
    { pointValue: 80, unlockCondition: () => (this.gameData?.challengecompletions?.[13] ?? 0) >= 40, group: 'challenge13' },
    { pointValue: 90, unlockCondition: () => (this.gameData?.challengecompletions?.[13] ?? 0) >= 50, group: 'challenge13' },
    { pointValue: 100, unlockCondition: () => (this.gameData?.challengecompletions?.[13] ?? 0) >= 60, group: 'challenge13' },
    { pointValue: 110, unlockCondition: () => (this.gameData?.challengecompletions?.[13] ?? 0) >= 70, group: 'challenge13' },
    {
        pointValue: 120,
        unlockCondition: () => (this.gameData?.challengecompletions?.[13] ?? 0) >= 72,
        group: 'challenge13',
    },
    { pointValue: 80, unlockCondition: () => (this.gameData?.challengecompletions?.[14] ?? 0) >= 40, group: 'challenge14' },
    { pointValue: 90, unlockCondition: () => (this.gameData?.challengecompletions?.[14] ?? 0) >= 50, group: 'challenge14' },
    { pointValue: 100, unlockCondition: () => (this.gameData?.challengecompletions?.[14] ?? 0) >= 60, group: 'challenge14' },
    { pointValue: 110, unlockCondition: () => (this.gameData?.challengecompletions?.[14] ?? 0) >= 70, group: 'challenge14' },
    {
        pointValue: 120,
        unlockCondition: () => (this.gameData?.challengecompletions?.[14] ?? 0) >= 72,
        group: 'challenge14',
    },
    {
        pointValue: 40,
        unlockCondition: () => (this.gameData?.runeBlessings?.speed ?? new Decimal(0)).gte(200),
        group: 'speedBlessing'
    },
    { pointValue: 50, unlockCondition: () => (this.gameData?.runeBlessings?.speed ?? new Decimal(0)).gte(400), group: 'speedBlessing' },
    {
        pointValue: 60,
        unlockCondition: () => (this.gameData?.runeBlessings?.speed ?? new Decimal(0)).gte(800),
        group: 'speedBlessing'
    },
    { pointValue: 70, unlockCondition: () => (this.gameData?.runeBlessings?.speed ?? new Decimal(0)).gte(1000), group: 'speedBlessing' },
    {
        pointValue: 80,
        unlockCondition: () => (this.gameData?.runeBlessings?.speed ?? new Decimal(0)).gte(1200),
        group: 'speedBlessing'
    },
    { pointValue: 90, unlockCondition: () => (this.gameData?.runeBlessings?.speed ?? new Decimal(0)).gte(1500), group: 'speedBlessing' },
    {
        pointValue: 100,
        unlockCondition: () => (this.gameData?.runeBlessings?.speed ?? new Decimal(0)).gte(2000),
        group: 'speedBlessing'
    },
    { pointValue: 40, unlockCondition: () => (this.gameData?.runeSpirits?.speed ?? new Decimal(0)).gte(160), group: 'speedSpirit' },
    {
        pointValue: 50,
        unlockCondition: () => (this.gameData?.runeSpirits?.speed ?? new Decimal(0)).gte(320),
        group: 'speedSpirit'
    },
    { pointValue: 60, unlockCondition: () => (this.gameData?.runeSpirits?.speed ?? new Decimal(0)).gte(640), group: 'speedSpirit' },
    {
        pointValue: 70,
        unlockCondition: () => (this.gameData?.runeSpirits?.speed ?? new Decimal(0)).gte(960),
        group: 'speedSpirit'
    },
    { pointValue: 80, unlockCondition: () => (this.gameData?.runeSpirits?.speed ?? new Decimal(0)).gte(1280), group: 'speedSpirit' },
    {
        pointValue: 90,
        unlockCondition: () => (this.gameData?.runeSpirits?.speed ?? new Decimal(0)).gte(1600),
        group: 'speedSpirit'
    },
    { pointValue: 100, unlockCondition: () => (this.gameData?.runeSpirits?.speed ?? new Decimal(0)).gte(2000), group: 'speedSpirit' },
    {
        pointValue: 2,
        unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 100,
        group: 'runeLevel'
    },
    { pointValue: 4, unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 250, group: 'runeLevel' },
    {
        pointValue: 6,
        unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 500,
        group: 'runeLevel'
    },
    { pointValue: 8, unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 1000, group: 'runeLevel' },
    {
        pointValue: 10,
        unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 2000,
        group: 'runeLevel'
    },
    { pointValue: 12, unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 5000, group: 'runeLevel' },
    {
        pointValue: 14,
        unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 10000,
        group: 'runeLevel'
    },
    { pointValue: 16, unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 20000, group: 'runeLevel' },
    {
        pointValue: 18,
        unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 50000,
        group: 'runeLevel'
    },
    { pointValue: 20, unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 100000, group: 'runeLevel' },
    {
        pointValue: 22,
        unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 200000,
        group: 'runeLevel'
    },
    {
        pointValue: 24,
        unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 300000,
        group: 'runeLevel'
    },
    {
        pointValue: 26,
        unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 500000,
        group: 'runeLevel'
    },
    {
        pointValue: 28,
        unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 750000,
        group: 'runeLevel'
    },
    {
        pointValue: 30,
        unlockCondition: () => this.R_getRuneEffectiveLevel('speed') >= 1000000,
        group: 'runeLevel'
    },
    {
        pointValue: 2,
        unlockCondition: () => this.R_runes.speed.freeLevels() >= 10,
        group: 'runeFreeLevel'
    },
    { pointValue: 4, unlockCondition: () => this.R_runes.speed.freeLevels() >= 40, group: 'runeFreeLevel' },
    {
        pointValue: 6,
        unlockCondition: () => this.R_runes.speed.freeLevels() >= 125,
        group: 'runeFreeLevel'
    },
    { pointValue: 8, unlockCondition: () => this.R_runes.speed.freeLevels() >= 250, group: 'runeFreeLevel' },
    {
        pointValue: 10,
        unlockCondition: () => this.R_runes.speed.freeLevels() >= 500,
        group: 'runeFreeLevel'
    },
    { pointValue: 12, unlockCondition: () => this.R_runes.speed.freeLevels() >= 1000, group: 'runeFreeLevel' },
    {
        pointValue: 14,
        unlockCondition: () => this.R_runes.speed.freeLevels() >= 2000,
        group: 'runeFreeLevel'
    },
    { pointValue: 16, unlockCondition: () => this.R_runes.speed.freeLevels() >= 4000, group: 'runeFreeLevel' },
    {
        pointValue: 18,
        unlockCondition: () => this.R_runes.speed.freeLevels() >= 7500,
        group: 'runeFreeLevel'
    },
    { pointValue: 20, unlockCondition: () => this.R_runes.speed.freeLevels() >= 12500, group: 'runeFreeLevel' },
    {
        pointValue: 22,
        unlockCondition: () => this.R_runes.speed.freeLevels() >= 25000,
        group: 'runeFreeLevel'
    },
    { pointValue: 24, unlockCondition: () => this.R_runes.speed.freeLevels() >= 37500, group: 'runeFreeLevel' },
    {
        pointValue: 26,
        unlockCondition: () => this.R_runes.speed.freeLevels() >= 50000,
        group: 'runeFreeLevel'
    },
    { pointValue: 28, unlockCondition: () => this.R_runes.speed.freeLevels() >= 75000, group: 'runeFreeLevel' },
    {
        pointValue: 30,
        unlockCondition: () => this.R_runes.speed.freeLevels() >= 100000,
        group: 'runeFreeLevel'
    },
    {
        pointValue: 5,
        unlockCondition: () => (this.campaignData?.tokens ?? 0) >= 10,
        group: 'campaignTokens'
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.campaignData?.tokens ?? 0) >= 20,
        group: 'campaignTokens'
    },
    {
        pointValue: 15,
        unlockCondition: () => (this.campaignData?.tokens ?? 0) >= 40,
        group: 'campaignTokens'
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.campaignData?.tokens ?? 0) >= 80,
        group: 'campaignTokens'
    },
    {
        pointValue: 25,
        unlockCondition: () => (this.campaignData?.tokens ?? 0) >= 160,
        group: 'campaignTokens'
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.campaignData?.tokens ?? 0) >= 320,
        group: 'campaignTokens'
    },
    {
        pointValue: 35,
        unlockCondition: () => (this.campaignData?.tokens ?? 0) >= 1000,
        group: 'campaignTokens'
    },
    {
        pointValue: 40,
        unlockCondition: () => (this.campaignData?.tokens ?? 0) >= 2000,
        group: 'campaignTokens'
    },
    {
        pointValue: 45,
        unlockCondition: () => (this.campaignData?.tokens ?? 0) >= 4000,
        group: 'campaignTokens'
    },
    {
        pointValue: 50,
        unlockCondition: () => (this.campaignData?.tokens ?? 0) >= 9000,
        group: 'campaignTokens'
    },
    {
        pointValue: 2,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 1,
        group: 'prestigeCount'
    },
    {
        pointValue: 4,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 10,
        group: 'prestigeCount',
        reward: { prestigeCountMultiplier: () => AchievementHelper.floorLog10PlusOne(this.gameData?.prestigeCount ?? 0) }
    },
    {
        pointValue: 6,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 100,
        group: 'prestigeCount',
        reward: { duplicationRuneUnlock: () => 1 }
    },
    {
        pointValue: 8,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 1_000,
        group: 'prestigeCount',
        reward: { offeringBonus: () => 1 + 0.02 * AchievementHelper.floorLog10PlusOne(this.gameData?.prestigeCount ?? 0) }
    },
    {
        pointValue: 10,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 10_000,
        group: 'prestigeCount'
    },
    {
        pointValue: 12,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 100_000,
        group: 'prestigeCount'
    },
    {
        pointValue: 14,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 1_000_000,
        group: 'prestigeCount',
        reward: { transcendToPrestige: () => 1 }
    },
    {
        pointValue: 16,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 10_000_000,
        group: 'prestigeCount'
    },
    {
        pointValue: 18,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 100_000_000,
        group: 'prestigeCount',
        reward: { transcensionCountMultiplier: () => Math.min(4, 1.25 + 2.75 * (this.gameData?.prestigecounter ?? 0) / 10) }
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 1_000_000_000,
        group: 'prestigeCount'
    },
    {
        pointValue: 22,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 100_000_000_000,
        group: 'prestigeCount'
    },
    {
        pointValue: 24,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 10_000_000_000_000,
        group: 'prestigeCount'
    },
    {
        pointValue: 26,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 1e15,
        group: 'prestigeCount'
    },
    {
        pointValue: 28,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 1e17,
        group: 'prestigeCount'
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.prestigeCount ?? 0) >= 1e20,
        group: 'prestigeCount'
    },
    {
        pointValue: 3,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 1,
        group: 'transcensionCount'
    },
    {
        pointValue: 6,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 10,
        group: 'transcensionCount',
        reward: { transcensionCountMultiplier: () => AchievementHelper.floorLog10PlusOne(this.gameData?.transcendCount ?? 0) }
    },
    {
        pointValue: 9,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 100,
        group: 'transcensionCount',
        reward: { salvage: () => 2 * AchievementHelper.floorLog10PlusOne(this.gameData?.transcendCount ?? 0) }
    },
    {
        pointValue: 12,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 1_000,
        group: 'transcensionCount',
        reward: { prismRuneUnlock: () => 1 }
    },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 10_000,
        group: 'transcensionCount'
    },
    {
        pointValue: 18,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 100_000,
        group: 'transcensionCount'
    },
    {
        pointValue: 21,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 1_000_000,
        group: 'transcensionCount',
        reward: { reincarnationToTranscend: () => 1 }
    },
    {
        pointValue: 24,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 10_000_000,
        group: 'transcensionCount'
    },
    {
        pointValue: 27,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 100_000_000,
        group: 'transcensionCount',
        reward: { reincarnationCountMultiplier: () => Math.min(4, 1.25 + 2.75 * (this.gameData?.prestigecounter ?? 0) / 1000) }
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 1_000_000_000,
        group: 'transcensionCount'
    },
    {
        pointValue: 33,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 30_000_000_000,
        group: 'transcensionCount'
    },
    {
        pointValue: 36,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 900_000_000_000,
        group: 'transcensionCount'
    },
    {
        pointValue: 39,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 27_000_000_000_000,
        group: 'transcensionCount'
    },
    {
        pointValue: 42,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 810_000_000_000_000,
        group: 'transcensionCount'
    },
    {
        pointValue: 45,
        unlockCondition: () => (this.gameData?.transcendCount ?? 0) >= 1e17,
        group: 'transcensionCount'
    },
    {
        pointValue: 4,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 1,
        group: 'reincarnationCount'
    },
    {
        pointValue: 8,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 10,
        group: 'reincarnationCount',
        reward: { reincarnationCountMultiplier: () => AchievementHelper.floorLog10PlusOne(this.gameData?.reincarnationCount ?? 0) }
    },
    {
        pointValue: 12,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 100,
        group: 'reincarnationCount',
        reward: { obtainiumBonus: () => 1 + 0.02 * AchievementHelper.floorLog10PlusOne(this.gameData?.reincarnationCount ?? 0) }
    },
    {
        pointValue: 16,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 1_000,
        group: 'reincarnationCount'
    },
    {
        pointValue: 20,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 10_000,
        group: 'reincarnationCount',
        reward: { thriftRuneUnlock: () => 1 }
    },
    {
        pointValue: 24,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 100_000,
        group: 'reincarnationCount'
    },
    {
        pointValue: 28,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 1_000_000,
        group: 'reincarnationCount'
    },
    {
        pointValue: 32,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 10_000_000,
        group: 'reincarnationCount'
    },
    {
        pointValue: 36,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 100_000_000,
        group: 'reincarnationCount',
        reward: {
        prestigeCountMultiplier: () => Math.min(4, 1.25 + 2.75 * (this.gameData?.prestigecounter ?? 0) / 1e6),
        ascensionCountMultiplier: () => Math.min(1.25, 1 + 0.25 * (this.gameData?.ascensionCounter ?? 0) / 1e6)
        }
    },
    {
        pointValue: 40,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 1_000_000_000,
        group: 'reincarnationCount'
    },
    {
        pointValue: 44,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 8_000_000_000,
        group: 'reincarnationCount'
    },
    {
        pointValue: 48,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 100_000_000_000,
        group: 'reincarnationCount'
    },
    {
        pointValue: 52,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 1_000_000_000_000,
        group: 'reincarnationCount'
    },
    {
        pointValue: 56,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 13_131_313_131_313,
        group: 'reincarnationCount'
    },
    {
        pointValue: 60,
        unlockCondition: () => (this.gameData?.reincarnationCount ?? 0) >= 2e14,
        group: 'reincarnationCount'
    },
    {
        pointValue: 3,
        unlockCondition: () => (this.gameData?.ants?.antSacrificeCount ?? 0) >= 1,
        group: 'sacCount',
        reward: { freeAntUpgrades: () => 1 }
    },
    {
        pointValue: 6,
        unlockCondition: () => (this.gameData?.ants?.antSacrificeCount ?? 0) >= 10,
        group: 'sacCount',
        reward: { antSacrificeCountMultiplier: () => 2, hicAutobuy: () => 1 }
    },
    {
        pointValue: 9,
        unlockCondition: () => (this.gameData?.ants?.antSacrificeCount ?? 0) >= 50,
        group: 'sacCount',
        reward: { autoAntSacrifice: () => 1 }
    },
    {
        pointValue: 12,
        unlockCondition: () => (this.gameData?.ants?.antSacrificeCount ?? 0) >= 250,
        group: 'sacCount',
        reward: { antELOAdditiveMultiplier: () => 0.01, praemoenioAutobuy: () => 1 }
    },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.ants?.antSacrificeCount ?? 0) >= 1250,
        group: 'sacCount',
        reward: { antELOAdditive: () => 25 }
    },
    {
        pointValue: 17,
        unlockCondition: () => (this.gameData?.ants?.antSacrificeCount ?? 0) >= 5000,
        group: 'sacCount',
        reward: { antSpeed2UpgradeImprover: () => this.R_calculateSynergismLevel(), phylacteriumAutobuy: () => 1 }
    },
    {
        pointValue: 19,
        unlockCondition: () => (this.gameData?.ants?.antSacrificeCount ?? 0) >= 20000,
        group: 'sacCount'
    },
    {
        pointValue: 21,
        unlockCondition: () => (this.gameData?.ants?.antSacrificeCount ?? 0) >= 80000,
        group: 'sacCount'
    },
    {
        pointValue: 23,
        unlockCondition: () => (this.gameData?.ants?.antSacrificeCount ?? 0) >= 250000,
        group: 'sacCount'
    },
    {
        pointValue: 25,
        unlockCondition: () => (this.gameData?.ants?.antSacrificeCount ?? 0) >= 1000000,
        group: 'sacCount',
        reward: { preserveAnthillCountSingularity: () => 1 }
    },
    {
        pointValue: 40,
        unlockCondition: () => (this.gameData?.ants?.antSacrificeCount ?? 0) >= 3_000_000,
        group: 'sacCount'
    },
    {
        pointValue: 45,
        unlockCondition: () => (this.gameData?.ants?.antSacrificeCount ?? 0) >= 10_000_000,
        group: 'sacCount',
        reward: { antSacrificeToReincarnation: () => 1 }
    },
    {
        pointValue: 55,
        unlockCondition: () => (this.gameData?.ants?.antSacrificeCount ?? 0) >= 100_000_000,
        group: 'sacCount'
    },
    {
        pointValue: 3,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 10,
        group: 'addCodesUsed'
    },
    {
        pointValue: 6,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 20,
        group: 'addCodesUsed'
    },
    {
        pointValue: 9,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 50,
        group: 'addCodesUsed'
    },
    {
        pointValue: 12,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 100,
        group: 'addCodesUsed'
    },
    {
        pointValue: 15,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 200,
        group: 'addCodesUsed'
    },
    {
        pointValue: 18,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 300,
        group: 'addCodesUsed'
    },
    {
        pointValue: 21,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 500,
        group: 'addCodesUsed'
    },
    {
        pointValue: 24,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 750,
        group: 'addCodesUsed'
    },
    {
        pointValue: 27,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 1000,
        group: 'addCodesUsed'
    },
    {
        pointValue: 30,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 2000,
        group: 'addCodesUsed'
    },
    {
        pointValue: 33,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 3000,
        group: 'addCodesUsed'
    },
    {
        pointValue: 36,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 5000,
        group: 'addCodesUsed'
    },
    {
        pointValue: 39,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 6000,
        group: 'addCodesUsed'
    },
    {
        pointValue: 42,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 7500,
        group: 'addCodesUsed'
    },
    {
        pointValue: 45,
        unlockCondition: () => (this.gameData?.stats?.totalAddCodesUsed ?? 0) >= 10000,
        group: 'addCodesUsed'
    }
    ]

;
    }

    private buildCalculateAchievementsByReward(): Record<AchievementRewards, number[]> {
        const rewards = ACHIEVEMENT_REWARD_TYPES.reduce(
            (acc, rewardType) => {
                acc[rewardType] = [];
                return acc;
            },
            {} as Record<AchievementRewards, number[]>
        );

        return this.achievements.reduce((rewards, achievement, index) => {
            if (!achievement.reward || typeof achievement.reward !== 'object') {
                return rewards;
            }

            for (const rewardType of Object.keys(achievement.reward)) {
                if (!Object.prototype.hasOwnProperty.call(rewards, rewardType)) {
                    console.warn(`AchievementHelper: skipping unknown achievement reward type '${rewardType}' on achievement index ${index}`);
                    rewards[rewardType as AchievementRewards] = [];
                }
                rewards[rewardType as AchievementRewards].push(Number(index));
            }
            return rewards;
        }, rewards);
    }

    private buildAchievementRewards(): Record<AchievementRewards, () => number | boolean> {
        return {
            acceleratorPower: () => this.sumAchievementRewards('acceleratorPower', (reward) => reward.acceleratorPower!()),
            accelerators: () => this.sumAchievementRewards('accelerators', (reward) => reward.accelerators!()),
            multipliers: () => this.sumAchievementRewards('multipliers', (reward) => reward.multipliers!()),
            accelBoosts: () => this.sumAchievementRewards('accelBoosts', (reward) => reward.accelBoosts!()),
            crystalMultiplier: () => this.productAchievementRewards('crystalMultiplier', (reward) => reward.crystalMultiplier!()),
            quarkGain: () => this.productAchievementRewards('quarkGain', (reward) => reward.quarkGain!()),
            taxReduction: () => this.productAchievementRewards('taxReduction', (reward) => reward.taxReduction!()),
            particleGain: () => this.productAchievementRewards('particleGain', (reward) => reward.particleGain!()),
            chronosTalisman: () => this.achievementUnlocked('chronosTalisman'),
            midasTalisman: () => this.achievementUnlocked('midasTalisman'),
            metaphysicsTalisman: () => this.achievementUnlocked('metaphysicsTalisman'),
            polymathTalisman: () => this.achievementUnlocked('polymathTalisman'),
            wowSquareTalisman: () => this.achievementUnlocked('wowSquareTalisman'),
            conversionExponent: () => this.sumAchievementRewards('conversionExponent', (reward) => reward.conversionExponent!()),
            talismanPower: () => this.sumAchievementRewards('talismanPower', (reward) => reward.talismanPower!()),
            sacrificeMult: () => this.productAchievementRewards('sacrificeMult', (reward) => reward.sacrificeMult!()),
            antSpeed: () => this.productAchievementRewards('antSpeed', (reward) => reward.antSpeed!()),
            antSacrificeUnlock: () => this.achievementUnlocked('antSacrificeUnlock'),
            antSacrificeToReincarnation: () => this.achievementUnlocked('antSacrificeToReincarnation'),
            antAutobuyers: () => this.sumAchievementRewards('antAutobuyers', (reward) => reward.antAutobuyers!()),
            preserveAnthillCount: () => this.achievementUnlocked('preserveAnthillCount'),
            preserveAnthillCountSingularity: () => this.achievementUnlocked('preserveAnthillCountSingularity'),
            inceptusAutobuy: () => this.achievementUnlocked('inceptusAutobuy'),
            fortunaeAutobuy: () => this.achievementUnlocked('fortunaeAutobuy'),
            tributumAutobuy: () => this.achievementUnlocked('tributumAutobuy'),
            celeritasAutobuy: () => this.achievementUnlocked('celeritasAutobuy'),
            exploratoremAutobuy: () => this.achievementUnlocked('exploratoremAutobuy'),
            sacrificiumAutobuy: () => this.achievementUnlocked('sacrificiumAutobuy'),
            experientiaAutobuy: () => this.achievementUnlocked('experientiaAutobuy'),
            hicAutobuy: () => this.achievementUnlocked('hicAutobuy'),
            scientiaAutobuy: () => this.achievementUnlocked('scientiaAutobuy'),
            praemoenioAutobuy: () => this.achievementUnlocked('praemoenioAutobuy'),
            phylacteriumAutobuy: () => this.achievementUnlocked('phylacteriumAutobuy'),
            antELOAdditive: () => this.sumAchievementRewards('antELOAdditive', (reward) => reward.antELOAdditive!()),
            antELOAdditiveMultiplier: () => this.sumAchievementRewards('antELOAdditiveMultiplier', (reward) => reward.antELOAdditiveMultiplier!()),
            ascensionCountMultiplier: () => this.productAchievementRewards('ascensionCountMultiplier', (reward) => reward.ascensionCountMultiplier!()),
            ascensionCountAdditive: () => this.sumAchievementRewards('ascensionCountAdditive', (reward) => reward.ascensionCountAdditive!()),
            wowCubeGain: () => this.productAchievementRewards('wowCubeGain', (reward) => reward.wowCubeGain!()),
            wowTesseractGain: () => this.productAchievementRewards('wowTesseractGain', (reward) => reward.wowTesseractGain!()),
            wowHypercubeGain: () => this.productAchievementRewards('wowHypercubeGain', (reward) => reward.wowHypercubeGain!()),
            wowPlatonicGain: () => this.productAchievementRewards('wowPlatonicGain', (reward) => reward.wowPlatonicGain!()),
            wowHepteractGain: () => this.productAchievementRewards('wowHepteractGain', (reward) => reward.wowHepteractGain!()),
            ascensionScore: () => this.productAchievementRewards('ascensionScore', (reward) => reward.ascensionScore!()),
            ascensionRewardScaling: () => this.achievementUnlocked('ascensionRewardScaling'),
            constUpgrade1Buff: () => this.sumAchievementRewards('constUpgrade1Buff', (reward) => reward.constUpgrade1Buff!()),
            constUpgrade2Buff: () => this.sumAchievementRewards('constUpgrade2Buff', (reward) => reward.constUpgrade2Buff!()),
            platonicToHypercubes: () => this.sumAchievementRewards('platonicToHypercubes', (reward) => reward.platonicToHypercubes!()),
            statTracker: () => this.achievementUnlocked('statTracker'),
            overfluxConversionRate: () => this.productAchievementRewards('overfluxConversionRate', (reward) => reward.overfluxConversionRate!()),
            diamondUpgrade18: () => this.achievementUnlocked('diamondUpgrade18'),
            diamondUpgrade19: () => this.achievementUnlocked('diamondUpgrade19'),
            diamondUpgrade20: () => this.achievementUnlocked('diamondUpgrade20'),
            prestigeCountMultiplier: () => this.productAchievementRewards('prestigeCountMultiplier', (reward) => reward.prestigeCountMultiplier!()),
            transcensionCountMultiplier: () => this.productAchievementRewards('transcensionCountMultiplier', (reward) => reward.transcensionCountMultiplier!()),
            reincarnationCountMultiplier: () => this.productAchievementRewards('reincarnationCountMultiplier', (reward) => reward.reincarnationCountMultiplier!()),
            duplicationRuneUnlock: () => this.achievementUnlocked('duplicationRuneUnlock'),
            offeringBonus: () => this.productAchievementRewards('offeringBonus', (reward) => reward.offeringBonus!()),
            obtainiumBonus: () => this.productAchievementRewards('obtainiumBonus', (reward) => reward.obtainiumBonus!()),
            salvage: () => this.sumAchievementRewards('salvage', (reward) => reward.salvage!()),
            prismRuneUnlock: () => this.achievementUnlocked('prismRuneUnlock'),
            thriftRuneUnlock: () => this.achievementUnlocked('thriftRuneUnlock'),
            transcendToPrestige: () => this.achievementUnlocked('transcendToPrestige'),
            reincarnationToTranscend: () => this.achievementUnlocked('reincarnationToTranscend'),
            freeAntUpgrades: () => this.sumAchievementRewards('freeAntUpgrades', (reward) => reward.freeAntUpgrades!()),
            antSacrificeCountMultiplier: () => this.productAchievementRewards('antSacrificeCountMultiplier', (reward) => reward.antSacrificeCountMultiplier!()),
            autoAntSacrifice: () => this.achievementUnlocked('autoAntSacrifice'),
            antSpeed2UpgradeImprover: () => this.sumAchievementRewards('antSpeed2UpgradeImprover', (reward) => reward.antSpeed2UpgradeImprover!()),
        };
    }

    get R_runes(): Record<RuneKeys, any> {
        return this.#ctx.R_runes();
    }

    R_getPrestigePointGain(): Decimal {
        return this.#ctx.R_getPrestigePointGain();
    }

    R_getTranscendPointGain(): Decimal {
        return this.#ctx.R_getTranscendPointGain();
    }

    R_getReincarnationPointGain(): Decimal {
        return this.#ctx.R_getReincarnationPointGain();
    }

    R_calcCorruptionStuff() {
        return this.#ctx.R_calcCorruptionStuff();
    }

    R_calculateChallenge15Reward(rewardName: string): number {
        return this.#ctx.R_calculateChallenge15Reward(rewardName);
    }
    R_calculateSynergismLevel(): number {
        return this.#ctx.R_calculateSynergismLevel();
    }

    R_calculateAscensionScore(): { effectiveScore: number } {
        return this.#ctx.R_calculateAscensionScore();
    }


    R_getRuneEffectiveLevel(rune: RuneKeys): number {
        return this.#ctx.R_getRuneEffectiveLevel(rune);
    }
}
