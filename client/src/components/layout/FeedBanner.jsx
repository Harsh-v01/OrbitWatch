import { AlertTriangle, CheckCircle2, Database, RefreshCw } from "lucide-react";

import { feedState, providerLabel } from "../../lib/feed";
import Icon from "../ui/Icon";

/*
 * Only appears when the feed is not fully live. Keeping it out of
 * the layout during normal operation means the observer is never
 * told what they can already see working.
 */
export default function FeedBanner({ status, error, orbitalData }) {
  if (status === "ready") return null;

  const feed = feedState(status, orbitalData);
  const provider = providerLabel(orbitalData);

  const icon =
    feed.key === "unavailable" || feed.key === "error"
      ? AlertTriangle
      : feed.key === "stale"
        ? Database
        : feed.key === "live"
          ? CheckCircle2
          : RefreshCw;

  return (
    <div className={`feed-banner feed-${feed.tone}`} role="status">
      <span className="feed-banner-icon">
        <Icon as={icon} size={15} />
      </span>

      <div className="feed-banner-copy">
        <strong>{feed.headline}</strong>
        <p>{feed.detail}</p>
        {error && (feed.key === "unavailable" || feed.key === "error") && (
          <code>{error}</code>
        )}
      </div>

      <span className="feed-banner-chain">
        CelesTrak → SatNOGS → cache
        {provider && <em>now: {provider}</em>}
      </span>
    </div>
  );
}
