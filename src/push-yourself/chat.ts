import { MODULE_ID } from "../constants.js";

/**
 * Inject "Push Yourself" attribute buttons into the upstream BitD system's
 * action roll chat cards when the result is a failure or partial success.
 *
 * Clicking a button opens the system's own attribute roll dialog for the
 * chat message's actor, delegating all push logic to the upstream system.
 */
export function registerChatListeners(): void {
    Hooks.on("renderChatMessage", (msg: ChatMessage, html: JQuery) => {
        const tooltip = html.find(".blades-die-tooltip");
        if (tooltip.length === 0) return;

        // Only inject on failure or partial success
        const hasFailed = tooltip.find(".die.failure").length > 0;
        const hasPartial = tooltip.find(".die.partial-success").length > 0;
        if (!hasFailed && !hasPartial) return;

        // Don't inject twice (re-render safety)
        if (tooltip.find(".hl-push-section").length > 0) return;

        // Resolve the actor who made the roll from the message speaker
        const speakerActorId = msg.speaker?.actor;
        if (!speakerActorId) return;

        const actor = game.actors?.get(speakerActorId) as
            | (Actor & {
                  type: string;
                  system: { attributes: Record<string, { skills: Record<string, { value: number }> }> };
                  rollAttributePopup: (attr: string, defaultDice?: number) => void;
                  getRollData: () => { dice_amount: Record<string, number> };
              })
            | undefined;
        if (!actor || actor.type !== "character") return;

        // Read attribute dice pools from the actor
        const attrs: { key: string; label: string; pool: number }[] = [];
        for (const key of ["insight", "prowess", "resolve"] as const) {
            const locLabel = game.i18n.localize(`HIDDEN_LONDON.Attribute.${capitalize(key)}`);
            let pool = 0;
            try {
                const rollData = actor.getRollData();
                pool = rollData.dice_amount?.[key] ?? 0;
            } catch {
                // Fall back to summing skills manually
                const attrData = actor.system?.attributes?.[key];
                if (attrData?.skills) {
                    pool = Object.values(attrData.skills).reduce(
                        (sum, s) => sum + (s.value ?? 0),
                        0,
                    );
                }
            }
            attrs.push({ key, label: locLabel, pool });
        }

        // Build the button group
        const buttons = attrs
            .map(
                (a) =>
                    `<button class="hl-push-attr-button" type="button" data-attribute="${a.key}" data-pool="${a.pool}">` +
                    `${a.label} (${a.pool}d)` +
                    `</button>`,
            )
            .join("");

        const section = `
            <div class="hl-push-section">
                <div class="hl-push-label">
                    <i class="fas fa-fist-raised"></i> ${game.i18n.localize("HIDDEN_LONDON.Push.PushYourself")}
                </div>
                <div class="hl-push-buttons">${buttons}</div>
            </div>`;

        tooltip.append(section);

        // Bind click handlers — delegate to the system's attribute roll popup
        tooltip.find(".hl-push-attr-button").on("click", (event) => {
            event.preventDefault();
            const btn = $(event.currentTarget);
            const attribute = btn.data("attribute") as string;
            const pool = Number(btn.data("pool"));
            actor.rollAttributePopup(attribute, pool);
        });
    });
}
