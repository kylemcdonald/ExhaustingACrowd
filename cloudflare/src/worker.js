import { check as checkBoring, getRegex, getRegexes } from "./boring.js";

const BUCKET_MS = 5000;
const MAX_NOTES_PER_FETCH = 250;
const MAX_RECENT_LIMIT = 1000;

const sites = ["london", "netherlands", "birmingham", "gwangju", "beijing", "saintbrieuc", "berlin"];
const currentSite = "berlin";

export default {
  async fetch(request, env) {
    try {
      if (env.PASSWORD && !isAuthorized(request, env.PASSWORD)) {
        return unauthorized();
      }

      const url = new URL(request.url);
      if (url.protocol === "http:") {
        url.protocol = "https:";
        return Response.redirect(url, 301);
      }

      const pathname = normalizePath(url.pathname);

      if (pathname.startsWith("/api/")) {
        return handleApi(request, env, pathname);
      }

      if (request.method !== "GET" && request.method !== "HEAD") {
        return notFound();
      }

      if (pathname === "/") {
        return Response.redirect(new URL(`/${currentSite}`, request.url), 302);
      }

      if (sites.includes(pathname.slice(1))) {
        return serveHtml(request, env, isMobile(request) ? "/mobile.html" : "/index.html");
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
};

async function handleApi(request, env, pathname) {
  if (!env.DB) {
    return new Response("D1 database binding is missing", { status: 500 });
  }

  if (pathname === "/api/notes" && request.method === "GET") {
    return getNotes(request, env.DB);
  }

  if (pathname === "/api/notes" && request.method === "POST") {
    return postNote(request, env.DB);
  }

  if (pathname === "/api/notes/count" && request.method === "GET") {
    return getNotesCount(request, env.DB);
  }

  if (pathname === "/api/notes/recent/hidden" && request.method === "GET") {
    return getRecentNotes(request, env.DB, true);
  }

  if (pathname === "/api/notes/recent/visible" && request.method === "GET") {
    return getRecentNotes(request, env.DB, false);
  }

  if (pathname === "/api/regex" && request.method === "GET") {
    return json({
      all: getRegex(),
      psql: null,
      parts: getRegexes()
    });
  }

  if (pathname === "/api/clean" && request.method === "GET") {
    return cleanNotes(request, env);
  }

  return notFound();
}

async function getNotes(request, db) {
  const url = new URL(request.url);
  const startTime = Math.round(Number(url.searchParams.get("timeframeStart")));
  const endTime = Math.round(Number(url.searchParams.get("timeframeEnd")));
  const site = parseInteger(url.searchParams.get("site"), 0);
  const ip = normalizeIp(url.searchParams.get("ip") || getClientIp(request));

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return new Response("Invalid timeframe", { status: 400 });
  }

  const startBucket = bucketFor(Math.min(startTime, endTime));
  const endBucket = bucketFor(Math.max(startTime, endTime));

  const result = await db.prepare(`
    SELECT DISTINCT n.id, n.time_begin, n.time_end, n.note, n.path_json
    FROM note_buckets b
    JOIN notes n ON n.id = b.note_id
    LEFT JOIN blacklist bl ON bl.ip = n.ip
    WHERE b.site = ?1
      AND b.bucket BETWEEN ?2 AND ?3
      AND n.site = ?1
      AND n.time_end >= ?4
      AND n.time_begin <= ?5
      AND (
        n.ip = ?6
        OR NOT (
          n.hidden IS 1
          OR (n.hidden IS NULL AND bl.ip IS NOT NULL)
        )
      )
    ORDER BY n.id
    LIMIT ?7
  `).bind(site, startBucket, endBucket, startTime, endTime, ip, MAX_NOTES_PER_FETCH).all();

  return json((result.results || []).map(noteFromRow));
}

async function postNote(request, db) {
  const body = await readJson(request);
  if (!body) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const paths = Array.isArray(body.path) ? body.path : [];
  let text = typeof body.text === "string" ? body.text : "";
  const site = body.site;

  if (paths.length < 2) {
    return new Response("At least 2 points in a path are required", { status: 500 });
  }

  if (!text) {
    return new Response("Text is missing", { status: 500 });
  }

  if (site === undefined) {
    return new Response("Site is missing", { status: 500 });
  }

  if (text.length > 140) {
    text = text.slice(0, 140);
  }

  const normalizedPath = normalizePathPoints(paths);
  if (normalizedPath.length < 2) {
    return new Response("Path is invalid", { status: 400 });
  }

  const ip = normalizeIp(getClientIp(request));
  const timeBegin = Math.round(normalizedPath[0][2]);
  const timeEnd = Math.round(normalizedPath[normalizedPath.length - 1][2]);
  const siteId = parseInteger(site, 0);

  const last = await db.prepare(`
    SELECT time_begin, time_end
    FROM notes
    WHERE ip = ?1
    ORDER BY id DESC
    LIMIT 1
  `).bind(ip).first();

  if (last && last.time_begin === timeBegin && last.time_end === timeEnd) {
    return new Response("Duplicate entry", { status: 500 });
  }

  const recent = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM notes
    WHERE ip = ?1
      AND timestamp > datetime('now', '-10 minutes')
  `).bind(ip).first();

  if (recent && recent.count > 15) {
    return new Response("Note add rate limit", { status: 500 });
  }

  const hidden = checkBoring(text) ? 1 : null;
  const insert = await db.prepare(`
    INSERT INTO notes (time_begin, time_end, note, ip, timestamp, path_json, hidden, site)
    VALUES (?1, ?2, ?3, ?4, datetime('now'), ?5, ?6, ?7)
  `).bind(
    timeBegin,
    timeEnd,
    text,
    ip,
    JSON.stringify(normalizedPath),
    hidden,
    siteId
  ).run();

  const noteId = insert.meta.last_row_id;
  await insertBuckets(db, siteId, noteId, timeBegin, timeEnd);

  return json({ id: noteId });
}

async function getNotesCount(request, db) {
  const url = new URL(request.url);
  const site = parseInteger(url.searchParams.get("site"), 0);
  const result = await db.prepare("SELECT COUNT(*) AS count FROM notes WHERE site = ?1").bind(site).first();
  return json({ count: String(result ? result.count : 0) });
}

async function getRecentNotes(request, db, hidden) {
  const url = new URL(request.url);
  const limit = Math.min(parseInteger(url.searchParams.get("limit"), 250), MAX_RECENT_LIMIT);
  const site = parseInteger(url.searchParams.get("site"), 0);
  const where = hidden ? "hidden = 1" : "hidden IS NULL";
  const result = await db.prepare(`
    SELECT note
    FROM notes
    WHERE ${where}
      AND site = ?1
    ORDER BY timestamp DESC
    LIMIT ?2
  `).bind(site, limit).all();

  return json((result.results || []).map((row) => row.note));
}

async function cleanNotes(request, env) {
  if (!env.ADMIN_TOKEN || request.headers.get("x-admin-token") !== env.ADMIN_TOKEN) {
    return new Response("Forbidden", { status: 403 });
  }

  const result = await env.DB.prepare(`
    SELECT id, note
    FROM notes
    WHERE hidden IS NULL
  `).all();

  const hiddenNotes = [];
  for (const row of result.results || []) {
    if (checkBoring(row.note)) {
      await env.DB.prepare("UPDATE notes SET hidden = 1 WHERE id = ?1").bind(row.id).run();
      hiddenNotes.push(row.note);
    }
  }

  return json(hiddenNotes);
}

async function insertBuckets(db, site, noteId, timeBegin, timeEnd) {
  const buckets = bucketsForRange(timeBegin, timeEnd);
  if (!buckets.length) {
    return;
  }

  await db.batch(
    buckets.map((bucket) => db.prepare(`
      INSERT OR IGNORE INTO note_buckets (site, bucket, note_id)
      VALUES (?1, ?2, ?3)
    `).bind(site, bucket, noteId))
  );
}

function noteFromRow(row) {
  return {
    id: row.id,
    time_begin: row.time_begin,
    time_end: row.time_end,
    note: row.note,
    path: parsePathJson(row.path_json)
  };
}

function parsePathJson(pathJson) {
  try {
    const parsed = JSON.parse(pathJson || "[]");
    return parsed.map((point) => {
      if (Array.isArray(point)) {
        return { x: point[0], y: point[1], time: point[2] };
      }

      return {
        x: point.x,
        y: point.y,
        time: point.time
      };
    });
  } catch (_error) {
    return [];
  }
}

function normalizePathPoints(points) {
  return points
    .map((point) => {
      const x = Number(point.x);
      const y = Number(point.y);
      const time = Math.round(Number(point.time));
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(time)) {
        return null;
      }
      return [x, y, time];
    })
    .filter(Boolean);
}

function bucketsForRange(timeBegin, timeEnd) {
  const start = bucketFor(Math.min(timeBegin, timeEnd));
  const end = bucketFor(Math.max(timeBegin, timeEnd));
  const buckets = [];
  for (let bucket = start; bucket <= end; bucket += 1) {
    buckets.push(bucket);
  }
  return buckets;
}

function bucketFor(time) {
  return Math.floor(time / BUCKET_MS);
}

async function serveHtml(request, env, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return env.ASSETS.fetch(new Request(url, request));
}

function isMobile(request) {
  const userAgent = request.headers.get("user-agent") || "";
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent);
}

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function getClientIp(request) {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return "0.0.0.0";
}

function normalizeIp(ip) {
  return String(ip || "")
    .trim()
    .replace(/\/32$/, "")
    .replace(/\/128$/, "");
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (_error) {
    return null;
  }
}

function json(value, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(value), {
    ...init,
    headers
  });
}

function isAuthorized(request, password) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("basic ")) {
    return false;
  }

  const decoded = atob(header.slice(6));
  const separator = decoded.indexOf(":");
  if (separator === -1) {
    return false;
  }

  return decoded.slice(0, separator) === password && decoded.slice(separator + 1) === password;
}

function unauthorized() {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": "Basic realm=Authorization Required"
    }
  });
}

function notFound() {
  return new Response("Not Found", { status: 404 });
}
