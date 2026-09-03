import app from "./app.js";
import { initializeOrbitalCache } from "./services/tleCache.js";

const PORT = process.env.PORT || 8787;

await initializeOrbitalCache();

app.listen(PORT, () => {
  console.log(`OrbitWatch API listening on http://localhost:${PORT}`);
});
