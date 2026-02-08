import type { PushAttribute } from "../shared/types.js";
import type { PushRollResult } from "./types.js";

/**
 * Consequence-type → recommended attribute mapping (informational).
 */
export const PUSH_ATTRIBUTE_HINTS: Record<string, PushAttribute> = {
    deception: "insight",
    traps: "insight",
    surprises: "insight",
    confusion: "insight",
    physical_harm: "prowess",
    exhaustion: "prowess",
    restraint: "prowess",
    mental_harm: "resolve",
    fear: "resolve",
    supernatural: "resolve",
    temptation: "resolve",
};

/**
 * Calculate stress cost from the highest die in a push roll.
 *
 * | Result    | Stress |
 * |-----------|--------|
 * | Critical  | 0      |
 * | 6         | 1      |
 * | 4-5       | 2      |
 * | 1-3       | 3      |
 */
function stressFromDie(highestDie: number, isCritical: boolean): number {
    if (isCritical) return 0;
    if (highestDie >= 6) return 1;
    if (highestDie >= 4) return 2;
    return 3;
}

/**
 * Execute a Push Yourself roll.
 *
 * Rolls the attribute's dice pool and determines the stress cost.
 */
export async function executePushRoll(
    attribute: PushAttribute,
    dicePool: number,
): Promise<PushRollResult> {
    const zeroMode = dicePool <= 0;
    const rollCount = zeroMode ? 2 : dicePool;

    const r = new Roll(`${rollCount}d6`);
    await r.evaluate();

    const rawResults: number[] = (r.terms[0] as { results: Array<{ result: number }> }).results.map(
        (d) => d.result,
    );
    const sorted = [...rawResults].sort((a, b) => b - a);

    let highestDie: number;
    if (zeroMode) {
        // Zero-mode: take lowest of two dice
        highestDie = Math.min(sorted[0], sorted[1]);
    } else {
        highestDie = sorted[0];
    }

    // Critical: two 6s
    const sixCount = sorted.filter((v) => v === 6).length;
    const isCritical = sixCount >= 2 && !zeroMode;

    const stressCost = stressFromDie(highestDie, isCritical);

    return {
        roll: r,
        allDice: sorted,
        attribute,
        stressCost,
        isCritical,
        zeroMode,
    };
}
