import { getSharedResult } from "@/src/lib/science/public";
import { sharedResultImage } from "@/src/lib/science/share-image";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const shared = await getSharedResult((await params).id);
  if (!shared) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  return sharedResultImage(shared);
}
