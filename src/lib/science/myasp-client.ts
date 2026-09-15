import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { myaspData, type MyaspCall, type MyaspConfiguration } from "./myasp";

// Deterministic calls to the documented MyASP API. No language model or browser session is used.
export async function withMyasp<T>(config: MyaspConfiguration, fn: (call: MyaspCall) => Promise<T>) {
  const client = new Client({ name: "science-test-consent-sync", version: "1.0.0" });
  const deadline = AbortSignal.timeout(40000);
  const transport = new StreamableHTTPClientTransport(new URL(config.endpoint), {
    requestInit: { redirect: "error", headers: { "X-MyASP-Server-URL": config.server, "X-MyASP-API-Key": config.apiKey } },
    fetch: (input, init) => fetch(input, { ...init, redirect: "error", signal: AbortSignal.any([deadline, ...(init?.signal ? [init.signal] : []), AbortSignal.timeout(8000)]) }),
    reconnectionOptions: { maxRetries: 0, initialReconnectionDelay: 1000, maxReconnectionDelay: 1000, reconnectionDelayGrowFactor: 1 }
  });
  try {
    await client.connect(transport, { timeout: 8000 });
    const call: MyaspCall = async (name, args) => {
      const result = await client.callTool({ name, arguments: args }, { timeout: 8000 });
      if (result.isError) throw new Error("myasp_operation_failed");
      if (result.structuredContent) return myaspData(result.structuredContent);
      const text = result.content.filter(c => c.type === "text");
      if (text.length !== 1) throw new Error("myasp_invalid_response");
      return myaspData(text[0].text);
    };
    return await fn(call);
  } finally { await client.close(); }
}
