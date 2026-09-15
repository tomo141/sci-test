import { afterEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({sync:vi.fn(),inspect:vi.fn(),service:vi.fn()}));
vi.mock("./mail-job",()=>({runMailJobs:mocks.sync}));
vi.mock("./myasp-connection",()=>({inspectMyaspConfiguration:mocks.inspect}));
vi.mock("./server",()=>({service:mocks.service}));
import { GET } from "@/app/api/science-jobs/mail/route";
const testSecret="test-only-configuration-boundary-".repeat(2);
afterEach(()=>{vi.unstubAllEnvs();vi.resetAllMocks();});
describe("read-only MyASP field diagnostics",()=>{
  it("requires the cron secret before reading any configuration",async()=>{
    vi.stubEnv("CRON_SECRET",testSecret);
    const response=await GET(new Request("https://science.example.invalid/api/science-jobs/mail?check=fields"));
    expect(response.status).toBe(401);expect(mocks.service).not.toHaveBeenCalled();expect(mocks.inspect).not.toHaveBeenCalled();expect(mocks.sync).not.toHaveBeenCalled();
  });
  it("inspects metadata without claiming a user or synchronizing contacts",async()=>{
    vi.stubEnv("CRON_SECRET",testSecret);mocks.service.mockReturnValue({test:true});
    mocks.inspect.mockResolvedValue({state:"connected",fields:[{key:"free31",label:"検定連携：会員ID",type:"hidden",editable:true,ready:true}]});
    const response=await GET(new Request("https://science.example.invalid/api/science-jobs/mail?check=fields",{headers:{authorization:`Bearer ${testSecret}`}}));
    expect(response.status).toBe(200);expect(response.headers.get("cache-control")).toBe("no-store");expect(mocks.inspect).toHaveBeenCalledWith({test:true});expect(mocks.sync).not.toHaveBeenCalled();
  });
  it("rejects unknown modes and keeps the normal synchronization path",async()=>{
    vi.stubEnv("CRON_SECRET",testSecret);const headers={authorization:`Bearer ${testSecret}`};
    expect((await GET(new Request("https://science.example.invalid/api/science-jobs/mail?check=unknown",{headers}))).status).toBe(400);expect(mocks.inspect).not.toHaveBeenCalled();expect(mocks.sync).not.toHaveBeenCalled();
    mocks.sync.mockResolvedValue({state:"completed",outcome:"active",synchronized:1});
    expect((await GET(new Request("https://science.example.invalid/api/science-jobs/mail",{headers}))).status).toBe(200);expect(mocks.sync).toHaveBeenCalledOnce();
  });
});
