import Icon from "../ui/Icon";

/*
 * Horizontal section switcher. The sky view is the product, so
 * it leads; the catalog, schedule and about pages stay separate
 * destinations rather than competing widgets on the sky page.
 */
export default function NavTabs({ sections, active, onChange }) {
  return (
    <nav className="nav-tabs" aria-label="Sections">
      {sections.map((section) => (
        <button
          type="button"
          key={section.id}
          className={active === section.id ? "is-active" : ""}
          onClick={() => onChange(section.id)}
          aria-current={active === section.id ? "page" : undefined}
        >
          <Icon as={section.icon} size={14} />
          {section.label}
          {section.badge !== null && section.badge !== undefined && (
            <em className="nav-badge">{section.badge}</em>
          )}
        </button>
      ))}
    </nav>
  );
}
