export default function Badge({ tone = "neutral", children, dot = false }) {
  return (
    <span className={`ow-badge ow-badge-${tone}`}>
      {dot && <span className="ow-badge-dot" />}
      {children}
    </span>
  );
}
