import * as satellite from "satellite.js";

import {
  getCatalog,
  getSatelliteByCatalogNumber
} from "./tleCache.js";

const RAD2DEG =
  180 / Math.PI;

const DEG2RAD =
  Math.PI / 180;

function toObserverGd(
  lat,
  lng,
  altKm = 0
) {
  return {
    longitude:
      lng * DEG2RAD,

    latitude:
      lat * DEG2RAD,

    height:
      altKm
  };
}

function statusFor(
  elevationNow,
  elevationSoon
) {
  if (
    elevationNow <= 0 &&
    elevationSoon <= 0
  ) {
    return "Below horizon";
  }

  if (
    elevationSoon >
    elevationNow + 0.01
  ) {
    return "Rising";
  }

  if (
    elevationSoon <
    elevationNow - 0.01
  ) {
    return "Setting";
  }

  return "Active";
}

function isFiniteNumber(value) {
  return Number.isFinite(
    Number(value)
  );
}

function isValidDate(value) {
  return value instanceof Date &&
    Number.isFinite(
      value.getTime()
    );
}

function serializePass(pass) {
  if (
    !isValidDate(pass.start) ||
    !isValidDate(pass.end) ||
    !isValidDate(pass.maxElevationTime) ||
    !isFiniteNumber(pass.maxElevation) ||
    !isFiniteNumber(pass.startAzimuth) ||
    !isFiniteNumber(pass.maxElevationAzimuth) ||
    !isFiniteNumber(pass.endAzimuth) ||
    !isFiniteNumber(pass.durationSeconds) ||
    pass.durationSeconds < 0
  ) {
    return null;
  }

  return {
    start:
      pass.start.toISOString(),

    end:
      pass.end.toISOString(),

    maxElevationTime:
      pass.maxElevationTime.toISOString(),

    maxElevation:
      Number(pass.maxElevation),

    startAzimuth:
      Number(pass.startAzimuth),

    maxElevationAzimuth:
      Number(pass.maxElevationAzimuth),

    endAzimuth:
      Number(pass.endAzimuth),

    durationSeconds:
      Math.round(
        Number(pass.durationSeconds)
      )
  };
}

function computeState(
  entry,
  observerGd,
  date
) {
  const satrec =
    entry.satrec;

  if (!satrec) {
    return null;
  }

  const propagated =
    satellite.propagate(
      satrec,
      date
    );

  if (
    !propagated?.position ||
    !propagated?.velocity
  ) {
    return null;
  }

  const gmst =
    satellite.gstime(date);

  const positionEcf =
    satellite.eciToEcf(
      propagated.position,
      gmst
    );

  const lookAngles =
    satellite.ecfToLookAngles(
      observerGd,
      positionEcf
    );

  const geodetic =
    satellite.eciToGeodetic(
      propagated.position,
      gmst
    );

  const {
    x: vx,
    y: vy,
    z: vz
  } = propagated.velocity;

  const speedKmS =
    Math.sqrt(
      vx * vx +
      vy * vy +
      vz * vz
    );

  /*
   * eciToGeodetic returns latitude/longitude in radians.
   * These are already computed above, so exposing them costs
   * nothing and lets the client show the sub-satellite point.
   */
  const latitudeDeg =
    geodetic.latitude *
    RAD2DEG;

  const longitudeDeg =
    (
      (
        geodetic.longitude *
          RAD2DEG +
        540
      ) % 360
    ) - 180;

  return {
    azimuth:
      (
        lookAngles.azimuth *
          RAD2DEG +
        360
      ) % 360,

    elevation:
      lookAngles.elevation *
      RAD2DEG,

    rangeKm:
      lookAngles.rangeSat,

    altitudeKm:
      geodetic.height,

    velocityKmS:
      speedKmS,

    latitudeDeg,

    longitudeDeg
  };
}

export async function getVisibleSatellites({
  lat,
  lng,
  alt = 0,
  minElevation = -12,
  limit = 60
}) {
  const catalog =
    await getCatalog();

  const observerGd =
    toObserverGd(
      lat,
      lng,
      alt
    );

  const now =
    new Date();

  const soon =
    new Date(
      now.getTime() +
      20_000
    );

  const results = [];

  for (
    const entry of catalog
  ) {
    const state =
      computeState(
        entry,
        observerGd,
        now
      );

    if (
      !state ||
      state.elevation <
        minElevation
    ) {
      continue;
    }

    const future =
      computeState(
        entry,
        observerGd,
        soon
      );

    const status =
      future
        ? statusFor(
            state.elevation,
            future.elevation
          )
        : state.elevation > 0
          ? "Active"
          : "Below horizon";

    results.push({
      id:
        entry.catalogNumber,

      name:
        entry.name,

      type:
        entry.type,

      operator:
        entry.operator,

      category:
        entry.category,

      color:
        entry.colorKey,

      country:
        entry.country,

      mission:
        entry.mission,

      featured:
        entry.featured,

      azimuth:
        Number(
          state.azimuth.toFixed(1)
        ),

      elevation:
        Number(
          state.elevation.toFixed(1)
        ),

      distance:
        Math.round(
          state.rangeKm
        ),

      altitude:
        Math.round(
          state.altitudeKm
        ),

      velocity:
        Number(
          state.velocityKmS.toFixed(2)
        )
    ,
      latitude:
        Number(
          state.latitudeDeg.toFixed(3)
        ),

      longitude:
        Number(
          state.longitudeDeg.toFixed(3)
        ),

      status
    });
  }

  results.sort(
    (a, b) =>
      b.elevation -
      a.elevation
  );

  return results.slice(
    0,
    limit
  );
}

export async function getSatelliteState({
  catalogNumber,
  lat,
  lng,
  alt = 0
}) {
  const entry =
    await getSatelliteByCatalogNumber(
      catalogNumber
    );

  if (!entry) {
    return null;
  }

  const observerGd =
    toObserverGd(
      lat,
      lng,
      alt
    );

  const state =
    computeState(
      entry,
      observerGd,
      new Date()
    );

  if (!state) {
    return null;
  }

  /*
   * Sample 20s ahead so the detail view can report the same
   * Rising / Setting / Active status as the live list.
   */
  const future =
    computeState(
      entry,
      observerGd,
      new Date(
        Date.now() +
        20_000
      )
    );

  const status =
    future
      ? statusFor(
          state.elevation,
          future.elevation
        )
      : state.elevation > 0
        ? "Active"
        : "Below horizon";

  return {
    id:
      entry.catalogNumber,

    name:
      entry.name,

    type:
      entry.type,

    operator:
      entry.operator,

    category:
      entry.category,

    color:
      entry.colorKey,

    country:
      entry.country,

    mission:
      entry.mission,

    featured:
      entry.featured,

    azimuth:
      Number(
        state.azimuth.toFixed(1)
      ),

    elevation:
      Number(
        state.elevation.toFixed(1)
      ),

    distance:
      Math.round(
        state.rangeKm
      ),

    altitude:
      Math.round(
        state.altitudeKm
      ),

    velocity:
      Number(
        state.velocityKmS.toFixed(2)
      ),

    latitude:
      Number(
        state.latitudeDeg.toFixed(3)
      ),

    longitude:
      Number(
        state.longitudeDeg.toFixed(3)
      ),

    status,

    /*
     * Orbital element metadata already carried on the catalog
     * entry. Null when the active provider did not supply it.
     */
    objectId:
      entry.objectId ?? null,

    periodMinutes:
      entry.periodMinutes ?? null,

    inclination:
      entry.inclination ?? null,

    apogeeKm:
      entry.apogeeKm ?? null,

    perigeeKm:
      entry.perigeeKm ?? null,

    epoch:
      entry.epoch ?? null,

    source:
      entry.source ?? null
  };
}

export async function getPasses({
  catalogNumber,
  lat,
  lng,
  alt = 0,
  hours = 48,
  stepSeconds = 20,
  maxPasses = 6
}) {
  const entry =
    await getSatelliteByCatalogNumber(
      catalogNumber
    );

  if (!entry?.satrec) {
    return [];
  }

  const satrec =
    entry.satrec;

  const observerGd =
    toObserverGd(
      lat,
      lng,
      alt
    );

  const start =
    Date.now();

  const end =
    start +
    hours *
      3600 *
      1000;

  const stepMs =
    stepSeconds *
    1000;

  const passes = [];

  let current = null;

  let previousElevation =
    null;

  for (
    let t = start;
    t <= end;
    t += stepMs
  ) {
    const date =
      new Date(t);

    const propagated =
      satellite.propagate(
        satrec,
        date
      );

    if (
      !propagated?.position
    ) {
      continue;
    }

    const gmst =
      satellite.gstime(
        date
      );

    const positionEcf =
      satellite.eciToEcf(
        propagated.position,
        gmst
      );

    const look =
      satellite.ecfToLookAngles(
        observerGd,
        positionEcf
      );

    const elevationDeg =
      look.elevation *
      RAD2DEG;

    const azimuthDeg =
      (
        look.azimuth *
          RAD2DEG +
        360
      ) % 360;

    if (
      previousElevation !== null &&
      previousElevation <= 0 &&
      elevationDeg > 0
    ) {
      current = {
        start: date,

        startAzimuth:
          azimuthDeg,

        maxElevation:
          elevationDeg,

        maxElevationAzimuth:
          azimuthDeg,

        maxElevationTime:
          date
      };
    }

    if (
      current &&
      elevationDeg >
        current.maxElevation
    ) {
      current.maxElevation =
        elevationDeg;

      current.maxElevationAzimuth =
        azimuthDeg;

      current.maxElevationTime =
        date;
    }

    if (
      current &&
      previousElevation !== null &&
      previousElevation > 0 &&
      elevationDeg <= 0
    ) {
      const pass =
        serializePass({
          start:
            current.start,

          end:
            date,

          maxElevation:
            Number(
              current.maxElevation.toFixed(1)
            ),

          maxElevationTime:
            current.maxElevationTime,

          startAzimuth:
            Number(
              current.startAzimuth.toFixed(0)
            ),

          maxElevationAzimuth:
            Number(
              current.maxElevationAzimuth.toFixed(0)
            ),

          endAzimuth:
            Number(
              azimuthDeg.toFixed(0)
            ),

          durationSeconds:
            Math.round(
              (
                date.getTime() -
                current.start.getTime()
              ) / 1000
            )
        });

      if (pass) {
        passes.push(pass);
      }

      current = null;

      if (
        passes.length >=
        maxPasses
      ) {
        break;
      }
    }

    previousElevation =
      elevationDeg;
  }

  return passes;
}

export async function getNextPassForEach({
  lat,
  lng,
  alt = 0,
  hours = 8,
  stepSeconds = 30,
  limit = 12
}) {
  const catalog =
    await getCatalog();

  const observerGd =
    toObserverGd(
      lat,
      lng,
      alt
    );

  const start =
    Date.now();

  const end =
    start +
    hours *
      3600 *
      1000;

  const stepMs =
    stepSeconds *
    1000;

  const upcoming = [];

  for (
    const entry of catalog
  ) {
    if (!entry.satrec) {
      continue;
    }

    const satrec =
      entry.satrec;

    let previousElevation =
      null;

    let current = null;

    for (
      let t = start;
      t <= end;
      t += stepMs
    ) {
      const date =
        new Date(t);

      const propagated =
        satellite.propagate(
          satrec,
          date
        );

      if (
        !propagated?.position
      ) {
        continue;
      }

      const gmst =
        satellite.gstime(
          date
        );

      const positionEcf =
        satellite.eciToEcf(
          propagated.position,
          gmst
        );

      const look =
        satellite.ecfToLookAngles(
          observerGd,
          positionEcf
        );

      const elevationDeg =
        look.elevation *
        RAD2DEG;

      const azimuthDeg =
        (
          look.azimuth *
            RAD2DEG +
          360
        ) % 360;

      /*
       * Satellite crosses the horizon upward.
       */
      if (
        previousElevation !== null &&
        previousElevation <= 0 &&
        elevationDeg > 0
      ) {
        current = {
          start: date,

          startAzimuth:
            azimuthDeg,

          maxElevation:
            elevationDeg,

          maxElevationAzimuth:
            azimuthDeg,

          maxElevationTime:
            date
        };
      }

      /*
       * Track the highest point of the pass.
       */
      if (
        current &&
        elevationDeg >
          current.maxElevation
      ) {
        current.maxElevation =
          elevationDeg;

        current.maxElevationAzimuth =
          azimuthDeg;

        current.maxElevationTime =
          date;
      }

      /*
       * Satellite crosses the horizon downward.
       */
      if (
        current &&
        previousElevation !== null &&
        previousElevation > 0 &&
        elevationDeg <= 0
      ) {
        const pass =
          serializePass({
            start:
              current.start,

            end:
              date,

            durationSeconds:
              Math.round(
                (
                  date.getTime() -
                  current.start.getTime()
                ) / 1000
              ),

            maxElevation:
              Number(
                current.maxElevation.toFixed(1)
              ),

            maxElevationTime:
              current.maxElevationTime,

            startAzimuth:
              Number(
                current.startAzimuth.toFixed(1)
              ),

            maxElevationAzimuth:
              Number(
                current.maxElevationAzimuth.toFixed(1)
              ),

            endAzimuth:
              Number(
                azimuthDeg.toFixed(1)
              )
          });

        if (pass) {
          upcoming.push({
            id:
              entry.catalogNumber,

            name:
              entry.name,

            category:
              entry.category,

            color:
              entry.colorKey,

            country:
              entry.country,

            mission:
              entry.mission,

            featured:
              entry.featured,

            ...pass
          });
        }

        current = null;

        break;
      }

      previousElevation =
        elevationDeg;
    }
  }

  upcoming.sort(
    (a, b) =>
      new Date(a.start) -
      new Date(b.start)
  );

  return upcoming.slice(
    0,
    limit
  );
}
