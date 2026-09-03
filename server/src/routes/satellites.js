import { Router } from "express";
import { getVisibleSatellites, getSatelliteState, getPasses, getNextPassForEach } from "../services/orbitService.js";
import { cacheAgeMs } from "../services/tleCache.js";

const router = Router();

function parseObserver(req, res) {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const alt = Number(req.query.alt ?? 0);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400).json({ error: "Provide valid lat (-90..90) and lng (-180..180) query params." });
    return null;
  }
  return { lat, lng, alt: Number.isFinite(alt) ? alt : 0 };
}

router.get("/above", async (req, res) => {
  const observer = parseObserver(req, res);
  if (!observer) return;

  try {
    const satellites = await getVisibleSatellites(observer);
    res.json({
      satellites,
      observer,
      tleAgeMs: cacheAgeMs(),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(502).json({ error: "Could not load live orbital data.", detail: error.message });
  }
});

router.get("/passes/next", async (req, res) => {
  const observer = parseObserver(req, res);
  if (!observer) return;

  const hours = Math.min(Number(req.query.hours) || 8, 24);
  const limit = Math.min(Number(req.query.limit) || 12, 30);

  try {
    const passes = await getNextPassForEach({ ...observer, hours, limit });
    res.json({ passes, hours });
  } catch (error) {
    res.status(502).json({ error: "Could not compute upcoming passes.", detail: error.message });
  }
});

router.get("/:id", async (req, res) => {
  const observer = parseObserver(req, res);
  if (!observer) return;

  try {
    const state = await getSatelliteState({ catalogNumber: req.params.id, ...observer });
    if (!state) return res.status(404).json({ error: `No object found for catalog number ${req.params.id}` });
    res.json(state);
  } catch (error) {
    res.status(502).json({ error: "Could not load live orbital data.", detail: error.message });
  }
});

router.get("/:id/passes", async (req, res) => {
  const observer = parseObserver(req, res);
  if (!observer) return;

  const hours = Math.min(Number(req.query.hours) || 48, 120);

  try {
    const passes = await getPasses({ catalogNumber: req.params.id, ...observer, hours });
    res.json({ catalogNumber: Number(req.params.id), hours, passes });
  } catch (error) {
    res.status(502).json({ error: "Could not compute passes.", detail: error.message });
  }
});

export default router;
