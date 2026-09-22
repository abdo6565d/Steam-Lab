import express from "express";
import path from "path";
import { generateSchematicLocal, generateContextLocal, generateActivitiesLocal } from "./src/lib/selfProcessingEngine";

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", mode: "self-processing", timestamp: new Date().toISOString() });
});

// Endpoint: Generate Circuit Schematic, Arduino Code, and Breadboard Guide (Pure Self-Processing)
app.post("/api/generate-schematic", (req, res) => {
  try {
    const { 
      selectedPopularIds = [], 
      intent = "", 
      resistors = [] 
    } = req.body;

    if (!selectedPopularIds.length || !intent.trim()) {
      return res.status(400).json({ error: "Missing selected components or intent." });
    }

    const data = generateSchematicLocal(selectedPopularIds, intent, resistors);
    return res.json({ success: true, data, engine: "self-processing" });
  } catch (error: any) {
    console.error("Error in /api/generate-schematic:", error);
    return res.status(500).json({ 
      error: error?.message || "Failed to process schematic.",
      details: "SELF_PROCESSING_ERROR"
    });
  }
});

// Endpoint: Explain Arduino Code (Pure Self-Processing)
app.post("/api/explain-code", (req, res) => {
  try {
    const { code = "", intent = "" } = req.body;

    if (!code.trim()) {
      return res.status(400).json({ error: "Missing code to explain." });
    }

    const explanation = `### Self-Processing Analysis\n- **Objective**: Configured to achieve: "${intent}".\n- **Setup Phase**: Configures pin directions (INPUT/OUTPUT) and initializes communication buses.\n- **Execution Loop**: Continuously samples connected hardware sensors, tests operational thresholds, and commands actuators without external latency.`;

    return res.json({ success: true, explanation, engine: "self-processing" });
  } catch (error: any) {
    console.error("Error in /api/explain-code:", error);
    return res.status(500).json({ 
      error: error?.message || "Failed to explain code." 
    });
  }
});

// Endpoint: Generate Context Engine breakdown (Pure Self-Processing)
app.post("/api/generate-context", (req, res) => {
  try {
    const { topic = "" } = req.body;

    if (!topic.trim()) {
      return res.status(400).json({ error: "Missing topic." });
    }

    const data = generateContextLocal(topic);
    return res.json({ success: true, data, engine: "self-processing" });
  } catch (error: any) {
    console.error("Error in /api/generate-context:", error);
    return res.status(500).json({ 
      error: error?.message || "Failed to generate context." 
    });
  }
});

// Endpoint: Generate Level-Up Activities (Pure Self-Processing)
app.post("/api/generate-activities", (_req, res) => {
  try {
    const activities = generateActivitiesLocal();
    return res.json({ success: true, activities, engine: "self-processing" });
  } catch (error: any) {
    console.error("Error in /api/generate-activities:", error);
    return res.status(500).json({ 
      error: error?.message || "Failed to generate activities." 
    });
  }
});

// Vite Middleware for Development / Static serving for Production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} [Self-Processing Engine]`);
  });
}

setupViteOrStatic();
