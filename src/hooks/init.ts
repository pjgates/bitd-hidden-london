import { registerSettings, registerTemplates } from "../threat-roll/index.js";

/**
 * Called once during the Foundry `init` hook.
 * Registers module settings and preloads Handlebars templates.
 */
export function onInit(): void {
    registerSettings();
    registerTemplates();
}
