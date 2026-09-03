import express from "express";
import cors from "cors";
import satellitesRouter from "./routes/satellites.js";
import weatherRouter from "./routes/weather.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/satellites", satellitesRouter);
app.use("/api/space-weather", weatherRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

export default app;
