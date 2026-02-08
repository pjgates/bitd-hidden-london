import type { EffectLevel, Position, ThreatOutcome, PushAttribute } from "../shared/types.js";

/** Input parameters for a Hidden London threat roll. */
export interface ThreatRollParams {
    /** Number of action dots (base dice pool before additional threats). */
    dicePool: number;
    /** Standard or desperate. */
    position: Position;
    /** Number of additional threats accepted (each adds +1d). */
    additionalThreats: number;
    /** Effect level for this action. */
    effect: EffectLevel;
    /** Free-text note. */
    note: string;
    /** Situational modifiers currently active (display only). */
    modifiers: SituationalModifier[];
}

/** A situational modifier that shifts position or effect. */
export interface SituationalModifier {
    key: string;
    label: string;
    positionShift?: -1 | 0 | 1;
    effectShift?: -1 | 0 | 1;
}

/** Result of evaluating a single die against a threat. */
export interface DieResult {
    value: number;
    outcome: ThreatOutcome;
    /** Which threat index this die is assigned to (0 = primary). */
    threatIndex: number;
}

/** Full result of a threat roll. */
export interface ThreatRollResult {
    /** The Foundry Roll object. */
    roll: Roll;
    /** All dice values sorted high-to-low. */
    allDice: number[];
    /** The die results assigned to threats (primary + additional). */
    assignedDice: DieResult[];
    /** Leftover dice not assigned to any threat. */
    unusedDice: number[];
    /** Whether this was a zero-dice roll (2d6 take lowest). */
    zeroMode: boolean;
    /** Whether two 6s appeared (critical). */
    isCritical: boolean;
    /** The position used. */
    position: Position;
    /** The effect level. */
    effect: EffectLevel;
    /** Note text. */
    note: string;
    /** Active modifiers. */
    modifiers: SituationalModifier[];
    /** Whether XP should be marked (desperate roll). */
    markXP: boolean;
}

/** Input parameters for a Push Yourself roll. */
export interface PushRollParams {
    attribute: PushAttribute;
    dicePool: number;
}

/** Result of a Push Yourself roll. */
export interface PushRollResult {
    roll: Roll;
    allDice: number[];
    attribute: PushAttribute;
    stressCost: number;
    isCritical: boolean;
    zeroMode: boolean;
}
