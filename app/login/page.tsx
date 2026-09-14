import { OtpForm } from "@/components/science/OtpForm";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
export const dynamic="force-dynamic";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const p=await searchParams;return <><SiteHeaderWithAuth/><OtpForm next={p.next??"/mypage"} signup={false}/></>;
}
