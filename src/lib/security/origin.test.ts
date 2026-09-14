import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { sameRequestOrigin } from "./origin";

describe("browser request origin",()=>{
  it("preserves the actual loopback host despite NextURL normalization",()=>{
    const request=new NextRequest("http://127.0.0.1:3017/api/science/plan",{headers:{host:"127.0.0.1:3017",origin:"http://127.0.0.1:3017","sec-fetch-site":"same-origin"}});
    expect(request.url).toContain("localhost:3017");
    expect(sameRequestOrigin(request)).toBe(true);
  });
  it("accepts the exact public host and protocol when the framework URL uses an internal host",()=>{
    expect(sameRequestOrigin({url:"https://internal.example/api",headers:new Headers({host:"science.example",origin:"https://science.example"})})).toBe(true);
  });
  it.each<Record<string,string>>([
    {},{origin:"null"},{origin:"https://attacker.example"},{origin:"http://science.example"},
    {origin:"https://science.example:444"},{origin:"https://science.example.attacker.example"},
    {origin:"https://science.example/extra"},{origin:"https://attacker.example","x-forwarded-host":"attacker.example"},
    {origin:"https://science.example","sec-fetch-site":"cross-site"},
    {origin:"https://attacker.example",host:"science.example@attacker.example"},
    {origin:"https://science.example",host:"science.example,attacker.example"},
    {origin:"https://science.example",host:""}
  ])("rejects absent or mismatched origins and ambiguous hosts: %j",(headers)=>{
    expect(sameRequestOrigin({url:"https://science.example/api",headers:new Headers({host:"science.example",...headers})})).toBe(false);
  });
});
