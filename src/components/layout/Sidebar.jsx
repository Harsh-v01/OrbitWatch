const NAVIGATION = [
  { id: "sky", label: "Sky" },
  { id: "satellites", label: "Satellites" },
  { id: "passes", label: "Passes" },
  { id: "about", label: "About" }
];

function Sidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true" />
        <div>
          <strong>OrbitWatch</strong>
          <small>Live sky tracker</small>
        </div>
      </div>

      <nav>
        {NAVIGATION.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeSection === item.id ? "active" : ""}`}
            onClick={() => onSectionChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-note">
        <p>Positions are propagated from current orbital elements for your exact coordinates — not looked up from a table.</p>
      </div>
    </aside>
  );
}

export default Sidebar;
