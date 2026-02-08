import type { Position, ThreatOutcome } from "../shared/types.js";
import type { DieResult, ThreatRollParams, ThreatRollResult } from "./types.js";

/**
 * Evaluate a single die value against the current position.
 */
export function evaluateDie(value: number, position: Position): ThreatOutcome {
    if (position === "desperate") {
        return value === 6 ? "success" : "threat";
    }
    // Standard position
    if (value >= 6) return "success";
    if (value >= 4) return "peril";
    return "threat";
}

/**
 * Execute a Hidden London threat roll.
 *
 * 1. Rolls Nd6 where N = dicePool + additionalThreats (min 2 for zero-mode).
 * 2. Sorts results high-to-low.
 * 3. In zero-mode, takes the *lowest* of two dice for the primary threat.
 * 4. Assigns dice to threats: highest → primary, next → additional threats.
 * 5. Checks for critical (two 6s on primary evaluation).
 */
export async function executeThreatRoll(params: ThreatRollParams): Promise<ThreatRollResult> {
    const { dicePool, position, additionalThreats, effect, note, modifiers } = params;

    const zeroMode = dicePool <= 0;
    // In zero-mode we roll 2d6 and use the lowest; additional threats still add dice
    const totalDice = zeroMode ? 2 + additionalThreats : dicePool + additionalThreats;

    const r = new Roll(`${totalDice}d6`);
    await r.evaluate();

    const rawResults: number[] = (r.terms[0] as { results: Array<{ result: number }> }).results.map(
        (d) => d.result,
    );

    // Sort descending
    const sorted = [...rawResults].sort((a, b) => b - a);

    const assignedDice: DieResult[] = [];
    let unusedDice: number[];

    if (zeroMode) {
        // Zero-mode: two lowest dice, take the lowest for primary
        const zeroSlice = sorted.slice(sorted.length - 2); // two lowest values
        const primaryValue = Math.min(...zeroSlice);
        assignedDice.push({
            value: primaryValue,
            outcome: evaluateDie(primaryValue, position),
            threatIndex: 0,
        });

        // Remaining dice (excluding the two used for zero-mode) assigned to additional threats
        const remaining = sorted.slice(0, sorted.length - 2);
        for (let i = 0; i < additionalThreats && i < remaining.length; i++) {
            assignedDice.push({
                value: remaining[i],
                outcome: evaluateDie(remaining[i], position),
                threatIndex: i + 1,
            });
        }
        unusedDice = remaining.slice(additionalThreats);
    } else {
        // Normal mode: highest die → primary, next highest → additional threats
        const numToAssign = 1 + additionalThreats;
        for (let i = 0; i < numToAssign && i < sorted.length; i++) {
            assignedDice.push({
                value: sorted[i],
                outcome: evaluateDie(sorted[i], position),
                threatIndex: i,
            });
        }
        unusedDice = sorted.slice(numToAssign);
    }

    // Critical: two 6s among the dice (regardless of assignment)
    const sixCount = sorted.filter((v) => v === 6).length;
    const isCritical = sixCount >= 2 && !zeroMode;

    // If critical, upgrade primary outcome
    if (isCritical && assignedDice.length > 0) {
        assignedDice[0].outcome = "critical";
    }

    return {
        roll: r,
        allDice: sorted,
        assignedDice,
        unusedDice,
        zeroMode,
        isCritical,
        position,
        effect,
        note,
        modifiers,
        markXP: position === "desperate",
    };
}
