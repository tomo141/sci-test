import { AccountClient } from "@/components/science/AccountClient";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
export const dynamic="force-dynamic";
export default function Page(){return <><SiteHeaderWithAuth/><AccountClient/></>;}
