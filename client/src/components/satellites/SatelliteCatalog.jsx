import { ArrowUpRight, ChevronRight, Search, Satellite } from "lucide-react";
import Badge from "../ui/Badge";

export default function SatelliteCatalog({ satellites, selectedId, onSelect, query, onQueryChange }) {
  const filtered = satellites.filter((satellite) => {
    const q = query.trim().toLowerCase();
    return !q || [satellite.name, satellite.type, satellite.operator, satellite.mission].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
  });

  const india = filtered.filter((s) => s.country === "India");
  const rest = filtered.filter((s) => s.country !== "India");

  const row = (satellite) => (
    <button key={satellite.id} className={`catalog-item ${selectedId === satellite.id ? "selected" : ""}`} onClick={() => onSelect(satellite.id)}>
      <span className={`catalog-orb sat-${satellite.color}`}><Satellite size={15} /></span>
      <span className="catalog-main"><strong>{satellite.name}</strong><small>{satellite.mission || satellite.type} · {satellite.operator}</small></span>
      {satellite.country === "India" && <Badge tone="amber">INDIA</Badge>}
      <span className="catalog-number">NORAD {satellite.id}</span>
      <span className="catalog-elevation">{satellite.elevation >= 0 ? `${Math.round(satellite.elevation)}°` : "—"}</span>
      <ChevronRight size={14} className="catalog-chevron" />
    </button>
  );

  return (
    <div className="catalog-layout">
      <div className="catalog-toolbar">
        <div className="catalog-search"><Search size={15} /><input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Filter tracked objects..." /></div>
        <span>{filtered.length} OBJECTS</span>
      </div>
      {india.length > 0 && (
        <section className="catalog-group">
          <div className="catalog-group-head"><div><span className="eyebrow">INDIA MODE</span><h3>Indian missions</h3></div><Badge tone="amber" dot>{india.length} TRACKED</Badge></div>
          <div className="catalog-list">{india.map(row)}</div>
        </section>
      )}
      <section className="catalog-group">
        <div className="catalog-group-head"><div><span className="eyebrow">ACTIVE CATALOG</span><h3>Tracked objects</h3></div><ArrowUpRight size={15} /></div>
        <div className="catalog-list">{rest.map(row)}</div>
        {filtered.length === 0 && <div className="catalog-empty"><Satellite size={20} /><strong>No matching objects</strong><span>Try another name, mission or operator.</span></div>}
      </section>
    </div>
  );
}
