import { Satellite } from "lucide-react";

import { number, since } from "../../lib/format";
import { feedState, providerLabel } from "../../lib/feed";
import Icon from "../ui/Icon";

/*
 * The one-line answer to "what is above me right now", plus how
 * fresh that answer is. Deliberately terse — the radar below is
 * the thing worth looking at.
 */
export default function SkyIntro({
  aboveCount,
  totalTracked,
  status,
  orbitalData,
  updatedAt,
  now,
}) {
  const feed = feedState(status, orbitalData);
  const provider = providerLabel(orbitalData);

  const ageMs =
    updatedAt && now ? now.getTime() - updatedAt.getTime() : null;

  const headline =
    status === "loading" && !updatedAt
      ? "Reading your sky"
      : aboveCount === 0
        ? "Nothing above your horizon"
        : `${number(aboveCount)} satellite${aboveCount === 1 ? "" : "s"} above your horizon`;

  const facts = [
    ageMs !== null ? `Orbital data updated ${since(ageMs)}` : feed.headline,
    provider ? `Source: ${provider}` : null,
    totalTracked ? `${number(totalTracked)} objects tracked` : null,
  ].filter(Boolean);

  return (
    <section className="sky-intro">
      <div className="sky-intro-main">
        <span className="eyebrow">What's above you</span>
        <h1>{headline}</h1>
      </div>

      <p className="sky-intro-facts">
        <Icon as={Satellite} size={13} />
        {facts.join(" · ")}
      </p>
    </section>
  );
}
