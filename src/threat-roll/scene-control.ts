import { MODULE_ID } from "../constants.js";
import { openThreatRollDialog } from "./dialog.js";
import { registerChatListeners } from "./chat.js";

const THREAT_TEMPLATE = `modules/${MODULE_ID}/dist/templates/threat-roll/threat-chat.hbs`;
const PUSH_TEMPLATE = `modules/${MODULE_ID}/dist/templates/threat-roll/push-chat.hbs`;

/**
 * Preload Handlebars templates used by this feature.
 */
export function registerTemplates(): void {
    loadTemplates([THREAT_TEMPLATE, PUSH_TEMPLATE]);
}

/**
 * Register scene control button and chat listeners.
 * Called during the `ready` hook.
 */
export function activateSceneControls(): void {
    // Register chat card button listeners
    registerChatListeners();

    // Scene control button — v13+ API
    Hooks.on("getSceneControlButtons", (controls: Record<string, { tools: Record<string, unknown> }>) => {
        if (!game.settings.get(MODULE_ID, "enableThreatRolls")) return;

        if (controls.tokens) {
            controls.tokens.tools.HiddenLondonThreatRoll = {
                name: "HiddenLondonThreatRoll",
                title: game.i18n.localize("HIDDEN_LONDON.SceneControl.Title"),
                icon: "fas fa-skull-crossbones",
                onChange: () => {
                    openThreatRollDialog();
                },
                button: true,
            };
        }
    });

    // Scene control button — v12 and below fallback
    Hooks.on("renderSceneControls", (_app: unknown, html: JQuery) => {
        if (!game.settings.get(MODULE_ID, "enableThreatRolls")) return;

        // Only for pre-v13
        if (foundry.utils.isNewerVersion(game.version, "13")) return;

        const button = $(
            `<li class="scene-control" data-tooltip="${game.i18n.localize("HIDDEN_LONDON.SceneControl.Title")}">` +
            `<i class="fas fa-skull-crossbones"></i></li>`,
        );
        button.on("click", () => openThreatRollDialog());
        html.children().first().append(button);
    });
}
