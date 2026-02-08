/**
 * Type augmentations for the Blades in the Dark system running in Foundry VTT.
 *
 * These are intentionally loose — the BitD system uses plain JS with no
 * published type definitions, so we declare only the shapes we actually read.
 */

// ─── BitD Skill / Attribute shapes ──────────────────────────────────────────

export interface BladesSkill {
    label: string;
    value: number;
    max?: number;
}

export interface BladesAttribute {
    label: string;
    skills: Record<string, BladesSkill>;
    exp?: number;
}

export interface BladesCharacterSystem {
    attributes: {
        insight: BladesAttribute;
        prowess: BladesAttribute;
        resolve: BladesAttribute;
    };
    stress: { value: number; max: number };
    trauma: Record<string, boolean>;
    crew: Array<{ id: string; name: string }>;
    [key: string]: unknown;
}

export interface BladesCrewSystem {
    tier: number;
    [key: string]: unknown;
}

export interface BladesFactionSystem {
    status: string;
    [key: string]: unknown;
}

// ─── Actor type discrimination ──────────────────────────────────────────────

export type BladesActorType = "character" | "crew" | "factions" | "npc" | "\uD83D\uDD5B clock";

// ─── game.blades API ────────────────────────────────────────────────────────

export interface BladesGameAPI {
    dice: (
        dice_amount: number,
        attribute_name?: string,
        position?: string,
        effect?: string,
        note?: string,
        current_stress?: number | string,
        current_crew_tier?: number | string,
    ) => Promise<void>;
    roller: () => Promise<void>;
}

// ─── Global augmentations ───────────────────────────────────────────────────

declare global {
    interface Game {
        blades: BladesGameAPI;
    }

    // Allow indexing into the data model for attribute lookups
    interface GameModel {
        Actor: {
            character: {
                attributes: Record<string, BladesAttribute>;
            };
        };
    }

    // Handlebars is available globally in Foundry
    const Handlebars: typeof import("handlebars");
}
