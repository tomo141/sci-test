// Public project reference, verified against the existing production deployment.
// Preview and development must use a separate database so their test answers never
// enter production calibration, rankings, consent records, or experiment cohorts.
const productionHost = "grwaocjhfdberagsiiou.supabase.co";

export function databaseEnvironmentAllowed(url: string | undefined, vercelEnvironment: string | undefined) {
  if (!url) return true; // The caller reports missing configuration separately.
  try {
    return new URL(url).hostname !== productionHost || vercelEnvironment === "production";
  } catch {
    return false;
  }
}
