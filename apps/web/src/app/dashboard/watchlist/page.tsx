import { safeQuery } from "@/lib/supabase-server";
import { PageHeader } from "@/components/page-header";
import { WatchlistManager } from "@/components/watchlist-manager";
import type { WatchlistItem } from "@repo/db";

export default async function WatchlistPage() {
  const items = await safeQuery<WatchlistItem[]>((sb) =>
    sb.from("watchlist_items").select("*").order("created_at", { ascending: false })
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titleKey="watchlist.title" descriptionKey="watchlist.description" />
      <WatchlistManager initialItems={items ?? []} />
    </div>
  );
}
