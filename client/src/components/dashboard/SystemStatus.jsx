import { AlertTriangle, CheckCircle2, Database, RefreshCw } from "lucide-react";
import Badge from "../ui/Badge";

export default function SystemStatus({ status, error, orbitalData }) {
  const isReady = status === "ready";
  const isStale = status === "stale";
  const unavailable = status === "unavailable" || status === "error";

  return (
    <div className={`system-status ${isReady ? "ready" : isStale ? "stale" : "offline"}`}>
      <div className="status-icon">
        {isReady ? <CheckCircle2 size={16} /> : unavailable ? <AlertTriangle size={16} /> : <RefreshCw size={16} />}
      </div>
      <div className="status-copy">
        <div>
          <b>{isReady ? "Orbital tracking live" : isStale ? "Using cached orbital data" : unavailable ? "Orbital feed unavailable" : "Connecting to orbital feed"}</b>
          <Badge tone={isReady ? "green" : isStale ? "amber" : "red"} dot>
            {isReady ? "LIVE" : isStale ? "STALE" : unavailable ? "OFFLINE" : "SYNCING"}
          </Badge>
        </div>
        <p>
          {isReady
            ? `Propagating ${orbitalData?.count ?? 0} catalog objects for your observing location.`
            : isStale
              ? `The last successful catalog is being used${orbitalData?.ageMs ? ` · ${Math.round(orbitalData.ageMs / 60000)} min old` : ""}.`
              : "No fabricated positions are shown. The tracker will resume when a usable orbital source is available."}
        </p>
        {error && unavailable && <small>{error}</small>}
      </div>
      <Database size={15} className="status-database" />
    </div>
  );
}
