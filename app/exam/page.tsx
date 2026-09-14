import { z } from "zod";
import { ExamClient } from "@/components/science/ExamClient";
import { isScienceDomain } from "@/src/lib/data/taxonomy";
import type { ExamKind } from "@/src/lib/science/definition";
export const dynamic = "force-dynamic";
export default async function ExamPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const p=await searchParams;
  const kind:ExamKind=["trial","full","domain","weekly","lab"].includes(p.kind??"") ? p.kind as ExamKind : "trial";
  return <ExamClient initialAttempt={z.string().uuid().safeParse(p.attempt).success?p.attempt:undefined} kind={kind} initialDomain={isScienceDomain(p.domain)?p.domain:undefined} refShare={z.string().uuid().safeParse(p.ref).success?p.ref:undefined}/>;
}
