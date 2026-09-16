// Shared by the application and offline bank preparation tools. No runtime imports.
export const LEGACY_MODEL_VERSION = "science-3pl-reference-v1";
export const MODEL_VERSION = "science-3pl-p70-linear-v2";
export const LEGACY_CURRENT_VERSION = "domain-window100-half30-v1";
export const CURRENT_VERSION = "domain-window100-half30-p70-v2";
export const supportedModel = (version: string) => version === MODEL_VERSION || version === LEGACY_MODEL_VERSION;
// Both releases use the same a/b/c coordinate system and item revisions. Only the
// prior and display transform changed. Raw response evidence is therefore compatible.
export const evidenceModels = (version: string) => version === MODEL_VERSION ? [LEGACY_MODEL_VERSION, MODEL_VERSION] : [version];
export const isP70 = (version: string) => version === MODEL_VERSION || version === CURRENT_VERSION;
export const scoreCeiling = (version: string, domain = false) => isP70(version) ? (domain ? "99" : "990") : (domain ? "100" : "1,000");
