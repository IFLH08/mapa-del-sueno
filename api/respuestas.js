import { put, get, list, del } from "@vercel/blob";
import crypto from "node:crypto";

const ALLOWED_ORIGINS = new Set([
  "https://mapa-del-sueno.vercel.app",
  "https://iflh08.github.io"
]);

const FACTORS = {
  1: "Duermo pocas horas",
  2: "Tardo en dormirme",
  3: "Pantallas antes de dormir",
  4: "Desvelo por tarea",
  5: "Cafeína y azúcar",
  6: "Mente acelerada",
  7: "Cuarto con luz o ruido",
  8: "Me despierto en la noche",
  9: "Horario irregular",
  10: "No despierto descansado"
};

const VALID_TOOLS = new Set(["respiracion", "journaling", "meditacion"]);
const VALID_MARKS = new Set(["none", "watch", "risk"]);
const ID_REGEX = /^[a-zA-Z0-9_-]{8,80}$/;

function setCors(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.has(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Key");
}

function getMoonLevel(score) {
  if (score >= 85) return { key: "llena", name: "Luna llena" };
  if (score >= 60) return { key: "creciente", name: "Luna creciente" };
  if (score >= 35) return { key: "media", name: "Media luna" };
  return { key: "menguante", name: "Luna menguante" };
}

function cleanString(val, maxLen) {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, maxLen);
}

function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function isAuthorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const headerKey = (req.headers["x-admin-key"] || "").toString().trim();
  const provided = bearer || headerKey;
  return safeCompare(provided, expected);
}

async function readPrivateJson(pathname) {
  try {
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return await new Response(result.stream).json();
  } catch {
    return null;
  }
}

async function handlePost(req, res) {
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: "JSON inválido." });
    }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ ok: false, error: "Cuerpo de solicitud vacío." });
  }

  // Validate all 10 answers
  const rawAnswers = body.answers;
  if (!rawAnswers || typeof rawAnswers !== "object") {
    return res.status(400).json({ ok: false, error: "Faltan las respuestas de la Etapa 1." });
  }

  const answers = {};
  let totalScore = 0;
  for (let i = 1; i <= 10; i++) {
    const val = Number(rawAnswers[i] ?? rawAnswers[String(i)]);
    if (val !== 0 && val !== 5 && val !== 10) {
      return res.status(400).json({
        ok: false,
        error: `Responde las 10 preguntas de la Etapa 1 antes de guardar (falta la pregunta ${i}).`
      });
    }
    answers[i] = val;
    totalScore += val;
  }

  // Radar overrides & derived risk/watch factors
  const radarOverrides = {};
  if (body.radarOverrides && typeof body.radarOverrides === "object") {
    for (let i = 1; i <= 10; i++) {
      const m = body.radarOverrides[i] ?? body.radarOverrides[String(i)];
      if (VALID_MARKS.has(m)) radarOverrides[i] = m;
    }
  }

  const riskFactors = [];
  const watchFactors = [];
  for (let i = 1; i <= 10; i++) {
    const mark = radarOverrides[i] || (answers[i] === 0 ? "risk" : answers[i] === 5 ? "watch" : "none");
    if (mark === "risk") riskFactors.push(FACTORS[i]);
    if (mark === "watch") watchFactors.push(FACTORS[i]);
  }

  // Sanitize meta, challenge, tree, tools
  const meta = {
    nombre: cleanString(body.meta?.nombre, 120) || "Anónimo",
    grupo: cleanString(body.meta?.grupo, 60),
    fecha: cleanString(body.meta?.fecha, 20)
  };

  const nightsNum = Number(body.challenge?.nights);
  const challenge = {
    factor: cleanString(body.challenge?.factor, 150),
    action: cleanString(body.challenge?.action, 500),
    nights: Number.isFinite(nightsNum) ? Math.max(1, Math.min(30, Math.round(nightsNum))) : 5
  };

  const recTool = VALID_TOOLS.has(body.tree?.recommendedTool) ? body.tree.recommendedTool : null;
  const tree = {
    branch: cleanString(body.tree?.branch, 30) || null,
    choice: cleanString(body.tree?.choice, 40) || null,
    recommendedTool: recTool
  };

  const tools = {};
  for (const key of VALID_TOOLS) {
    const t = body.tools?.[key] || {};
    const nights = Array.isArray(t.nights)
      ? [Boolean(t.nights[0]), Boolean(t.nights[1]), Boolean(t.nights[2])]
      : [false, false, false];
    const ratingNum = Number(t.rating);
    const rating = Number.isFinite(ratingNum) ? Math.max(0, Math.min(5, Math.round(ratingNum))) : 0;
    tools[key] = { nights, rating };
  }

  const moonLevel = getMoonLevel(totalScore);
  const nowIso = new Date().toISOString();

  // Allow updating own record if id + editToken match an existing blob
  let id = null;
  let editToken = null;
  let savedAt = nowIso;
  let isUpdate = false;

  const requestedId = cleanString(body.submissionId, 80);
  const requestedToken = cleanString(body.editToken, 120);
  if (requestedId && requestedToken && ID_REGEX.test(requestedId)) {
    const existing = await readPrivateJson(`respuestas/${requestedId}.json`);
    if (existing && existing.editToken && safeCompare(existing.editToken, requestedToken)) {
      id = requestedId;
      editToken = existing.editToken;
      savedAt = existing.savedAt || nowIso;
      isUpdate = true;
    }
  }

  if (!id) {
    const stamp = Date.now().toString(36);
    const rand = crypto.randomBytes(6).toString("hex");
    id = `${stamp}_${rand}`;
    editToken = crypto.randomBytes(18).toString("hex");
  }

  const record = {
    id,
    editToken,
    savedAt,
    updatedAt: nowIso,
    meta,
    answers,
    totalScore,
    moonLevel,
    radarOverrides,
    riskFactors,
    watchFactors,
    challenge,
    tree,
    tools
  };

  await put(`respuestas/${id}.json`, JSON.stringify(record), {
    access: "private",
    contentType: "application/json; charset=utf-8",
    addRandomSuffix: false,
    allowOverwrite: true
  });

  return res.status(isUpdate ? 200 : 201).json({
    ok: true,
    id,
    editToken,
    savedAt,
    updatedAt: nowIso,
    updated: isUpdate,
    totalScore,
    moonLevel
  });
}

async function handleGet(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "Clave de administrador incorrecta." });
  }

  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix: "respuestas/", limit: 1000, cursor });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const jsonBlobs = blobs.filter((b) => b.pathname.endsWith(".json"));
  const items = [];

  // Read in batches of 15 to avoid connection spikes
  const BATCH_SIZE = 15;
  for (let i = 0; i < jsonBlobs.length; i += BATCH_SIZE) {
    const batch = jsonBlobs.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((b) => readPrivateJson(b.pathname)));
    for (const data of results) {
      if (!data) continue;
      const { editToken: _secret, ...safeItem } = data;
      items.push(safeItem);
    }
  }

  items.sort((a, b) => new Date(b.updatedAt || b.savedAt || 0) - new Date(a.updatedAt || a.savedAt || 0));

  // Aggregate summary stats
  const total = items.length;
  const avgScore = total
    ? Math.round((items.reduce((acc, it) => acc + (Number(it.totalScore) || 0), 0) / total) * 10) / 10
    : 0;

  const moonCounts = { llena: 0, creciente: 0, media: 0, menguante: 0 };
  const riskCounts = {};
  const groupSet = new Set();

  for (const it of items) {
    const mk = it.moonLevel?.key;
    if (mk && mk in moonCounts) moonCounts[mk]++;
    if (it.meta?.grupo) groupSet.add(it.meta.grupo);
    if (Array.isArray(it.riskFactors)) {
      for (const f of it.riskFactors) {
        riskCounts[f] = (riskCounts[f] || 0) + 1;
      }
    }
  }

  const topRiskFactors = Object.entries(riskCounts)
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count);

  return res.status(200).json({
    ok: true,
    summary: {
      total,
      avgScore,
      moonCounts,
      topRiskFactors,
      groups: Array.from(groupSet).sort((a, b) => a.localeCompare(b, "es"))
    },
    items
  });
}

async function handleDelete(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "Clave de administrador incorrecta." });
  }

  const id = cleanString(req.query?.id, 80);
  if (!id || !ID_REGEX.test(id)) {
    return res.status(400).json({ ok: false, error: "ID de respuesta inválido." });
  }

  await del(`respuestas/${id}.json`);
  return res.status(200).json({ ok: true, deleted: id });
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      ok: false,
      error: "Almacenamiento Vercel Blob no configurado en este entorno."
    });
  }

  try {
    if (req.method === "POST") return await handlePost(req, res);
    if (req.method === "GET") return await handleGet(req, res);
    if (req.method === "DELETE") return await handleDelete(req, res);
    return res.status(405).json({ ok: false, error: "Método no permitido." });
  } catch (err) {
    console.error("Error en /api/respuestas:", err);
    return res.status(500).json({ ok: false, error: "Error interno del servidor." });
  }
}
