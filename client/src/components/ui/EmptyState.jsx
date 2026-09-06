import Icon from "./Icon";

/*
 * Every "nothing to show" condition in OrbitWatch routes through
 * here, so loading, unavailable, stale and genuinely-empty all
 * read as deliberate instrument states instead of blank space.
 */
export default function EmptyState({
  icon,
  title,
  message,
  tone = "neutral",
  action,
  compact = false,
}) {
  return (
    <div
      className={`empty-state empty-${tone}${compact ? " is-compact" : ""}`}
      role="status"
    >
      {icon && (
        <span className="empty-icon">
          <Icon as={icon} size={compact ? 16 : 20} />
        </span>
      )}

      <div className="empty-copy">
        <strong>{title}</strong>
        {message && <span>{message}</span>}
      </div>

      {action}
    </div>
  );
}
