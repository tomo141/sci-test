export class RequestError extends Error {
  constructor(message: string, public code: string, public details: Record<string, unknown>) { super(message); }
}
export async function scienceApi<T>(action: string, body: unknown, area:"science"|"science-community"|"science-admin"="science"): Promise<T> {
  let response: globalThis.Response;
  try {
    response = await fetch(`/api/${area}/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch { throw new RequestError("通信できませんでした。接続を確認して再試行してください。", "network_error", {}); }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new RequestError(data?.error ?? "処理を完了できませんでした。再試行してください。", data?.code ?? "server_error", data ?? {});
  return data as T;
}
