import {beforeEach,describe,expect,it,vi} from "vitest";
const f=vi.hoisted(()=>({getUser:vi.fn(),visitorRead:vi.fn(),cookies:vi.fn()}));
vi.mock("next/headers",()=>({cookies:f.cookies}));
vi.mock("@/src/lib/supabase/environment",()=>({databaseEnvironmentAllowed:()=>true}));
vi.mock("@/src/lib/supabase/server",()=>({
  createServerSupabaseClient:async()=>({auth:{getUser:f.getUser}}),
  createServiceRoleClient:()=>({from:()=>{const q={select:()=>q,eq:()=>q,maybeSingle:f.visitorRead};return q;}})
}));
import {context} from "./server";
describe("identity verification during concurrent visitor lookup",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();f.cookies.mockResolvedValue({get:()=>({value:"a".repeat(64)})});
  f.getUser.mockResolvedValue({data:{user:null},error:null});
  f.visitorRead.mockResolvedValue({data:{id:"visitor",user_id:null},error:null});
 });
 it("allows a valid anonymous visitor only after auth is checked",async()=>{
  let finish!:(value:unknown)=>void;f.getUser.mockReturnValue(new Promise(resolve=>{finish=resolve;}));
  let returned=false;const pending=context().then(c=>{returned=true;return c;});
  await vi.waitFor(()=>expect(f.visitorRead).toHaveBeenCalled());expect(returned).toBe(false);
  finish({data:{user:null},error:null});expect((await pending).visitor.id).toBe("visitor");
 });
 it("rejects an account-bound visitor belonging to another user",async()=>{
  f.visitorRead.mockResolvedValue({data:{id:"visitor",user_id:"owner"},error:null});
  f.getUser.mockResolvedValue({data:{user:{id:"other",email_confirmed_at:"2026-09-17"}},error:null});
  await expect(context()).rejects.toMatchObject({code:"identity_required"});
 });
 it("does not treat an unconfirmed identity or auth outage as an account owner",async()=>{
  f.visitorRead.mockResolvedValue({data:{id:"visitor",user_id:"owner"},error:null});
  f.getUser.mockResolvedValueOnce({data:{user:{id:"owner",email_confirmed_at:null}},error:null});
  await expect(context()).rejects.toMatchObject({code:"identity_required"});
  f.getUser.mockResolvedValueOnce({data:{user:null},error:{name:"AuthRetryableFetchError",status:503}});
  await expect(context()).rejects.toMatchObject({code:"auth_unavailable"});
 });
});
