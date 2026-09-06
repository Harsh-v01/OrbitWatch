/*
 * Panel surface.
 *
 * `level` carries the visual hierarchy the product needs:
 *   primary   – the radar instrument
 *   secondary – the selected object and its next pass
 *   support   – telemetry and schedules
 *   quiet     – background context such as space weather
 *
 * Styling per level lives in styles.css, so hierarchy is a data
 * decision here rather than a pile of one-off classes.
 */
export default function Panel({
  level = "support",
  as: Element = "section",
  className = "",
  children,
  ...props
}) {
  return (
    <Element
      className={`ow-panel ow-panel-${level} ${className}`.trim()}
      {...props}
    >
      {children}
    </Element>
  );
}
