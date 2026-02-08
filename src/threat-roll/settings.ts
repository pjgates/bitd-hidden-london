import { MODULE_ID } from "../constants.js";

/**
 * Register module-level settings in Foundry.
 */
export function registerSettings(): void {
    game.settings.register(MODULE_ID, "enableThreatRolls", {
        name: game.i18n.localize("HIDDEN_LONDON.Settings.EnableThreatRolls.Name"),
        hint: game.i18n.localize("HIDDEN_LONDON.Settings.EnableThreatRolls.Hint"),
        config: true,
        default: true,
        scope: "world",
        type: Boolean,
        requiresReload: true,
    });
}
