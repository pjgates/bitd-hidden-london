import { registerSettings } from "../push-yourself/index.js";

/**
 * Called once during the Foundry `init` hook.
 * Registers module settings.
 */
export function onInit(): void {
    registerSettings();
}
