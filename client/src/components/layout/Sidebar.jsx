import {
  Activity,
  BookOpen,
  CalendarClock,
  Compass,
  Satellite,
} from "lucide-react";

const NAVIGATION = [
  { id: "sky", label: "Sky", sub: "Live radar", icon: Compass },
  { id: "satellites", label: "Satellites", sub: "Object catalog", icon: Satellite },
  { id: "passes", label: "Passes", sub: "Visibility", icon: CalendarClock },
  { id: "about", label: "About", sub: "How it works", icon: BookOpen },
];

export default function Sidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="app-sidebar">
      <div className="brand">
        <div className="brand-orbit"><span /></div>
        <div>
          <div className="brand-name">OrbitWatch</div>
          <div className="brand-sub">ORBITAL INTELLIGENCE</div>
        </div>
      </div>

      <div className="nav-label">MISSION CONTROL</div>
      <nav className="sidebar-nav">
        {NAVIGATION.map(({ id, label, sub, icon: Icon }) => (
          <button
            key={id}
            className={`sidebar-link ${activeSection === id ? "active" : ""}`}
            onClick={() => onSectionChange(id)}
          >
            <span className="sidebar-icon"><Icon size={17} strokeWidth={1.65} /></span>
            <span className="sidebar-link-copy">
              <b>{label}</b>
              <small>{sub}</small>
            </span>
            {activeSection === id && <i className="active-pip" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="connection-card">
          <div className="connection-top">
            <span className="pulse-dot" />
            <span>TRACKING SYSTEM</span>
            <strong>LOCAL</strong>
          </div>
          <p>SGP4 propagation engine connected to the OrbitWatch API.</p>
        </div>

        <div className="sidebar-foot">
          <span><Activity size={11} /> LIVE SYSTEM</span>
          <span>0.2.0</span>
        </div>
      </div>
    </aside>
  );
}
