// functions/api.js
// ═══════════════════════════════════════════════════════════════════
//  The CAHS & Effect — Cloudflare Pages Function + Turso (libSQL)
//
//  Environment variables (set in Cloudflare dashboard as secrets):
//    TURSO_URL    — libsql://your-db-name.turso.io
//    TURSO_TOKEN  — your Turso auth token
//    CMS_SECRET   — protects write endpoints
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@libsql/client/web';

// ─── CORS ─────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function ok(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}
function err(msg, status = 400) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: CORS });
}

// ─── Auth ─────────────────────────────────────────────────────────────
function isAuthorised(request, env) {
  const secret = env.CMS_SECRET;
  if (!secret) return false;
  return (request.headers.get('Authorization') || '') === `Bearer ${secret}`;
}

// ─── DB client ────────────────────────────────────────────────────────
function getDb(env) {
  return createClient({ url: env.TURSO_URL, authToken: env.TURSO_TOKEN });
}

// ─── Schema bootstrap ─────────────────────────────────────────────────
async function ensureSchema(db) {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS articles (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL DEFAULT 'creative',
      status      TEXT NOT NULL DEFAULT 'draft',
      title       TEXT NOT NULL DEFAULT '',
      excerpt     TEXT DEFAULT '',
      body        TEXT DEFAULT '',
      author_id   TEXT DEFAULT '',
      issue_id    TEXT DEFAULT '',
      date        TEXT DEFAULT '',
      read_time   INTEGER DEFAULT 5,
      cover_image TEXT DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS writers (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL DEFAULT '',
      role       TEXT DEFAULT '',
      bio        TEXT DEFAULT '',
      avatar     TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS issues (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL DEFAULT '',
      date        TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    )`,
  ], 'read');
}

// ─── Row mappers ──────────────────────────────────────────────────────
// Turso returns { columns: [...], rows: [...] } — zip them into objects
function toObjects(result) {
  return result.rows.map(row => {
    const obj = {};
    result.columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
}

const mapArticle = r => ({
  id: r.id, type: r.type, status: r.status, title: r.title,
  excerpt: r.excerpt || '', body: r.body || '',
  author: r.author_id || '', issueId: r.issue_id || '',
  date: r.date || '', readTime: Number(r.read_time) || 5,
  coverImage: r.cover_image || ''
});
const mapWriter = r => ({ id: r.id, name: r.name, role: r.role||'', bio: r.bio||'', avatar: r.avatar||'' });
const mapIssue  = r => ({ id: r.id, title: r.title, date: r.date||'', description: r.description||'' });

// ─── Handlers ─────────────────────────────────────────────────────────
async function handleGet(db, resource, id) {
  if (resource === 'all') {
    const [articles, writers, issues] = await Promise.all([
      db.execute('SELECT * FROM articles ORDER BY date DESC, created_at DESC'),
      db.execute('SELECT * FROM writers  ORDER BY created_at ASC'),
      db.execute('SELECT * FROM issues   ORDER BY date DESC, created_at DESC'),
    ]);
    return ok({
      articles: toObjects(articles).map(mapArticle),
      writers:  toObjects(writers).map(mapWriter),
      issues:   toObjects(issues).map(mapIssue),
    });
  }
  if (resource === 'articles') {
    if (id) {
      const result = await db.execute({ sql: 'SELECT * FROM articles WHERE id = ?', args: [id] });
      const rows = toObjects(result);
      return rows.length ? ok(mapArticle(rows[0])) : err('Not found', 404);
    }
    const result = await db.execute('SELECT * FROM articles ORDER BY date DESC, created_at DESC');
    return ok(toObjects(result).map(mapArticle));
  }
  if (resource === 'writers') {
    const result = await db.execute('SELECT * FROM writers ORDER BY created_at ASC');
    return ok(toObjects(result).map(mapWriter));
  }
  if (resource === 'issues') {
    const result = await db.execute('SELECT * FROM issues ORDER BY date DESC, created_at DESC');
    return ok(toObjects(result).map(mapIssue));
  }
  return err('Unknown resource');
}

async function handlePost(db, resource, data) {
  const id = data.id || (resource[0] + Date.now());

  if (resource === 'articles') {
    await db.execute({
      sql: `INSERT INTO articles (id,type,status,title,excerpt,body,author_id,issue_id,date,read_time,cover_image)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET
              type=excluded.type, status=excluded.status, title=excluded.title,
              excerpt=excluded.excerpt, body=excluded.body, author_id=excluded.author_id,
              issue_id=excluded.issue_id, date=excluded.date, read_time=excluded.read_time,
              cover_image=excluded.cover_image, updated_at=datetime('now')`,
      args: [id, data.type||'creative', data.status||'draft', data.title,
             data.excerpt||'', data.body||'', data.author||'', data.issueId||'',
             data.date||'', data.readTime||5, data.coverImage||'']
    });
    const result = await db.execute({ sql: 'SELECT * FROM articles WHERE id=?', args: [id] });
    return ok(mapArticle(toObjects(result)[0]), 201);
  }
  if (resource === 'writers') {
    await db.execute({
      sql: `INSERT INTO writers (id,name,role,bio,avatar) VALUES (?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET name=excluded.name, role=excluded.role,
              bio=excluded.bio, avatar=excluded.avatar, updated_at=datetime('now')`,
      args: [id, data.name, data.role||'', data.bio||'', data.avatar||'']
    });
    const result = await db.execute({ sql: 'SELECT * FROM writers WHERE id=?', args: [id] });
    return ok(mapWriter(toObjects(result)[0]), 201);
  }
  if (resource === 'issues') {
    await db.execute({
      sql: `INSERT INTO issues (id,title,date,description) VALUES (?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET title=excluded.title, date=excluded.date,
              description=excluded.description, updated_at=datetime('now')`,
      args: [id, data.title, data.date||'', data.description||'']
    });
    const result = await db.execute({ sql: 'SELECT * FROM issues WHERE id=?', args: [id] });
    return ok(mapIssue(toObjects(result)[0]), 201);
  }
  return err('Unknown resource');
}

async function handlePut(db, resource, id, data) {
  if (!id) return err('id required');

  if (resource === 'articles') {
    await db.execute({
      sql: `UPDATE articles SET type=?,status=?,title=?,excerpt=?,body=?,author_id=?,
              issue_id=?,date=?,read_time=?,cover_image=?,updated_at=datetime('now')
            WHERE id=?`,
      args: [data.type, data.status, data.title, data.excerpt||'', data.body||'',
             data.author||'', data.issueId||'', data.date||'', data.readTime||5,
             data.coverImage||'', id]
    });
    const result = await db.execute({ sql: 'SELECT * FROM articles WHERE id=?', args: [id] });
    return ok(mapArticle(toObjects(result)[0]));
  }
  if (resource === 'writers') {
    await db.execute({
      sql: `UPDATE writers SET name=?,role=?,bio=?,avatar=?,updated_at=datetime('now') WHERE id=?`,
      args: [data.name, data.role||'', data.bio||'', data.avatar||'', id]
    });
    const result = await db.execute({ sql: 'SELECT * FROM writers WHERE id=?', args: [id] });
    return ok(mapWriter(toObjects(result)[0]));
  }
  if (resource === 'issues') {
    await db.execute({
      sql: `UPDATE issues SET title=?,date=?,description=?,updated_at=datetime('now') WHERE id=?`,
      args: [data.title, data.date||'', data.description||'', id]
    });
    const result = await db.execute({ sql: 'SELECT * FROM issues WHERE id=?', args: [id] });
    return ok(mapIssue(toObjects(result)[0]));
  }
  return err('Unknown resource');
}

async function handleDelete(db, resource, id) {
  if (!id) return err('id required');

  if (resource === 'articles') {
    await db.execute({ sql: 'DELETE FROM articles WHERE id=?', args: [id] });
    return ok({ deleted: id });
  }
  if (resource === 'writers') {
    await db.execute({ sql: 'DELETE FROM writers WHERE id=?', args: [id] });
    return ok({ deleted: id });
  }
  if (resource === 'issues') {
    await db.batch([
      { sql: 'DELETE FROM issues WHERE id=?', args: [id] },
      { sql: "UPDATE articles SET issue_id='' WHERE issue_id=?", args: [id] },
    ]);
    return ok({ deleted: id });
  }
  return err('Unknown resource');
}

// ─── Main Cloudflare Pages Function export ────────────────────────────
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (!env.TURSO_URL || !env.TURSO_TOKEN) {
    return err(
      'TURSO_URL and TURSO_TOKEN are not set. ' +
      'Add them in Cloudflare → Pages → Settings → Environment Variables.',
      500
    );
  }

  const db = getDb(env);

  try {
    await ensureSchema(db);
  } catch (e) {
    return err('Schema error: ' + e.message, 500);
  }

  const url      = new URL(request.url);
  const resource = url.searchParams.get('resource') || 'all';
  const id       = url.searchParams.get('id') || null;
  const method   = request.method;

  try {
    if (method === 'GET') return await handleGet(db, resource, id);

    if (!isAuthorised(request, env)) return err('Unauthorised', 401);

    const body = await request.json().catch(() => ({}));

    if (method === 'POST')   return await handlePost(db,   body.resource || resource, body.data || body);
    if (method === 'PUT')    return await handlePut(db,    body.resource || resource, body.id   || id, body.data || body);
    if (method === 'DELETE') return await handleDelete(db, body.resource || resource, body.id   || id);

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('API error:', e);
    return err('Internal error: ' + e.message, 500);
  }
}
