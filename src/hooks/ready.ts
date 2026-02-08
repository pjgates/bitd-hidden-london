import { MODULE_ID } from "../constants.js";
import { registerChatListeners } from "../push-yourself/index.js";

/**
 * Called once during the Foundry `ready` hook.
 * Registers chat listeners for Push Yourself buttons.
 */
export function onReady(): void {
    if (game.settings.get(MODULE_ID, "enablePushYourself")) {
        registerChatListeners();
    }
    ui.notifications?.info(`${MODULE_ID} | Hidden London active`);
}
