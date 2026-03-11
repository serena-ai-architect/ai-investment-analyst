import { safeQuery } from "@/lib/supabase-server";
import { PageHeader } from "@/components/page-header";
import { WatchlistManager } from "@/components/watchlist-manager";
import { DEMO_WATCHLIST } from "@/lib/demo-data";
import type { WatchlistItem } from "@repo/db";

export default async function WatchlistPage() {
  let items = await safeQuery<WatchlistItem[]>((sb) =>
    sb.from("watchlist_items").select("*").order("created_at", { ascending: false })
  );

  // Fall back to demo data
  if (!items) items = DEMO_WATCHLIST;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titleKey="watchlist.title" descriptionKey="watchlist.description" />
      <WatchlistManager initialItems={items} />
    </div>
  );
}
