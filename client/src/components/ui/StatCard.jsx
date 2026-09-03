import { ArrowUpRight } from "lucide-react";

export default function StatCard({ icon: Icon, label, value, detail, tone = "neutral" }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-card-top">
        <div className="stat-icon"><Icon size={16} strokeWidth={1.7} /></div>
        <ArrowUpRight size={13} className="stat-arrow" />
      </div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-detail">{detail}</span>
    </article>
  );
}
