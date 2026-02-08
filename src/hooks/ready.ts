import { MODULE_ID } from "../constants.js";
import { activateSceneControls } from "../threat-roll/index.js";

/**
 * Called once during the Foundry `ready` hook.
 * Activates features and registers UI hooks.
 */
export function onReady(): void {
    activateSceneControls();
    ui.notifications?.info(`${MODULE_ID} | Hidden London active`);
}
