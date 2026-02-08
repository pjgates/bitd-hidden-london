import { onInit } from "./hooks/init.js";
import { onReady } from "./hooks/ready.js";
import "../styles/module.scss";
import { MODULE_ID } from "./constants.js";

Hooks.once("init", () => {
    console.log(`${MODULE_ID} | Initializing Hidden London`);
    onInit();
});

Hooks.once("ready", () => {
    console.log(`${MODULE_ID} | Hidden London ready`);
    onReady();
});

export { MODULE_ID };
