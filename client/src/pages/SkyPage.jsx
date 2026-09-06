import { Radar } from "lucide-react";

import { useSatellitePasses } from "../hooks/useSatellitePasses";
import { useSatelliteTrack } from "../hooks/useSatelliteTrack";
import { countAboveHorizon } from "../lib/satelliteMeta";

import ErrorBoundary from "../components/ErrorBoundary";
import FeedBanner from "../components/layout/FeedBanner";
import RadarLegend from "../components/radar/RadarLegend";
import SkyRadar from "../components/radar/SkyRadar";
import SkyIntro from "../components/sky/SkyIntro";
import LiveTelemetry from "../components/selected/LiveTelemetry";
import NextPass from "../components/selected/NextPass";
import SatelliteIdentity from "../components/selected/SatelliteIdentity";
import PassSchedule from "../components/secondary/PassSchedule";
import SpaceWeatherStrip from "../components/secondary/SpaceWeatherStrip";
import Panel from "../components/ui/Panel";
import PanelHeader from "../components/ui/PanelHeader";

/*
 * The whole observation flow on one page:
 *
 *   01 radar  ->  02 identity  ->  03 next pass  ->  04 telemetry
 *
 * Selecting a marker updates every panel below it without a
 * navigation, because the selection lives in App state and the
 * pass predictions are keyed off it.
 */
export default function SkyPage({
  location,
  satellites,
  status,
  error,
  orbitalData,
  updatedAt,
  now,
  selectedId,
  selected,
  selectionLost = false,
  onSelect,
}) {
  /*
   * Real pass predictions for the selected object, straight from
   * the backend predictor. Also feeds the arc drawn on the radar.
   */
  const {
    passes,
    nextPass,
    status: passStatus,
  } = useSatellitePasses(selected ? selectedId : null, location);

  /* Observed positions accumulated from previous polls. */
  const track = useSatelliteTrack(selected);

  const aboveCount = countAboveHorizon(satellites);

  return (
    <div className="sky-page">
      <SkyIntro
        aboveCount={aboveCount}
        totalTracked={orbitalData?.count}
        status={status}
        orbitalData={orbitalData}
        updatedAt={updatedAt}
        now={now}
      />

      <FeedBanner status={status} error={error} orbitalData={orbitalData} />

      <div className="sky-layout">
        <ErrorBoundary label="The sky radar">
          <Panel level="primary" className="radar-panel">
            <PanelHeader
              rank="01"
              icon={Radar}
              eyebrow="Live sky radar"
              title="Your sky right now"
              aside={
                <span className="panel-note">
                  Click an object to track it
                </span>
              }
            />

            <SkyRadar
              satellites={satellites}
              selectedId={selectedId}
              onSelect={onSelect}
              location={location}
              now={now}
              status={status}
              track={track}
              nextPass={nextPass}
            />

            <RadarLegend />
          </Panel>
        </ErrorBoundary>

        <div className="sky-rail">
          <ErrorBoundary label="The selected satellite panel">
            <SatelliteIdentity
              satellite={selected}
              status={status}
              selectionLost={selectionLost}
            />
          </ErrorBoundary>

          <ErrorBoundary label="The next pass panel">
            <NextPass
              satellite={selected}
              pass={nextPass}
              status={selected ? passStatus : "idle"}
              now={now}
            />
          </ErrorBoundary>

          <ErrorBoundary label="The telemetry panel">
            <LiveTelemetry satellite={selected} status={status} />
          </ErrorBoundary>
        </div>
      </div>

      <div className="sky-secondary">
        <ErrorBoundary label="The pass schedule">
          <PassSchedule
            satellite={selected}
            passes={passes}
            status={selected ? passStatus : "idle"}
            now={now}
          />
        </ErrorBoundary>

        <ErrorBoundary label="Space weather">
          <SpaceWeatherStrip />
        </ErrorBoundary>
      </div>
    </div>
  );
}
