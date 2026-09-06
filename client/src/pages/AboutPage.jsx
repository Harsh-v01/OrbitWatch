import { ChevronRight, Code2, Radio, ShieldCheck } from "lucide-react";

import PageHeader from "../components/layout/PageHeader";
import Icon from "../components/ui/Icon";
import Panel from "../components/ui/Panel";

const PIPELINE = ["Orbital elements", "SGP4", "Your position", "Live sky"];

const PROVIDERS = [
  {
    name: "CelesTrak",
    role: "Primary source",
    detail:
      "Orbit Mean-Elements Messages for the active catalog, fetched by group.",
  },
  {
    name: "SatNOGS",
    role: "Fallback source",
    detail:
      "Used when CelesTrak is unreachable, as JSON first and then as 3LE text.",
  },
  {
    name: "Local cache",
    role: "Last resort",
    detail:
      "The last good catalog is kept on disk and served with a stale marker rather than showing nothing.",
  },
];

export default function AboutPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="About OrbitWatch"
        title="A small window into orbit"
        description="OrbitWatch answers four questions: where you are observing from, what is above you, what you are looking at, and when to look up."
      />

      <div className="about-layout">
        <Panel level="secondary" className="about-primary">
          <span className="eyebrow">How positions are produced</span>
          <h2>Every position is calculated, never looked up.</h2>
          <p>
            Orbital elements are propagated with SGP4 on the server, then
            converted into azimuth, elevation, slant range, altitude and a
            sub-satellite point for your exact observing position. Pass times
            come from scanning that same propagation for horizon crossings, so
            the schedule and the radar always agree.
          </p>

          <ol className="about-pipeline">
            {PIPELINE.map((step, index) => (
              <li key={step}>
                <span>{step}</span>
                {index < PIPELINE.length - 1 && (
                  <Icon as={ChevronRight} size={13} />
                )}
              </li>
            ))}
          </ol>
        </Panel>

        <Panel className="about-secondary">
          <span className="panel-header-icon">
            <Icon as={ShieldCheck} size={15} />
          </span>
          <h3>Nothing is invented</h3>
          <p>
            When a value is missing from the orbital source, OrbitWatch shows a
            dash instead of a plausible number. When the providers are
            unreachable, it says so instead of drawing satellites at guessed
            positions.
          </p>
        </Panel>

        <Panel className="about-providers">
          <span className="eyebrow">Data sources, in order</span>
          <ul>
            {PROVIDERS.map((provider) => (
              <li key={provider.name}>
                <strong>{provider.name}</strong>
                <em>{provider.role}</em>
                <p>{provider.detail}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="about-secondary">
          <span className="panel-header-icon">
            <Icon as={Radio} size={15} />
          </span>
          <h3>Refresh cadence</h3>
          <p>
            Live positions refresh every 15 seconds, pass predictions every two
            minutes, and space weather every five. The catalog itself is cached
            for two hours, with a cooldown before a failed provider is retried.
          </p>
        </Panel>

        <Panel className="about-secondary">
          <span className="panel-header-icon">
            <Icon as={Code2} size={15} />
          </span>
          <h3>How it is built</h3>
          <p>
            A React client talking to a small Express orbital service. The
            client renders; the server owns propagation, pass prediction and
            the provider fallback chain.
          </p>
        </Panel>
      </div>
    </div>
  );
}
