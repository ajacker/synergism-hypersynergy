import { HSGlobal } from "../hs-global";
import { HSLogger } from "../hs-logger";
import type { CalculationCache, CachedValue } from "../../../types/data-types/hs-gamedata-api-types";


export const checkCalculationCache = (
    cache: CalculationCache,
    cacheName: keyof CalculationCache,
    checkCacheAgainst: number[],
): number | undefined => {
    if (!(cacheName in cache)) {
        HSLogger.debug(() => `Could not find cache for '${cacheName}'`);
        return undefined;
    }

    const cached = cache[cacheName];

    if (cached.value === undefined || cached.cachedBy.length === 0) {
        if (HSGlobal.Debug.calculationCacheDebugMode)
            console.log(`Cache missed (reason: null value or empty cache) for ${cacheName} with value ${cached.value}`);

        return undefined;
    }

    if (cached.cachedBy.length !== checkCacheAgainst.length) {
        if (HSGlobal.Debug.calculationCacheDebugMode)
            console.warn(`Cache missed (reason: cache length mismatch) for ${cacheName} with value ${cached.value}`);

        return undefined;
    }

    for (let i = 0; i < cached.cachedBy.length; i++) {
        if (cached.cachedBy[i] !== checkCacheAgainst[i]) {
            if (HSGlobal.Debug.calculationCacheDebugMode) {
                console.log(`Cache missed (reason: calc var mismatch) for ${cacheName} (${cached.cachedBy[i]})`);
            }

            return undefined;
        }
    }

    if (HSGlobal.Debug.calculationCacheDebugMode)
        console.log(`Hit cache for ${cacheName} with value ${cached.value}`);

    return cached.value;
}

export const updateCalculationCache = (
    cache: CalculationCache,
    cacheName: keyof CalculationCache,
    newCachedValue: CachedValue,
): void => {
    if (newCachedValue.cachedBy.length === 0 || newCachedValue.value === null || newCachedValue.value === undefined) {
        if (HSGlobal.Debug.calculationCacheDebugMode)
            console.warn(`Rejected cache update for ${cacheName} (value: ${newCachedValue.value}, cachedBy: ${newCachedValue.cachedBy.length})`);

        return;
    }

    cache[cacheName] = newCachedValue;
}

export const clearCalculationCache = (template: CalculationCache): CalculationCache => {
    return { ...template };
}

export const dumpCalculationCache = (cache: CalculationCache): void => {
    console.table(cache);
}
