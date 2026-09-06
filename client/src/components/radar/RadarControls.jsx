import { Maximize2, Minimize2, Minus, Plus, Crosshair } from "lucide-react";
import Icon from "../ui/Icon";

/*
 * Plain HTML controls. These deliberately live outside the SVG —
 * foreignObject buttons are unreliable and break in fullscreen.
 */
export default function RadarControls({
  zoom,
  minZoom,
  maxZoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleFullscreen,
  isFullscreen,
}) {
  const percent = Math.round(zoom * 100);

  return (
    <div className="radar-controls" role="group" aria-label="Radar view">
      <button
        type="button"
        onClick={onZoomIn}
        disabled={zoom >= maxZoom}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <Icon as={Plus} size={15} />
      </button>

      <button
        type="button"
        onClick={onZoomOut}
        disabled={zoom <= minZoom}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <Icon as={Minus} size={15} />
      </button>

      <span className="radar-zoom-readout" aria-live="polite">
        {percent}%
      </span>

      <button
        type="button"
        onClick={onReset}
        disabled={zoom === 1}
        aria-label="Reset zoom to fit the whole sky"
        title="Reset to full sky"
      >
        <Icon as={Crosshair} size={14} />
      </button>

      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen radar"}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen radar"}
      >
        <Icon as={isFullscreen ? Minimize2 : Maximize2} size={14} />
      </button>
    </div>
  );
}
