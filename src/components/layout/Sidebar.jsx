function Sidebar({ activeSection, onSectionChange }) {
  const navigation = [
    {
      id: "sky",
      label: "Sky",
      icon: "◌",
    },
    {
      id: "satellites",
      label: "Satellites",
      icon: "✦",
    },
    {
      id: "passes",
      label: "Passes",
      icon: "◷",
    },
    {
      id: "about",
      label: "About",
      icon: "i",
    },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-symbol">
          <span />
          <span />
          <span />
        </div>

        <div>
          <strong>ORBITWATCH</strong>
          <small>SKY TRACKER</small>
        </div>
      </div>

      <div className="nav-label">EXPLORE</div>

      <nav className="navigation">
        {navigation.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${
              activeSection === item.id ? "active" : ""
            }`}
            onClick={() => onSectionChange(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>

            {activeSection === item.id && (
              <span className="nav-active-line" />
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="observer-card">
          <div className="observer-heading">
            <span className="observer-dot" />
            OBSERVER
          </div>

          <div className="observer-title">
            Local sky
          </div>

          <p>
            Your position changes what appears above the horizon.
          </p>
        </div>

        <div className="sidebar-footer">
          <span>OW / 01</span>
          <span>© 2026</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;