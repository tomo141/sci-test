import { LabClient } from "@/components/science/LabClient";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
export const metadata={title:"みんなの出題ラボ",description:"解いて、つくって、科学の良問を一緒に育てよう。"};
export default function LabPage(){return <><SiteHeaderWithAuth/><LabClient/><SiteFooter/></>;}
