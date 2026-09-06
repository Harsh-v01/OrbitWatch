import { DASH } from "../../lib/format";

/*
 * A single labelled measurement.
 *
 * `value` is expected to already be a formatted string from
 * lib/format, so an absent measurement arrives here as an em
 * dash and gets styled as missing rather than as a reading.
 */
export default function Readout({ label, value, hint, size = "md" }) {
  const absent =
    value === DASH || value === null || value === undefined || value === "";

  return (
    <div className={`readout readout-${size}${absent ? " is-absent" : ""}`}>
      <span className="readout-label">{label}</span>
      <strong className="readout-value">{absent ? DASH : value}</strong>
      {hint && <span className="readout-hint">{hint}</span>}
    </div>
  );
}
