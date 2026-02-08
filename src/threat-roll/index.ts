/**
 * threat-roll feature barrel.
 *
 * Public API consumed by hooks/init.ts and hooks/ready.ts.
 */
export { registerSettings } from "./settings.js";
export { registerChatListeners } from "./chat.js";
export { openThreatRollDialog } from "./dialog.js";
export { activateSceneControls, registerTemplates } from "./scene-control.js";
