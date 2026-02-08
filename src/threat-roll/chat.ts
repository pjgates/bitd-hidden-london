import { MODULE_ID } from "../constants.js";
import type { PushAttribute } from "../shared/types.js";
import { executePushRoll } from "./push.js";
import type { ThreatRollResult, PushRollResult } from "./types.js";

const THREAT_TEMPLATE = `modules/${MODULE_ID}/dist/templates/threat-roll/threat-chat.hbs`;
const PUSH_TEMPLATE = `modules/${MODULE_ID}/dist/templates/threat-roll/push-chat.hbs`;

/**
 * Post a threat roll result to chat.
 */
export async function postThreatRollChat(result: ThreatRollResult): Promise<void> {
    const templateData = {
        allDice: result.allDice,
        assignedDice: result.assignedDice.map((d) => ({
            ...d,
            outcomeLabel: game.i18n.localize(`HIDDEN_LONDON.Outcome.${capitalize(d.outcome)}`),
            outcomeClass: d.outcome,
        })),
        unusedDice: result.unusedDice,
        zeroMode: result.zeroMode,
        isCritical: result.isCritical,
        position: result.position,
        positionLabel: game.i18n.localize(`HIDDEN_LONDON.Position.${capitalize(result.position)}`),
        effect: result.effect,
        effectLabel: game.i18n.localize(`HIDDEN_LONDON.Effect.${capitalize(result.effect)}`),
        note: result.note,
        modifiers: result.modifiers.map((m) => ({
            ...m,
            label: game.i18n.localize(m.label),
        })),
        markXP: result.markXP,
        moduleId: MODULE_ID,
        // Primary outcome for the main header
        primaryOutcome: result.assignedDice[0]?.outcome ?? "threat",
        primaryOutcomeLabel: game.i18n.localize(
            `HIDDEN_LONDON.Outcome.${capitalize(result.assignedDice[0]?.outcome ?? "threat")}`,
        ),
    };

    const content = await renderTemplate(THREAT_TEMPLATE, templateData);

    const messageData: Record<string, unknown> = {
        speaker: ChatMessage.getSpeaker(),
        content,
        rolls: [result.roll],
    };

    await ChatMessage.create(messageData);
}

/**
 * Post a push yourself result to chat.
 */
export async function postPushRollChat(result: PushRollResult): Promise<void> {
    const templateData = {
        allDice: result.allDice,
        attribute: result.attribute,
        attributeLabel: game.i18n.localize(`HIDDEN_LONDON.Attribute.${capitalize(result.attribute)}`),
        stressCost: result.stressCost,
        isCritical: result.isCritical,
        zeroMode: result.zeroMode,
    };

    const content = await renderTemplate(PUSH_TEMPLATE, templateData);

    const messageData: Record<string, unknown> = {
        speaker: ChatMessage.getSpeaker(),
        content,
        rolls: [result.roll],
    };

    await ChatMessage.create(messageData);
}

/**
 * Handle the Push Yourself button click from a threat roll chat card.
 */
export function registerChatListeners(): void {
    Hooks.on("renderChatMessage", (_msg: ChatMessage, html: JQuery) => {
        html.find(".hl-push-button").on("click", async (event) => {
            event.preventDefault();
            openPushDialog();
        });
    });
}

/**
 * Open a simple dialog to choose attribute + dice pool for Push Yourself.
 */
function openPushDialog(): void {
    // Try to get attribute dice from selected token
    let insightPool = 0;
    let prowessPool = 0;
    let resolvePool = 0;

    const selected = canvas?.tokens?.controlled ?? [];
    if (selected.length > 0) {
        const actor = selected[0].actor;
        if (actor && actor.type === "character") {
            const attrs = (actor as { system: { attributes: Record<string, { skills: Record<string, { value: number }> }> } }).system.attributes;
            if (attrs.insight) {
                insightPool = Object.values(attrs.insight.skills).reduce(
                    (sum, s) => sum + (s.value ?? 0), 0,
                );
            }
            if (attrs.prowess) {
                prowessPool = Object.values(attrs.prowess.skills).reduce(
                    (sum, s) => sum + (s.value ?? 0), 0,
                );
            }
            if (attrs.resolve) {
                resolvePool = Object.values(attrs.resolve.skills).reduce(
                    (sum, s) => sum + (s.value ?? 0), 0,
                );
            }
        }
    }

    const content = `
    <form class="hl-push-dialog">
        <p>${game.i18n.localize("HIDDEN_LONDON.Push.Instructions")}</p>

        <div class="form-group">
            <label>${game.i18n.localize("HIDDEN_LONDON.Push.Attribute")}:</label>
            <select name="attribute">
                <option value="insight">${game.i18n.localize("HIDDEN_LONDON.Attribute.Insight")} (${insightPool}d)</option>
                <option value="prowess">${game.i18n.localize("HIDDEN_LONDON.Attribute.Prowess")} (${prowessPool}d)</option>
                <option value="resolve">${game.i18n.localize("HIDDEN_LONDON.Attribute.Resolve")} (${resolvePool}d)</option>
            </select>
        </div>

        <div class="form-group">
            <label>${game.i18n.localize("HIDDEN_LONDON.Push.DiceOverride")}:</label>
            <select name="diceOverride">
                <option value="-1" selected>${game.i18n.localize("HIDDEN_LONDON.Push.UseAttribute")}</option>
                ${Array.from({ length: 11 }, (_, i) =>
                    `<option value="${i}">${i}d</option>`,
                ).join("")}
            </select>
        </div>

        <table class="hl-push-reference">
            <thead><tr>
                <th>${game.i18n.localize("HIDDEN_LONDON.Push.Result")}</th>
                <th>${game.i18n.localize("HIDDEN_LONDON.Push.StressCost")}</th>
            </tr></thead>
            <tbody>
                <tr><td>${game.i18n.localize("HIDDEN_LONDON.Outcome.Critical")}</td><td>0</td></tr>
                <tr><td>6</td><td>1</td></tr>
                <tr><td>4-5</td><td>2</td></tr>
                <tr><td>1-3</td><td>3</td></tr>
            </tbody>
        </table>
    </form>`;

    const attrPools: Record<string, number> = {
        insight: insightPool,
        prowess: prowessPool,
        resolve: resolvePool,
    };

    new Dialog({
        title: game.i18n.localize("HIDDEN_LONDON.Push.Title"),
        content,
        buttons: {
            push: {
                icon: '<i class="fas fa-fist-raised"></i>',
                label: game.i18n.localize("HIDDEN_LONDON.Push.Roll"),
                callback: async (html: JQuery) => {
                    const form = html.find("form.hl-push-dialog");
                    const attribute = form.find('[name="attribute"]').val() as PushAttribute;
                    const overrideVal = Number(form.find('[name="diceOverride"]').val());
                    const dicePool = overrideVal >= 0 ? overrideVal : (attrPools[attribute] ?? 0);

                    const result = await executePushRoll(attribute, dicePool);
                    await postPushRollChat(result);
                },
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("Cancel"),
            },
        },
        default: "push",
    }).render(true);
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
