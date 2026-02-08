/** Effect levels used by Hidden London threat rolls. */
export type EffectLevel = "limited" | "standard" | "great" | "extreme";

/** Position tiers for Hidden London. Standard = normal, Desperate = all-or-nothing. */
export type Position = "standard" | "desperate";

/** Outcome of a single die evaluation. */
export type ThreatOutcome = "success" | "peril" | "threat" | "critical";

/** Attribute categories for Push Yourself rolls. */
export type PushAttribute = "insight" | "prowess" | "resolve";
