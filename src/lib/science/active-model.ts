import { checked, type Context } from "./server";
import { MODEL_VERSION, supportedModel } from "./versions";
// Release activation is the measurement cutover. Deploying code must not relabel an old bank.
export async function activeModel(db: Context["db"]) {
  const response = await db.from("science_releases").select("model_version").eq("state", "active").maybeSingle();
  if (response.error) checked(response);
  const version = response.data?.model_version ?? MODEL_VERSION;
  if (!supportedModel(version)) throw new Error("unsupported_science_model");
  return version;
}
