import Icon from "./Icon";

/*
 * Panel header. The rank number is the visual hierarchy made
 * literal: the observer reads 01 radar, 02 selected object,
 * 03 next pass, and only then the supporting readouts.
 */
export default function PanelHeader({
  rank,
  icon,
  eyebrow,
  title,
  aside,
}) {
  return (
    <header className="panel-header">
      {rank && <span className="panel-rank">{rank}</span>}

      {icon && (
        <span className="panel-header-icon">
          <Icon as={icon} size={15} />
        </span>
      )}

      <div className="panel-header-text">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>

      {aside && <div className="panel-header-aside">{aside}</div>}
    </header>
  );
}
