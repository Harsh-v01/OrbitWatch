import { Activity, Database, Eye, Globe2 } from "lucide-react";
import StatCard from "../ui/StatCard";

export default function DashboardStats({ satellites, status, updatedAt, location }) {
  const visible = satellites.filter((satellite) => satellite.elevation >= 0).length;
  const source = status === "stale" ? "Cached" : status === "ready" ? "Live" : status === "loading" ? "Syncing" : "Offline";
  const tone = status === "ready" ? "green" : status === "stale" ? "amber" : status === "unavailable" ? "red" : "neutral";

  return (
    <div className="stats-grid">
      <StatCard icon={Activity} label="TRACKED OBJECTS" value={satellites.length} detail="In the active catalog" />
      <StatCard icon={Eye} label="ABOVE HORIZON" value={visible} detail="Currently observable" tone="amber" />
      <StatCard icon={Database} label="ORBITAL FEED" value={source} detail={updatedAt ? "Propagation data available" : "Waiting for source"} tone={tone} />
      <StatCard icon={Globe2} label="OBSERVER" value={location?.name || "Locating"} detail={location ? `${location.lat.toFixed(2)}° · ${location.lng.toFixed(2)}°` : "Location pending"} />
    </div>
  );
}
