import { safeQuery } from "@/lib/supabase-server";
import { WatchlistManager } from "@/components/watchlist-manager";
import type { WatchlistItem } from "@repo/db";

export default async function WatchlistPage() {
  const items = await safeQuery<WatchlistItem[]>((sb) =>
    sb.from("watchlist_items").select("*").order("created_at", { ascending: false })
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Watchlist</h2>
        <p className="text-[var(--muted-foreground)]">
          Manage the companies you track for regular analysis
        </p>
      </div>
      <WatchlistManager initialItems={items ?? []} />
    </div>
  );
}
