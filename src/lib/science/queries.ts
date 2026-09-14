import { checked } from "./server";
export async function readAll<T>(query:(from:number,to:number)=>PromiseLike<{data:T[]|null;error:{code?:string;message?:string}|null}>):Promise<T[]>{
  const records:T[]=[];
  for(let offset=0;;offset+=500){const page=checked(await query(offset,offset+499));records.push(...page);if(page.length<500)return records;}
}
