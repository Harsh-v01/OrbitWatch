import { Activity } from "lucide-react";

import {
  DASH,
  bearing,
  deg,
  km,
  kms,
  latitude,
  longitude,
} from "../../lib/format";
import EmptyState from "../ui/EmptyState";
import Panel from "../ui/Panel";
import PanelHeader from "../ui/PanelHeader";
import Readout from "../ui/Readout";

/*
 * Rank 04 — supporting telemetry.
 *
 * Field names here match the /api/satellites/above payload
 * exactly: altitude, velocity, azimuth, elevation, distance,
 * latitude, longitude. `distance` is the slant range to the
 * observer, which is why it is labelled Range.
 */
export default function LiveTelemetry({ satellite, status }) {
  if (!satellite) {
    return (
      <Panel className="telemetry-panel">
        <PanelHeader
          rank="04"
          icon={Activity}
          eyebrow="Live telemetry"
          title="No readings"
        />
        <EmptyState
          compact
          icon={Activity}
          title="Select an object to read telemetry"
          message="Values are propagated from current orbital elements."
        />
      </Panel>
    );
  }

  const readouts = [
    { label: "Altitude", value: km(satellite.altitude), hint: "above sea level" },
    { label: "Velocity", value: kms(satellite.velocity), hint: "orbital speed" },
    { label: "Azimuth", value: bearing(satellite.azimuth), hint: "from true north" },
    { label: "Elevation", value: deg(satellite.elevation), hint: "above horizon" },
    { label: "Range", value: km(satellite.distance), hint: "from you" },
    {
      label: "Sub-satellite point",
      value:
        satellite.latitude === null || satellite.latitude === undefined
          ? DASH
          : `${latitude(satellite.latitude)}  ${longitude(satellite.longitude)}`,
      hint: "ground position",
    },
  ];

  return (
    <Panel className="telemetry-panel">
      <PanelHeader
        rank="04"
        icon={Activity}
        eyebrow="Live telemetry"
        title={satellite.name}
        aside={
          status === "stale" ? (
            <span className="panel-note">from cached elements</span>
          ) : null
        }
      />

      <div className="telemetry-grid">
        {readouts.map((readout) => (
          <Readout
            key={readout.label}
            label={readout.label}
            value={readout.value}
            hint={readout.hint}
          />
        ))}
      </div>
    </Panel>
  );
}
