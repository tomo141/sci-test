import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { QuickResultClient } from "@/components/result/QuickResultClient";

export const dynamic = "force-dynamic";

export default function ResultPage() {
  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container py-8">
        <h1 className="text-3xl font-black md:text-4xl">腕試し速報</h1>
        <QuickResultClient />
      </main>
      <SiteFooter />
    </>
  );
}
