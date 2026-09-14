import { ResultClient } from "@/components/science/ResultClient";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { AppButton } from "@/components/ui/AppButton";
import { z } from "zod";
export const dynamic="force-dynamic";
export default async function ResultPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const p=await searchParams;
  return <><SiteHeaderWithAuth/>{z.string().uuid().safeParse(p.attempt).success?<ResultClient attemptId={p.attempt!}/>:<main className="page-container py-10"><h1 className="text-2xl font-black">受験結果は履歴から確認できます</h1><p className="mt-4">旧版の記録と今回の記録をマイページに分けて残しています。</p><AppButton href="/mypage" className="mt-5">受験履歴へ</AppButton></main>}</>;
}
