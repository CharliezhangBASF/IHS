import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import {
  initStore,
  getStoreMode,
  listConversations,
  getConversation,
  createConversation,
  saveConversation,
  deleteConversation,
  exportTrainingPairs,
} from "./store.js";

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

function authMiddleware(req, res, next) {
  if (!checkAccessKey(req)) {
    return res.status(401).json({ error: { message: "Invalid or missing access key" } });
  }
  next();
}

app.get("/api/health", (req, res) => {
  if (needsAccessKey() && !checkAccessKey(req)) {
    return res.status(401).json({ ok: false, authRequired: true });
  }
  res.json({ ok: true, authRequired: needsAccessKey(), store: getStoreMode() });
});

app.get("/api/auth-config", (_req, res) => {
  res.json({ required: needsAccessKey() });
});

app.get("/api/conversations", authMiddleware, async (req, res) => {
  const clientId = req.query.clientId;
  if (!clientId || typeof clientId !== "string") {
    return res.status(400).json({ error: { message: "clientId query parameter required" } });
  }
  try {
    const conversations = await listConversations(clientId);
    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

app.get("/api/conversations/:id", authMiddleware, async (req, res) => {
  const { clientId } = req.query;
  if (!clientId) {
    return res.status(400).json({ error: { message: "clientId query parameter required" } });
  }
  try {
    const conversation = await getConversation(req.params.id, clientId);
    if (!conversation) {
      return res.status(404).json({ error: { message: "Conversation not found" } });
    }
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

app.delete("/api/conversations/:id", authMiddleware, async (req, res) => {
  const { clientId } = req.query;
  if (!clientId) {
    return res.status(400).json({ error: { message: "clientId query parameter required" } });
  }
  try {
    const ok = await deleteConversation(req.params.id, clientId);
    if (!ok) return res.status(404).json({ error: { message: "Conversation not found" } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

app.get("/api/export/training", authMiddleware, async (_req, res) => {
  try {
    const pairs = await exportTrainingPairs();
    res.json({ count: pairs.length, pairs });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

app.post("/api/chat", authMiddleware, async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: "OPENROUTER_API_KEY is not configured on the server" },
    });
  }

  const { messages, system, clientId, conversationId } = req.body;
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: { message: "messages must be an array" } });
  }
  if (!clientId) {
    return res.status(400).json({ error: { message: "clientId is required" } });
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
    if (!response.ok || data.error) {
      return res.status(response.status).json(data);
    }

    const reply = data.choices?.[0]?.message?.content || "";
    const fullHistory = [...messages, { role: "assistant", content: reply }];

    let activeId = conversationId;
    let conversationMeta = null;

    if (activeId) {
      conversationMeta = await saveConversation(activeId, clientId, fullHistory);
      if (!conversationMeta) {
        conversationMeta = await createConversation(clientId, fullHistory);
        activeId = conversationMeta.id;
      }
    } else {
      conversationMeta = await createConversation(clientId, fullHistory);
      activeId = conversationMeta.id;
    }

    res.json({
      ...data,
      conversationId: activeId,
      conversationTitle: conversationMeta?.title,
    });
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

await initStore();

app.listen(PORT, () => {
  console.log(`IHS server listening on http://localhost:${PORT}${isProd ? " (production)" : ""}`);
});
