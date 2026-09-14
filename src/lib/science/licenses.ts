import { createHash } from "node:crypto";
import { z } from "zod";
import { checked, ScienceError, type Context } from "./server";
const termsSchema=z.object({summary:z.string().min(10).max(2000),sections:z.array(z.object({title:z.string().min(1).max(200),body:z.array(z.string().min(1).max(6000)).min(1).max(10)}).strict()).min(1).max(30)}).strict();
export type LicenseContent=z.infer<typeof termsSchema>;
export type PublishedLicense={version:string;operator_name:string;terms:LicenseContent;sha256:string;published_at:string;active:boolean};
function canonical(value:unknown):unknown{
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b,"en")).map(([k,v])=>[k,canonical(v)]));
  return value;
}
export function licenseDigest(terms:LicenseContent){return createHash("sha256").update(JSON.stringify(canonical(terms))).digest("hex");}
export async function publishedLicense(db:Context["db"],version:string):Promise<PublishedLicense|null>{
  const response=await db.from("science_license_versions").select("version,operator_name,terms,sha256,published_at,active").eq("version",version).not("published_at","is",null).maybeSingle();
  if(response.error)checked(response);if(!response.data)return null;
  const record=response.data as PublishedLicense;
  const parsed=termsSchema.safeParse(record.terms);
  if(!parsed.success||licenseDigest(parsed.data)!==record.sha256)throw new ScienceError("投稿条件を確認できません。時間を置いて開き直してください。",503,"license_unavailable");
  return {...record,terms:parsed.data};
}
