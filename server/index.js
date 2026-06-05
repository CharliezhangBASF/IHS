import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "12mb" }));

function needsAccessKey() {
  return Boolean(process.env.ACCESS_KEY);
}

function checkAccessKey(req) {
  if (!needsAccessKey()) return true;
  const key = req.headers["x-access-key"];
  return key === process.env.ACCESS_KEY;
}

app.get("/api/health", (req, res) => {
  if (needsAccessKey() && !checkAccessKey(req)) {
    return res.status(401).json({ ok: false, authRequired: true });
  }
  res.json({ ok: true, authRequired: needsAccessKey() });
});

app.get("/api/auth-config", (_req, res) => {
  res.json({ required: needsAccessKey() });
});

app.post("/api/chat", async (req, res) => {
  if (!checkAccessKey(req)) {
    return res.status(401).json({ error: { message: "Invalid or missing access key" } });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: "OPENROUTER_API_KEY is not configured on the server" },
    });
  }

  const { messages, system } = req.body;
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: { message: "messages must be an array" } });
  }

  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";
  const allMessages = system
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  try {
    const origin = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": origin,
        "X-Title": "IHS LV Production Analytics",
      },
      body: JSON.stringify({ model, max_tokens: 2000, messages: allMessages }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: { message: err.message || "Upstream request failed" } });
  }
});

if (isProd) {
  const dist = path.join(__dirname, "..", "dist");
  app.use(express.static(dist));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`IHS server listening on http://localhost:${PORT}${isProd ? " (production)" : ""}`);
});
