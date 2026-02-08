import type { EffectLevel, Position } from "../shared/types.js";
import { executeThreatRoll } from "./roll.js";
import { postThreatRollChat } from "./chat.js";
import type { SituationalModifier, ThreatRollParams } from "./types.js";

/** All available situational modifiers with their mechanical effects. */
const SITUATIONAL_MODIFIERS: SituationalModifier[] = [
    { key: "home_turf", label: "HIDDEN_LONDON.Modifier.HomeTurf", positionShift: -1 },
    { key: "spirit_pact", label: "HIDDEN_LONDON.Modifier.SpiritPact", positionShift: -1, effectShift: 1 },
    { key: "operating_blind", label: "HIDDEN_LONDON.Modifier.OperatingBlind", positionShift: 1 },
    { key: "hostile_territory", label: "HIDDEN_LONDON.Modifier.HostileTerritory", positionShift: 1 },
    { key: "target_vulnerable", label: "HIDDEN_LONDON.Modifier.TargetVulnerable", effectShift: 1 },
    { key: "target_prepared", label: "HIDDEN_LONDON.Modifier.TargetPrepared", effectShift: -1 },
];

/**
 * Try to read the selected token's action dice pool.
 * Returns 0 if nothing is selected or readable.
 */
function getSelectedTokenDicePool(): number {
    const selected = canvas?.tokens?.controlled ?? [];
    if (selected.length === 0) return 0;
    const actor = selected[0].actor;
    if (!actor || actor.type !== "character") return 0;
    return 0; // Can't determine action without knowing which action — start at 0
}

/**
 * Open the Hidden London threat roll dialog.
 */
export function openThreatRollDialog(): void {
    const defaultPool = getSelectedTokenDicePool();

    // Build modifier checkboxes HTML
    const modifierRows = SITUATIONAL_MODIFIERS.map((m) => {
        const label = game.i18n.localize(m.label);
        const effectNote: string[] = [];
        if (m.positionShift === -1) effectNote.push(game.i18n.localize("HIDDEN_LONDON.ReduceThreat"));
        if (m.positionShift === 1) effectNote.push(game.i18n.localize("HIDDEN_LONDON.IncreaseThreat"));
        if (m.effectShift === 1) effectNote.push(game.i18n.localize("HIDDEN_LONDON.IncreaseEffect"));
        if (m.effectShift === -1) effectNote.push(game.i18n.localize("HIDDEN_LONDON.ReduceEffect"));
        const hint = effectNote.length ? ` (${effectNote.join(", ")})` : "";
        return `<div class="form-group hl-modifier-row">
            <label>
                <input type="checkbox" name="mod_${m.key}" data-key="${m.key}">
                ${label}${hint}
            </label>
        </div>`;
    }).join("\n");

    // Build dice pool options (0d to 10d)
    const poolOptions = Array.from({ length: 11 }, (_, i) =>
        `<option value="${i}" ${i === defaultPool ? "selected" : ""}>${i}d</option>`,
    ).join("");

    const content = `
    <form class="hl-threat-dialog">
        <div class="form-group">
            <label>${game.i18n.localize("HIDDEN_LONDON.DicePool")}:</label>
            <select name="dicePool">${poolOptions}</select>
        </div>

        <div class="form-group">
            <label>${game.i18n.localize("HIDDEN_LONDON.Position")}:</label>
            <select name="position">
                <option value="standard" selected>${game.i18n.localize("HIDDEN_LONDON.Position.Standard")}</option>
                <option value="desperate">${game.i18n.localize("HIDDEN_LONDON.Position.Desperate")}</option>
            </select>
        </div>

        <div class="form-group">
            <label>${game.i18n.localize("HIDDEN_LONDON.AdditionalThreats")}:</label>
            <select name="additionalThreats">
                ${Array.from({ length: 6 }, (_, i) =>
                    `<option value="${i}" ${i === 0 ? "selected" : ""}>${i}</option>`,
                ).join("")}
            </select>
        </div>

        <div class="form-group">
            <label>${game.i18n.localize("HIDDEN_LONDON.Effect")}:</label>
            <select name="effect">
                <option value="limited">${game.i18n.localize("HIDDEN_LONDON.Effect.Limited")}</option>
                <option value="standard" selected>${game.i18n.localize("HIDDEN_LONDON.Effect.Standard")}</option>
                <option value="great">${game.i18n.localize("HIDDEN_LONDON.Effect.Great")}</option>
                <option value="extreme">${game.i18n.localize("HIDDEN_LONDON.Effect.Extreme")}</option>
            </select>
        </div>

        <fieldset class="hl-modifiers-fieldset">
            <legend>${game.i18n.localize("HIDDEN_LONDON.SituationalModifiers")}</legend>
            ${modifierRows}
        </fieldset>

        <div class="form-group">
            <label>${game.i18n.localize("HIDDEN_LONDON.Notes")}:</label>
            <input type="text" name="note" value="">
        </div>
    </form>`;

    new Dialog({
        title: game.i18n.localize("HIDDEN_LONDON.ThreatRoll"),
        content,
        buttons: {
            roll: {
                icon: '<i class="fas fa-dice"></i>',
                label: game.i18n.localize("HIDDEN_LONDON.Roll"),
                callback: async (html: JQuery) => {
                    const form = html.find("form.hl-threat-dialog");
                    const dicePool = Number(form.find('[name="dicePool"]').val());
                    const position = form.find('[name="position"]').val() as Position;
                    const additionalThreats = Number(form.find('[name="additionalThreats"]').val());
                    const effect = form.find('[name="effect"]').val() as EffectLevel;
                    const note = (form.find('[name="note"]').val() as string) ?? "";

                    // Gather active modifiers
                    const activeModifiers: SituationalModifier[] = [];
                    form.find('input[type="checkbox"]:checked').each(function () {
                        const key = $(this).data("key") as string;
                        const mod = SITUATIONAL_MODIFIERS.find((m) => m.key === key);
                        if (mod) activeModifiers.push(mod);
                    });

                    const params: ThreatRollParams = {
                        dicePool,
                        position,
                        additionalThreats,
                        effect,
                        note,
                        modifiers: activeModifiers,
                    };

                    const result = await executeThreatRoll(params);
                    await postThreatRollChat(result);
                },
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("Cancel"),
            },
        },
        default: "roll",
    }).render(true);
}
