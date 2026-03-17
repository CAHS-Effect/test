// netlify/functions/api.js
// ═══════════════════════════════════════════════════════════════════
//  The Inkwell — Serverless API (Netlify Function + Neon Postgres)
//
//  Routes (all under /.netlify/functions/api):
//    GET    ?resource=articles|writers|issues   → fetch all
//    GET    ?resource=articles&id=xxx           → fetch one
//    POST   { resource, data }                  → create
//    PUT    { resource, id, data }              → update
//    DELETE { resource, id }                    → delete
//
//  Auth: POST/PUT/DELETE require header  Authorization: Bearer <CMS_SECRET>
//  Set CMS_SECRET in Netlify → Site Settings → Environment Variables.
//  DATABASE_URL is also set there (copied from Neon dashboard).
// ═══════════════════════════════════════════════════════════════════

import { neon } from '@neondatabase/serverless';

// ─── DB connection (lazy, reused across warm invocations) ─────────────
let sql;
function getDb() {
  if (!sql) sql = neon(process.env.DATABASE_URL);
  return sql;
}

// ─── Auth ─────────────────────────────────────────────────────────────
function isAuthorised(req) {
  const secret = process.env.CMS_SECRET;
  if (!secret) return false; // must be set
  const header = req.headers['authorization'] || req.headers['Authorization'] || '';
  return header === `Bearer ${secret}`;
}

// ─── CORS preflight ───────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

function ok(body, status = 200) {
  return { statusCode: status, headers: corsHeaders(), body: JSON.stringify(body) };
}
function err(msg, status = 400) {
  return { statusCode: status, headers: corsHeaders(), body: JSON.stringify({ error: msg }) };
}

// ─── Schema bootstrap (runs on first cold start if tables missing) ────
async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS articles (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL CHECK (type IN ('creative','news')),
      status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
      title       TEXT NOT NULL,
      excerpt     TEXT DEFAULT '',
      body        TEXT DEFAULT '',
      author_id   TEXT DEFAULT '',
      issue_id    TEXT DEFAULT '',
      date        TEXT DEFAULT '',
      read_time   INTEGER DEFAULT 5,
      cover_image TEXT DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS writers (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      role      TEXT DEFAULT '',
      bio       TEXT DEFAULT '',
      avatar    TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS issues (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      date        TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

// ─── Row mappers (DB snake_case → JS camelCase) ───────────────────────
function mapArticle(row) {
  return {
    id:          row.id,
    type:        row.type,
    status:      row.status,
    title:       row.title,
    excerpt:     row.excerpt     || '',
    body:        row.body        || '',
    author:      row.author_id   || '',
    issueId:     row.issue_id    || '',
    date:        row.date        || '',
    readTime:    row.read_time   || 5,
    coverImage:  row.cover_image || ''
  };
}
function mapWriter(row) {
  return { id: row.id, name: row.name, role: row.role || '', bio: row.bio || '', avatar: row.avatar || '' };
}
function mapIssue(row) {
  return { id: row.id, title: row.title, date: row.date || '', description: row.description || '' };
}

// ─── Handlers ─────────────────────────────────────────────────────────
async function handleGet(sql, resource, id) {
  if (resource === 'articles') {
    if (id) {
      const rows = await sql`SELECT * FROM articles WHERE id = ${id}`;
      if (!rows.length) return err('Article not found', 404);
      return ok(mapArticle(rows[0]));
    }
    const rows = await sql`SELECT * FROM articles ORDER BY date DESC, created_at DESC`;
    return ok(rows.map(mapArticle));
  }
  if (resource === 'writers') {
    const rows = await sql`SELECT * FROM writers ORDER BY created_at ASC`;
    return ok(rows.map(mapWriter));
  }
  if (resource === 'issues') {
    const rows = await sql`SELECT * FROM issues ORDER BY date DESC, created_at DESC`;
    return ok(rows.map(mapIssue));
  }
  // Return everything at once (used by public pages — one request)
  if (resource === 'all') {
    const [articles, writers, issues] = await Promise.all([
      sql`SELECT * FROM articles ORDER BY date DESC, created_at DESC`,
      sql`SELECT * FROM writers ORDER BY created_at ASC`,
      sql`SELECT * FROM issues ORDER BY date DESC, created_at DESC`
    ]);
    return ok({ articles: articles.map(mapArticle), writers: writers.map(mapWriter), issues: issues.map(mapIssue) });
  }
  return err('Unknown resource');
}

async function handlePost(sql, resource, data) {
  const id = data.id || (resource[0] + Date.now());
  if (resource === 'articles') {
    await sql`
      INSERT INTO articles (id, type, status, title, excerpt, body, author_id, issue_id, date, read_time, cover_image)
      VALUES (${id}, ${data.type||'creative'}, ${data.status||'draft'}, ${data.title}, ${data.excerpt||''},
              ${data.body||''}, ${data.author||''}, ${data.issueId||''}, ${data.date||''},
              ${data.readTime||5}, ${data.coverImage||''})
      ON CONFLICT (id) DO UPDATE SET
        type=EXCLUDED.type, status=EXCLUDED.status, title=EXCLUDED.title,
        excerpt=EXCLUDED.excerpt, body=EXCLUDED.body, author_id=EXCLUDED.author_id,
        issue_id=EXCLUDED.issue_id, date=EXCLUDED.date, read_time=EXCLUDED.read_time,
        cover_image=EXCLUDED.cover_image, updated_at=NOW()
    `;
    const rows = await sql`SELECT * FROM articles WHERE id = ${id}`;
    return ok(mapArticle(rows[0]), 201);
  }
  if (resource === 'writers') {
    await sql`
      INSERT INTO writers (id, name, role, bio, avatar)
      VALUES (${id}, ${data.name}, ${data.role||''}, ${data.bio||''}, ${data.avatar||''})
      ON CONFLICT (id) DO UPDATE SET
        name=EXCLUDED.name, role=EXCLUDED.role, bio=EXCLUDED.bio,
        avatar=EXCLUDED.avatar, updated_at=NOW()
    `;
    const rows = await sql`SELECT * FROM writers WHERE id = ${id}`;
    return ok(mapWriter(rows[0]), 201);
  }
  if (resource === 'issues') {
    await sql`
      INSERT INTO issues (id, title, date, description)
      VALUES (${id}, ${data.title}, ${data.date||''}, ${data.description||''})
      ON CONFLICT (id) DO UPDATE SET
        title=EXCLUDED.title, date=EXCLUDED.date,
        description=EXCLUDED.description, updated_at=NOW()
    `;
    const rows = await sql`SELECT * FROM issues WHERE id = ${id}`;
    return ok(mapIssue(rows[0]), 201);
  }
  return err('Unknown resource');
}

async function handlePut(sql, resource, id, data) {
  if (!id) return err('id required');
  if (resource === 'articles') {
    await sql`
      UPDATE articles SET
        type=${data.type}, status=${data.status}, title=${data.title},
        excerpt=${data.excerpt||''}, body=${data.body||''}, author_id=${data.author||''},
        issue_id=${data.issueId||''}, date=${data.date||''}, read_time=${data.readTime||5},
        cover_image=${data.coverImage||''}, updated_at=NOW()
      WHERE id = ${id}
    `;
    const rows = await sql`SELECT * FROM articles WHERE id = ${id}`;
    return ok(mapArticle(rows[0]));
  }
  if (resource === 'writers') {
    await sql`
      UPDATE writers SET name=${data.name}, role=${data.role||''}, bio=${data.bio||''}, avatar=${data.avatar||''}, updated_at=NOW()
      WHERE id = ${id}
    `;
    const rows = await sql`SELECT * FROM writers WHERE id = ${id}`;
    return ok(mapWriter(rows[0]));
  }
  if (resource === 'issues') {
    await sql`
      UPDATE issues SET title=${data.title}, date=${data.date||''}, description=${data.description||''}, updated_at=NOW()
      WHERE id = ${id}
    `;
    const rows = await sql`SELECT * FROM issues WHERE id = ${id}`;
    return ok(mapIssue(rows[0]));
  }
  return err('Unknown resource');
}

async function handleDelete(sql, resource, id) {
  if (!id) return err('id required');
  if (resource === 'articles') {
    await sql`DELETE FROM articles WHERE id = ${id}`;
    return ok({ deleted: id });
  }
  if (resource === 'writers') {
    await sql`DELETE FROM writers WHERE id = ${id}`;
    return ok({ deleted: id });
  }
  if (resource === 'issues') {
    await sql`DELETE FROM issues WHERE id = ${id}`;
    // Unassign articles from this issue
    await sql`UPDATE articles SET issue_id='' WHERE issue_id = ${id}`;
    return ok({ deleted: id });
  }
  return err('Unknown resource');
}

// ─── Main handler ─────────────────────────────────────────────────────
export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  if (!process.env.DATABASE_URL) {
    return err('DATABASE_URL environment variable not set. Add it in Netlify → Site Settings → Environment Variables.', 500);
  }

  const db = getDb();

  // Ensure tables exist (fast no-op if already created)
  try {
    await ensureSchema(db);
  } catch (e) {
    return err('Schema error: ' + e.message, 500);
  }

  const method   = event.httpMethod;
  const params   = event.queryStringParameters || {};
  const resource = params.resource || 'all';
  const id       = params.id || null;

  try {
    // ── GET (public — no auth required) ──────────────────────────────
    if (method === 'GET') {
      return await handleGet(db, resource, id);
    }

    // ── Mutations require auth ────────────────────────────────────────
    if (!isAuthorised(event)) {
      return err('Unauthorised', 401);
    }

    const body = event.body ? JSON.parse(event.body) : {};

    if (method === 'POST')   return await handlePost(db,   body.resource || resource, body.data || body);
    if (method === 'PUT')    return await handlePut(db,    body.resource || resource, body.id || id, body.data || body);
    if (method === 'DELETE') return await handleDelete(db, body.resource || resource, body.id || id);

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('API error:', e);
    return err('Internal error: ' + e.message, 500);
  }
};
