/*
 * Defensive icon renderer.
 *
 * lucide-react exports are resolved at import time, so a renamed
 * or missing icon normally throws "Element type is invalid" and
 * unmounts the whole tree. Passing icons through here turns that
 * failure into a silently omitted glyph.
 */
export default function Icon({
  as: Glyph,
  size = 16,
  strokeWidth = 1.6,
  className,
}) {
  if (!Glyph) return null;

  const type = typeof Glyph;
  if (type !== "function" && type !== "object") return null;

  return (
    <Glyph
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
      focusable="false"
    />
  );
}
