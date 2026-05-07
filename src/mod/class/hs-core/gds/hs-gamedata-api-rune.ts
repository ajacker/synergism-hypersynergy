import Decimal from "break_infinity.js";
import { HSLogger } from "../hs-logger";
import type {
    AntUpgrades,
    CalculationCache,
    RuneKeys,
    RuneTypeMap,
    RuneHelperContext,
} from "../../../types/data-types/hs-gamedata-api-types";
import { RUNE_KEYS } from "../../../types/data-types/hs-gamedata-api-types";
import type { Player } from "../../../types/data-types/hs-player-savedata";


export class RuneHelper {
    readonly #ctx: RuneHelperContext;

    constructor(context: RuneHelperContext) {
        this.#ctx = context;
    }

    public readonly R_runes: Record<RuneKeys, {
        ignoreChal9: boolean
        costCoefficient: Decimal
        levelsPerOOM: number
        levelsPerOOMIncrease: () => number
        effects: (level: number, key?: string) => unknown
        effectiveLevelMult: () => number
        freeLevels: () => number
        runeEXPPerOffering: (purchasedLevels: number) => Decimal
        isUnlocked: (data?: Player) => boolean
    }> = {
        speed: {
            ignoreChal9: false,
            costCoefficient: new Decimal(50),
            levelsPerOOM: 150,
            levelsPerOOMIncrease: () => this.#ctx.R_speedRuneOOMIncrease(),
            effects: (n: number) => {
                const acceleratorPower = 0.0002 * n
                const multiplicativeAccelerators = 1 + n / 400
                const globalSpeed = 2 - Math.exp(-Math.cbrt(n) / 100)
                return {
                    acceleratorPower,
                    multiplicativeAccelerators,
                    globalSpeed,
                }
            },
            effectiveLevelMult: () => this.#ctx.R_firstFiveEffectiveRuneLevelMult(),
            freeLevels: () => this.#ctx.R_firstFiveFreeLevels() + this.#ctx.getRuneBonusLevels('speed'),
            runeEXPPerOffering: (purchasedLevels: number) => this.#ctx.R_universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => true,
        },
        duplication: {
            ignoreChal9: false,
            costCoefficient: new Decimal(20000),
            levelsPerOOM: 120,
            levelsPerOOMIncrease: () => this.#ctx.R_duplicationRuneOOMIncrease(),
            effects: (n: number) => {
                const multiplierBoosts = n / 5
                const multiplicativeMultipliers = 1 + n / 400
                const taxReduction = 0.001 + 0.999 * Math.exp(-Math.cbrt(n) / 5)
                return {
                    multiplierBoosts,
                    multiplicativeMultipliers,
                    taxReduction,
                }
            },
            effectiveLevelMult: () => this.#ctx.R_firstFiveEffectiveRuneLevelMult(),
            freeLevels: () => this.#ctx.R_firstFiveFreeLevels() + this.#ctx.getRuneBonusLevels('duplication'),
            runeEXPPerOffering: (purchasedLevels: number) => this.#ctx.R_universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean(this.#ctx.R_getAchievementReward('duplicationRuneUnlock')),
        },
        prism: {
            ignoreChal9: false,
            costCoefficient: new Decimal('5e5'),
            levelsPerOOM: 90,
            levelsPerOOMIncrease: () => this.#ctx.R_prismRuneOOMIncrease(),
            effects: (level: number) => {
                const productionLog10 = Math.max(0, 2 * Math.log10(1 + level / 2) + (level / 2) * Math.log10(2) - Math.log10(256))
                const costDivisorLog10 = Math.floor(level / 10)
                return {
                    productionLog10,
                    costDivisorLog10,
                }
            },
            effectiveLevelMult: () => this.#ctx.R_firstFiveEffectiveRuneLevelMult(),
            freeLevels: () => this.#ctx.R_firstFiveFreeLevels() + this.#ctx.getRuneBonusLevels('prism'),
            runeEXPPerOffering: (purchasedLevels: number) => this.#ctx.R_universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean(this.#ctx.R_getAchievementReward('prismRuneUnlock')),
        },
        thrift: {
            ignoreChal9: false,
            costCoefficient: new Decimal('2.5e7'),
            levelsPerOOM: 60,
            levelsPerOOMIncrease: () => this.#ctx.R_thriftRuneOOMIncrease(),
            effects: (level: number) => {
                const costDelay = Math.min(1e15, level / 125)
                const salvage = 2.5 * Math.log(1 + level / 10)
                const taxReduction = 0.01 + 0.99 * Math.exp(-Math.cbrt(level) / 10)
                return {
                    costDelay,
                    salvage,
                    taxReduction,
                }
            },
            effectiveLevelMult: () => this.#ctx.R_firstFiveEffectiveRuneLevelMult(),
            freeLevels: () => this.#ctx.R_firstFiveFreeLevels() + this.#ctx.getRuneBonusLevels('thrift'),
            runeEXPPerOffering: (purchasedLevels: number) => this.#ctx.R_universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean(this.#ctx.R_getAchievementReward('thriftRuneUnlock')),
        },
        superiorIntellect: {
            ignoreChal9: false,
            costCoefficient: new Decimal('1e12'),
            levelsPerOOM: 30,
            levelsPerOOMIncrease: () => this.#ctx.R_superiorIntellectOOMIncrease(),
            effects: (level: number) => {
                const offeringMult = 1 + level / 2000
                const obtainiumMult = 1 + level / 200
                const antSpeed = Math.pow(1 + level / 500, 2)
                return {
                    offeringMult,
                    obtainiumMult,
                    antSpeed,
                }
            },
            effectiveLevelMult: () => this.#ctx.R_firstFiveEffectiveRuneLevelMult() * this.#ctx.R_SIEffectiveRuneLevelMult(),
            freeLevels: () => this.#ctx.R_firstFiveFreeLevels() + this.#ctx.getRuneBonusLevels('superiorIntellect'),
            runeEXPPerOffering: (purchasedLevels: number) => this.#ctx.R_universalRuneEXPMult(purchasedLevels),
            isUnlocked: (data?: Player) => Boolean((data?.researches?.[82] ?? 0) > 0),
        },
        infiniteAscent: {
            ignoreChal9: true,
            costCoefficient: new Decimal('1e75'),
            levelsPerOOM: 1 / 2,
            levelsPerOOMIncrease: () => this.#ctx.R_getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').infiniteAscentOOMBonus,
            effects: (level: number) => {
                const quarkMult = 1 + level / 500 + (level > 0 ? 0.1 : 0)
                const cubeMult = 1 + level / 100

                const salvagePerkLevels = [30, 40, 61, 81, 111, 131, 161, 191, 236, 260]
                const salvageCoefficient = 0.025 * salvagePerkLevels.filter((x) => x <= (this.#ctx.getGameData()?.highestSingularityCount ?? 0)).length
                const salvage = salvageCoefficient * level

                return {
                    quarkMult,
                    cubeMult,
                    salvage,
                }
            },
            effectiveLevelMult: () => 1,
            freeLevels: () => this.#ctx.getRuneBonusLevels('infiniteAscent'),
            runeEXPPerOffering: (purchasedLevels: number) => this.#ctx.R_universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean(this.#ctx.getSingularityChallengeEffect('noQuarkUpgrades', 'topHatUnlock')),
        },
        antiquities: {
            ignoreChal9: true,
            costCoefficient: new Decimal('1e206'),
            levelsPerOOM: 1 / 50,
            levelsPerOOMIncrease: () => this.#ctx.getSingularityChallengeEffect('taxmanLastStand', 'antiquityOOM'),
            effects: (level: number, key?: string) => {
                if (key === 'addCodeCooldownReduction') {
                    return level > 0 ? 0.8 - 0.3 * (level - 1) / (level + 10) : 1
                } else if (key === 'offeringLog10' || key === 'obtainiumLog10') {
                    return Math.round(300 * (1 - Math.pow(1 - 1 / 300, level)))
                } else {
                    return level > 0 ? Math.pow(1.01, Math.min(5, level) * (this.#ctx.getGameData()?.singularityCount ?? 0)) : 1
                }
            },
            effectiveLevelMult: () => 1,
            freeLevels: () => this.#ctx.getRuneBonusLevels('antiquities'),
            runeEXPPerOffering: (purchasedLevels: number) => this.#ctx.R_universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean((this.#ctx.getGameData()?.platonicUpgrades[20] ?? 0) > 0),
        },
        horseShoe: {
            ignoreChal9: true,
            costCoefficient: new Decimal('1e500'),
            levelsPerOOM: 1 / 20,
            levelsPerOOMIncrease: () => this.#ctx.getSingularityChallengeEffect('taxmanLastStand', 'horseShoeOOM'),
            effects: (level: number) => {
                const ambrosiaLuck = level
                const redLuck = level / 5
                const redLuckConversion = -0.5 * level / (level + 50)
                return {
                    ambrosiaLuck,
                    redLuck,
                    redLuckConversion,
                }
            },
            effectiveLevelMult: () => 1,
            freeLevels: () => this.#ctx.getRuneBonusLevels('horseShoe'),
            runeEXPPerOffering: (purchasedLevels: number) => this.#ctx.R_universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean((this.#ctx.getGameData()?.singularityChallenges.taxmanLastStand.completions ?? 0) > 0),
        },
        finiteDescent: {
            ignoreChal9: true,
            costCoefficient: new Decimal('1e-40'),
            levelsPerOOM: 0.1,
            levelsPerOOMIncrease: () => 0,
            effects: (level: number) => {
                const ascensionScore = level >= 1 ? 1.04 + 0.96 * (level - 1) / (level + 25) : 1
                const corruptionFreeLevels = level >= 1 ? 0.01 + 0.14 * (level - 1) / (level + 16) : 0
                const infiniteAscentFreeLevel = Math.floor(level / 2)
                return {
                    ascensionScore,
                    corruptionFreeLevels,
                    infiniteAscentFreeLevel,
                }
            },
            effectiveLevelMult: () => 1,
            freeLevels: () => 0,
            runeEXPPerOffering: (purchasedLevels: number) => this.#ctx.R_universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean((this.#ctx.getGameData()?.shopUpgrades.shopSadisticRune ?? 0) > 0),
        },
        topHat: {
            ignoreChal9: false,
            costCoefficient: new Decimal(1),
            levelsPerOOM: 1,
            levelsPerOOMIncrease: () => 0,
            effects: (level: number) => {
                return {
                    freeOfferingLevels: Math.round(200 * (1 - Math.pow(0.995, level))) / 10,
                    freeObtainiumLevels: Math.round(200 * (1 - Math.pow(0.995, level))) / 10,
                    freeCubeLevels: Math.round(150 * (1 - Math.pow(0.997, level))) / 10,
                    freeSpeedLevels: Math.round(150 * (1 - Math.pow(0.997, level))) / 10,
                    freeInfinityLevels: Math.round(100 * (1 - Math.pow(0.999, level))) / 10,
                }
            },
            effectiveLevelMult: () => 1,
            freeLevels: () => 0,
            runeEXPPerOffering: (purchasedLevels: number) => this.#ctx.R_universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean(this.#ctx.getSingularityChallengeEffect('noQuarkUpgrades', 'topHatUnlock')),
        },
    }

    public R_getRuneEffects = <T extends RuneKeys>(rune: T): RuneTypeMap[T] =>
        this.R_runes[rune].effects(this.R_getRuneEffectiveLevel(rune)) as RuneTypeMap[T]

    public R_computeEXPToLevel = (rune: RuneKeys, level: number): Decimal => {
        const levelPerOOM = this.R_getLevelsPerOOM(rune)
        return this.R_runes[rune].costCoefficient.times(Decimal.pow(10, level / levelPerOOM).minus(1))
    }

    public R_getLevelsPerOOM = (rune: RuneKeys): number =>
        this.R_runes[rune].levelsPerOOM + this.R_runes[rune].levelsPerOOMIncrease()

    public R_getRuneEffectiveLevel = (rune: RuneKeys): number => {
        const data = this.#ctx.getGameData()
        if (!data) return 0

        const cacheName = 'R_GetRuneEffectiveLevel' as keyof CalculationCache;
        const runeDef = this.R_runes[rune]
        const runeIndex = RUNE_KEYS.indexOf(rune)
        const runeExpLog = data.runes[rune]?.gt(0)
            ? Number(data.runes[rune].log10())
            : Number.NEGATIVE_INFINITY
        const effectiveMult = runeDef.effectiveLevelMult()
        const freeLevels = runeDef.freeLevels()
        const ignoreChal9 = runeDef.ignoreChal9 ? 1 : 0

        const calculationVars = [
            runeIndex,
            data.currentChallenge.reincarnation,
            ignoreChal9,
            effectiveMult,
            freeLevels,
            runeExpLog,
        ]

        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars)
        if (cached !== undefined) {
            return cached
        }

        if (runeDef.isUnlocked && !runeDef.isUnlocked(data)) {
            this.#ctx.updateCalculationCache(cacheName, { value: 0, cachedBy: calculationVars })
            return 0
        }

        if (data.currentChallenge.reincarnation === 9 && !runeDef.ignoreChal9) {
            this.#ctx.updateCalculationCache(cacheName, { value: 1, cachedBy: calculationVars })
            return 1
        }

        const runeLevel = this.getRuneLevelFromEXP(rune, data.runes[rune])
        const effectiveLevel = (runeLevel + freeLevels) * effectiveMult

        this.#ctx.updateCalculationCache(cacheName, { value: effectiveLevel, cachedBy: calculationVars })
        return effectiveLevel
    }

    public calculateTotalRuneLevels = (): number => {
        const data = this.#ctx.getGameData()
        if (!data) return 0

        return RUNE_KEYS.reduce((sum, rune) => sum + this.getRuneLevelFromEXP(rune, data.runes[rune]), 0)
    }

    private getRuneLevelFromEXP = (rune: RuneKeys, runeEXP: Decimal): number => {
        const expLog10 = runeEXP.gt(0) ? runeEXP.log10() : Number.NEGATIVE_INFINITY
        const costLog10 = this.R_runes[rune].costCoefficient.log10()
        const log10ExpOverCostPlus1 = expLog10 - costLog10 + 1

        return Math.max(0, Math.floor(this.R_getLevelsPerOOM(rune) * log10ExpOverCostPlus1))
    }
}
