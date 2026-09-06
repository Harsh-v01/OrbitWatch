import { Radio, Satellite, Target } from "lucide-react";

import { DASH } from "../../lib/format";
import {
  categoryLabel,
  colorKey,
  elevationPhrase,
  isIndian,
  statusTone,
} from "../../lib/satelliteMeta";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import Icon from "../ui/Icon";
import Panel from "../ui/Panel";
import PanelHeader from "../ui/PanelHeader";

/*
 * Rank 02 — what am I looking at.
 *
 * Every field is rendered only if the provider supplied it.
 * Mission, country and operator are frequently absent for bulk
 * catalog objects, so their rows disappear rather than showing
 * invented text.
 */
export default function SatelliteIdentity({ satellite, status, selectionLost }) {
  if (!satellite) {
    return (
      <Panel level="secondary" className="identity-panel">
        <PanelHeader
          rank="02"
          icon={Target}
          eyebrow="Selected satellite"
          title={selectionLost ? "Object has set" : "Nothing selected"}
        />
        <EmptyState
          icon={Satellite}
          title={
            selectionLost
              ? "It has left your sky"
              : "Pick an object on the radar"
          }
          message={
            selectionLost
              ? "The object you were tracking is no longer in range of your horizon. Choose another marker on the radar."
              : status === "ready"
                ? "Click any marker to see its identity, live telemetry and next visible pass."
                : "Objects appear here as soon as orbital elements arrive."
          }
        />
      </Panel>
    );
  }

  const indian = isIndian(satellite);

  const rows = [
    { label: "Type", value: categoryLabel(satellite) },
    { label: "Operator", value: satellite.operator },
    {
      label: "Origin",
      value: indian ? "India" : satellite.country,
    },
    { label: "NORAD ID", value: satellite.id },
    { label: "Mission", value: satellite.mission },
  ].filter((row) => row.value !== null && row.value !== undefined && row.value !== "");

  return (
    <Panel level="secondary" className="identity-panel">
      <PanelHeader
        rank="02"
        icon={Target}
        eyebrow="Selected satellite"
        title="Identity"
        aside={
          satellite.status ? (
            <Badge tone={statusTone(satellite.status)} dot>
              {String(satellite.status).toUpperCase()}
            </Badge>
          ) : null
        }
      />

      <div className="identity-headline">
        <span className={`identity-orb sat-${colorKey(satellite)}`}>
          <Icon as={Radio} size={16} />
        </span>

        <div>
          <h3>{satellite.name ?? DASH}</h3>
          <p>{elevationPhrase(satellite)}</p>
        </div>

        {indian && (
          <span className="india-flag" title="Indian mission">
            🇮🇳 INDIA
          </span>
        )}
      </div>

      <dl className="identity-rows">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
