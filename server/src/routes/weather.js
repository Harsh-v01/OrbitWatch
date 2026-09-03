import { Router } from "express";
import { getSpaceWeather } from "../services/spaceWeatherService.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const data = await getSpaceWeather();
    res.json(data);
  } catch (error) {
    res.status(502).json({ error: "Could not load space weather.", detail: error.message });
  }
});

export default router;
