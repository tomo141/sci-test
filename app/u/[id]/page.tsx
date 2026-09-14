import { notFound } from "next/navigation";
import { getPublicProfile } from "@/src/lib/science/public";
import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { SiteHeader } from "@/components/layout/SiteHeader";
export const dynamic="force-dynamic";
export const metadata={title:"公開プロフィール",robots:{index:false,follow:false}};
export default async function ProfilePage({params}:{params:Promise<{id:string}>}){
  const profile=await getPublicProfile((await params).id);if(!profile)notFound();
  return <><SiteHeader/><main className="page-container max-w-3xl py-10"><AppCard><h1 className="break-words text-3xl font-black">{profile.nickname}</h1><p className="mt-5 whitespace-pre-wrap break-words leading-8">{profile.bio}</p><ul className="mt-5 flex flex-wrap gap-2">{profile.interests.map(d=><li key={d} className="rounded-xl bg-[var(--color-primary-50)] px-3 py-2 text-sm">{d}</li>)}</ul><h2 className="mt-8 text-xl font-black">公開した受験記録</h2><p className="mt-2 text-sm text-[var(--color-muted)]">本人が選んだ公開記録のうち、最近の20件です。</p><ul className="mt-4 grid gap-3">{profile.shares.map(s=><li key={s.id}><AppButton href={`/s/${s.id}`} variant="secondary">{s.label}</AppButton></li>)}</ul>{profile.shares.length===0&&<p className="mt-4">公開された受験記録はまだありません。</p>}</AppCard></main></>;
}
