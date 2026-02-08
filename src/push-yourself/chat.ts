import { MODULE_ID } from "../constants.js";

type BladesActor = Actor & {
    type: string;
    system: { attributes: Record<string, { skills: Record<string, { value: number }> }> };
    rollAttributePopup: (attr: string, defaultDice?: number) => void;
    getRollData: () => { dice_amount: Record<string, number> };
};

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Try to resolve a character actor from (in order):
 * 1. The chat message speaker
 * 2. The currently selected token
 * 3. The user's assigned character
 */
function resolveCharacterActor(speakerActorId?: string | null): BladesActor | null {
    if (speakerActorId) {
        const actor = game.actors?.get(speakerActorId) as BladesActor | undefined;
        if (actor?.type === "character") return actor;
    }
    const selected = canvas?.tokens?.controlled ?? [];
    if (selected.length > 0) {
        const actor = selected[0].actor as BladesActor | undefined;
        if (actor?.type === "character") return actor;
    }
    const userChar = game.user?.character as BladesActor | undefined;
    if (userChar?.type === "character") return userChar;
    return null;
}

/**
 * Inject "Push Yourself" attribute buttons into the upstream BitD system's
 * action/threat roll chat cards when the result is a failure or partial success.
 *
 * Buttons are added per-tooltip (each threat result gets its own set).
 * Tooltips without a failure/partial result (e.g. "Unused Dice") are skipped.
 * After pushing, buttons are replaced with a confirmation message.
 */
export function registerChatListeners(): void {
    Hooks.on("renderChatMessage", (msg: ChatMessage, html: JQuery) => {
        const tooltips = html.find(".blades-die-tooltip");
        if (tooltips.length === 0) return;

        // Check if this is an action or threat roll by looking for a position
        // in the sub-label. Skip push yourself / resistance / fortune / etc.
        const smallLabel = tooltips.find(".chat-label-small").text().trim().toLowerCase();
        const positions = [
            game.i18n.localize("BITD.PositionControlled"),
            game.i18n.localize("BITD.PositionRisky"),
            game.i18n.localize("BITD.PositionDesperate"),
        ].map((s) => s.toLowerCase());
        const hasPosition = positions.some((p) => smallLabel.includes(p));
        if (!hasPosition) return;

        // Check if this message was already pushed (persisted via flag)
        const pushedSet = (msg.getFlag(MODULE_ID, "pushed") as Record<string, boolean>) ?? {};

        const speakerActorId = msg.speaker?.actor;
        const attrKeys = ["insight", "prowess", "resolve"] as const;

        // Iterate over each tooltip individually
        tooltips.each((index, el) => {
            const tip = $(el);

            // Skip if already injected
            if (tip.find(".hl-push-section").length > 0) return;

            // Only add to tooltips that have a failure or partial success result
            const hasFailed = tip.find(".die.failure").length > 0;
            const hasPartial = tip.find(".die.partial-success").length > 0;
            if (!hasFailed && !hasPartial) return;

            // If this tooltip index was already pushed, show confirmation instead
            if (pushedSet[String(index)]) {
                tip.append(`
                    <div class="hl-push-section hl-pushed">
                        <i class="fas fa-fist-raised"></i>
                        ${game.i18n.localize("HIDDEN_LONDON.Push.Pushed")}
                    </div>`);
                return;
            }

            // Build buttons
            const buttons = attrKeys
                .map((key) => {
                    const label = game.i18n.localize(`HIDDEN_LONDON.Attribute.${capitalize(key)}`);
                    return `<button class="hl-push-attr-button" type="button" data-attribute="${key}" data-tip-index="${index}">${label}</button>`;
                })
                .join("");

            tip.append(`
                <div class="hl-push-section">
                    <div class="hl-push-label">
                        <i class="fas fa-fist-raised"></i> ${game.i18n.localize("HIDDEN_LONDON.Push.PushYourself")}
                    </div>
                    <div class="hl-push-buttons">${buttons}</div>
                </div>`);

            // Bind click handlers
            tip.find(".hl-push-attr-button").on("click", async (event) => {
                event.preventDefault();
                const actor = resolveCharacterActor(speakerActorId);
                if (!actor) {
                    ui.notifications?.warn(game.i18n.localize("HIDDEN_LONDON.Push.NoCharacter"));
                    return;
                }

                const attribute = $(event.currentTarget).data("attribute") as string;
                let pool = 0;
                try {
                    pool = actor.getRollData().dice_amount?.[attribute] ?? 0;
                } catch {
                    const attrData = actor.system?.attributes?.[attribute];
                    if (attrData?.skills) {
                        pool = Object.values(attrData.skills).reduce(
                            (sum, s) => sum + (s.value ?? 0),
                            0,
                        );
                    }
                }

                // Replace buttons with "Pushed" confirmation
                const section = tip.find(".hl-push-section");
                section.html(`<i class="fas fa-fist-raised"></i> ${game.i18n.localize("HIDDEN_LONDON.Push.Pushed")}`);
                section.addClass("hl-pushed");

                // Persist the pushed state via message flag
                const current = (msg.getFlag(MODULE_ID, "pushed") as Record<string, boolean>) ?? {};
                current[String(index)] = true;
                await msg.setFlag(MODULE_ID, "pushed", current);

                // Open the system's attribute roll dialog
                actor.rollAttributePopup(attribute, pool);
            });
        });
    });
}
