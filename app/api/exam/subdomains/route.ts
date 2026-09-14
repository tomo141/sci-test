import { NextResponse } from "next/server";
import { domains, subdomainsByDomain } from "@/src/lib/data/taxonomy";
import { createServiceRoleClient } from "@/src/lib/supabase/server";

export async function GET() {
  const supabase = createServiceRoleClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("subdomain_release_status")
      .select("domain, subdomain")
      .eq("is_released", true);

    if (!error) {
      return NextResponse.json({
        subdomains: (data || []).reduce<Record<string, string[]>>((acc, row) => {
          const domain = String(row.domain);
          acc[domain] = [...(acc[domain] || []), String(row.subdomain)];
          return acc;
        }, {})
      });
    }
  }

  return NextResponse.json({
    subdomains: Object.fromEntries(domains.map((domain) => [domain, [...subdomainsByDomain[domain]]]))
  });
}
