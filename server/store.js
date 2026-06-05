import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(__dirname, "..", "data", "conversations.json");

let pool = null;
let mode = "json";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
`;

export function newId() {
  return crypto.randomUUID();
}

function titleFromMessages(messages) {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New chat";
  const t = first.content.trim().replace(/\s+/g, " ");
  return t.length > 72 ? `${t.slice(0, 72)}…` : t;
}

function ensureJsonFile() {
  const dir = path.dirname(JSON_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(JSON_PATH)) {
    fs.writeFileSync(JSON_PATH, JSON.stringify({ conversations: {} }, null, 2));
  }
}

function readJson() {
  ensureJsonFile();
  return JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
}

function writeJson(data) {
  ensureJsonFile();
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
}

export async function initStore() {
  if (process.env.DATABASE_URL) {
    const pg = await import("pg");
    pool = new pg.default.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    });
    await pool.query(SCHEMA);
    mode = "postgres";
    console.log("Chat store: PostgreSQL");
    return mode;
  }

  ensureJsonFile();
  mode = "json";
  console.log("Chat store: JSON file (set DATABASE_URL on Render for persistent history)");
  return mode;
}

export function getStoreMode() {
  return mode;
}

export async function listConversations(clientId) {
  if (mode === "postgres") {
    const { rows } = await pool.query(
      `SELECT id, title, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM conversations WHERE client_id = $1
       ORDER BY updated_at DESC LIMIT 50`,
      [clientId]
    );
    return rows;
  }

  const db = readJson();
  return Object.values(db.conversations)
    .filter((c) => c.clientId === clientId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 50)
    .map(({ id, title, createdAt, updatedAt }) => ({ id, title, createdAt, updatedAt }));
}

export async function getConversation(conversationId, clientId) {
  if (mode === "postgres") {
    const { rows: convRows } = await pool.query(
      `SELECT id, title, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM conversations WHERE id = $1 AND client_id = $2`,
      [conversationId, clientId]
    );
    if (!convRows.length) return null;
    const { rows: msgRows } = await pool.query(
      `SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY id ASC`,
      [conversationId]
    );
    return { ...convRows[0], messages: msgRows };
  }

  const db = readJson();
  const conv = db.conversations[conversationId];
  if (!conv || conv.clientId !== clientId) return null;
  return {
    id: conv.id,
    title: conv.title,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    messages: conv.messages.map(({ role, content }) => ({ role, content })),
  };
}

export async function createConversation(clientId, messages) {
  const id = newId();
  const now = new Date().toISOString();
  const title = titleFromMessages(messages);

  if (mode === "postgres") {
    await pool.query(
      `INSERT INTO conversations (id, client_id, title, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4)`,
      [id, clientId, title, now]
    );
    await replaceMessages(id, messages);
    return { id, title, createdAt: now, updatedAt: now };
  }

  const db = readJson();
  db.conversations[id] = {
    id,
    clientId,
    title,
    createdAt: now,
    updatedAt: now,
    messages: messages.map((m) => ({ role: m.role, content: m.content, createdAt: now })),
  };
  writeJson(db);
  return { id, title, createdAt: now, updatedAt: now };
}

async function replaceMessages(conversationId, messages) {
  if (mode === "postgres") {
    await pool.query(`DELETE FROM messages WHERE conversation_id = $1`, [conversationId]);
    for (const m of messages) {
      await pool.query(
        `INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)`,
        [conversationId, m.role, m.content]
      );
    }
    await pool.query(`UPDATE conversations SET updated_at = NOW(), title = $2 WHERE id = $1`, [
      conversationId,
      titleFromMessages(messages),
    ]);
    return;
  }

  const db = readJson();
  const conv = db.conversations[conversationId];
  if (!conv) return;
  const now = new Date().toISOString();
  conv.messages = messages.map((m) => ({ role: m.role, content: m.content, createdAt: now }));
  conv.updatedAt = now;
  conv.title = titleFromMessages(messages);
  writeJson(db);
}

export async function saveConversation(conversationId, clientId, messages) {
  const existing = await getConversation(conversationId, clientId);
  if (!existing) return null;
  await replaceMessages(conversationId, messages);
  return { id: conversationId, title: titleFromMessages(messages) };
}

export async function deleteConversation(conversationId, clientId) {
  if (mode === "postgres") {
    const { rowCount } = await pool.query(
      `DELETE FROM conversations WHERE id = $1 AND client_id = $2`,
      [conversationId, clientId]
    );
    return rowCount > 0;
  }

  const db = readJson();
  const conv = db.conversations[conversationId];
  if (!conv || conv.clientId !== clientId) return false;
  delete db.conversations[conversationId];
  writeJson(db);
  return true;
}

export async function exportTrainingPairs() {
  if (mode === "postgres") {
    const { rows } = await pool.query(
      `SELECT c.id AS "conversationId", c.title,
              m.role, m.content, m.created_at AS "createdAt"
       FROM conversations c
       JOIN messages m ON m.conversation_id = c.id
       ORDER BY c.id, m.id`
    );
    return pairsFromRows(rows);
  }

  const db = readJson();
  const rows = [];
  for (const conv of Object.values(db.conversations)) {
    for (const m of conv.messages) {
      rows.push({
        conversationId: conv.id,
        title: conv.title,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      });
    }
  }
  return pairsFromRows(rows);
}

function pairsFromRows(rows) {
  const byConv = new Map();
  for (const row of rows) {
    if (!byConv.has(row.conversationId)) byConv.set(row.conversationId, []);
    byConv.get(row.conversationId).push(row);
  }

  const pairs = [];
  for (const [conversationId, msgs] of byConv) {
    for (let i = 0; i < msgs.length - 1; i++) {
      if (msgs[i].role === "user" && msgs[i + 1].role === "assistant") {
        pairs.push({
          conversationId,
          title: msgs[0].title,
          question: msgs[i].content,
          answer: msgs[i + 1].content,
          createdAt: msgs[i + 1].createdAt,
        });
      }
    }
  }
  return pairs;
}
