// functions/api.js
// ═══════════════════════════════════════════════════════════════════
//  The CAHS & Effect — Cloudflare Pages Function + Turso HTTP API
//
//  Uses Turso's native HTTP API via fetch — no npm packages needed.
//
//  Environment variables (Cloudflare → Pages → Settings → Environment Variables):
//    TURSO_URL    — e.g. https://your-db-name.turso.io  (use https://, not libsql://)
//    TURSO_TOKEN  — your Turso auth token
//    CMS_SECRET   — protects write endpoints
// ═══════════════════════════════════════════════════════════════════

// ─── CORS ─────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};
const ok  = (d, s=200) => new Response(JSON.stringify(d), { status: s, headers: CORS });
const err = (m, s=400) => new Response(JSON.stringify({ error: m }), { status: s, headers: CORS });

// ─── Auth ─────────────────────────────────────────────────────────────
const isAuthorised = (req, env) =>
  !!env.CMS_SECRET && req.headers.get('Authorization') === `Bearer ${env.CMS_SECRET}`;

// ─── Turso HTTP API ───────────────────────────────────────────────────
// Turso exposes a Hrana-over-HTTP endpoint at /v2/pipeline
async function turso(env, statements) {
  // statements: array of { q: "SQL", params: [...positional values] }
  const requests = statements.map(s => ({
    type: 'execute',
    stmt: {
      sql: s.q,
      args: (s.params || []).map(v =>
        v === null || v === undefined ? { type: 'null' }
        : typeof v === 'number'       ? { type: 'integer', value: String(v) }
        :                               { type: 'text',    value: String(v) }
      )
    }
  }));

  // Normalise URL: strip trailing slash, ensure https://
  const base = env.TURSO_URL.replace(/\/$/, '').replace(/^libsql:\/\//, 'https://');
  const res = await fetch(`${base}/v2/pipeline`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${env.TURSO_TOKEN}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Turso HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();

  // Check each result for errors
  const results = json.results || [];
  for (const r of results) {
    if (r.type === 'error') throw new Error(r.error?.message || 'Turso query error');
  }

  return results;
}

// Helper: run a single statement and return rows as objects
async function query(env, sql, params = []) {
  const results = await turso(env, [{ q: sql, params }]);
  const result  = results[0]?.response?.result;
  if (!result) return [];
  const cols = result.cols.map(c => c.name);
  return result.rows.map(row =>
    Object.fromEntries(cols.map((c, i) => [c, row[i]?.value ?? null]))
  );
}

// Helper: run multiple statements in one pipeline (for transactions/batches)
async function batch(env, statements) {
  return turso(env, statements);
}

// ─── Schema bootstrap ─────────────────────────────────────────────────
async function ensureSchema(env) {
  await batch(env, [
    { q: `CREATE TABLE IF NOT EXISTS articles (
            id TEXT PRIMARY KEY, type TEXT NOT NULL DEFAULT 'creative',
            status TEXT NOT NULL DEFAULT 'draft', title TEXT NOT NULL DEFAULT '',
            excerpt TEXT DEFAULT '', body TEXT DEFAULT '',
            author_id TEXT DEFAULT '', issue_id TEXT DEFAULT '',
            date TEXT DEFAULT '', read_time INTEGER DEFAULT 5,
            cover_image TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')))` },
    { q: `CREATE TABLE IF NOT EXISTS writers (
            id TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT '',
            role TEXT DEFAULT '', bio TEXT DEFAULT '', avatar TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')))` },
    { q: `CREATE TABLE IF NOT EXISTS issues (
            id TEXT PRIMARY KEY, title TEXT NOT NULL DEFAULT '',
            date TEXT DEFAULT '', description TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')))` },
  ]);
}

// ─── Row mappers ──────────────────────────────────────────────────────
const mapArticle = r => ({
  id: r.id, type: r.type, status: r.status, title: r.title,
  excerpt: r.excerpt||'', body: r.body||'',
  author: r.author_id||'', issueId: r.issue_id||'',
  date: r.date||'', readTime: Number(r.read_time)||5, coverImage: r.cover_image||''
});
const mapWriter = r => ({ id:r.id, name:r.name, role:r.role||'', bio:r.bio||'', avatar:r.avatar||'' });
const mapIssue  = r => ({ id:r.id, title:r.title, date:r.date||'', description:r.description||'' });

// ─── Handlers ─────────────────────────────────────────────────────────
async function handleGet(env, resource, id) {
  if (resource === 'all') {
    const [articles, writers, issues] = await Promise.all([
      query(env, 'SELECT * FROM articles ORDER BY date DESC, created_at DESC'),
      query(env, 'SELECT * FROM writers  ORDER BY created_at ASC'),
      query(env, 'SELECT * FROM issues   ORDER BY date DESC,  created_at DESC'),
    ]);
    return ok({ articles: articles.map(mapArticle), writers: writers.map(mapWriter), issues: issues.map(mapIssue) });
  }
  if (resource === 'articles') {
    if (id) {
      const rows = await query(env, 'SELECT * FROM articles WHERE id=?', [id]);
      return rows.length ? ok(mapArticle(rows[0])) : err('Not found', 404);
    }
    const rows = await query(env, 'SELECT * FROM articles ORDER BY date DESC, created_at DESC');
    return ok(rows.map(mapArticle));
  }
  if (resource === 'writers') {
    const rows = await query(env, 'SELECT * FROM writers ORDER BY created_at ASC');
    return ok(rows.map(mapWriter));
  }
  if (resource === 'issues') {
    const rows = await query(env, 'SELECT * FROM issues ORDER BY date DESC, created_at DESC');
    return ok(rows.map(mapIssue));
  }
  return err('Unknown resource');
}

async function handlePost(env, resource, data) {
  const id = data.id || (resource[0] + Date.now());
  if (resource === 'articles') {
    await query(env,
      `INSERT INTO articles (id,type,status,title,excerpt,body,author_id,issue_id,date,read_time,cover_image)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET type=excluded.type,status=excluded.status,title=excluded.title,
         excerpt=excluded.excerpt,body=excluded.body,author_id=excluded.author_id,
         issue_id=excluded.issue_id,date=excluded.date,read_time=excluded.read_time,
         cover_image=excluded.cover_image,updated_at=datetime('now')`,
      [id, data.type||'creative', data.status||'draft', data.title,
       data.excerpt||'', data.body||'', data.author||'', data.issueId||'',
       data.date||'', data.readTime||5, data.coverImage||'']
    );
    const rows = await query(env, 'SELECT * FROM articles WHERE id=?', [id]);
    return ok(mapArticle(rows[0]), 201);
  }
  if (resource === 'writers') {
    await query(env,
      `INSERT INTO writers (id,name,role,bio,avatar) VALUES (?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name,role=excluded.role,
         bio=excluded.bio,avatar=excluded.avatar,updated_at=datetime('now')`,
      [id, data.name, data.role||'', data.bio||'', data.avatar||'']
    );
    const rows = await query(env, 'SELECT * FROM writers WHERE id=?', [id]);
    return ok(mapWriter(rows[0]), 201);
  }
  if (resource === 'issues') {
    await query(env,
      `INSERT INTO issues (id,title,date,description) VALUES (?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET title=excluded.title,date=excluded.date,
         description=excluded.description,updated_at=datetime('now')`,
      [id, data.title, data.date||'', data.description||'']
    );
    const rows = await query(env, 'SELECT * FROM issues WHERE id=?', [id]);
    return ok(mapIssue(rows[0]), 201);
  }
  return err('Unknown resource');
}

async function handlePut(env, resource, id, data) {
  if (!id) return err('id required');
  if (resource === 'articles') {
    await query(env,
      `UPDATE articles SET type=?,status=?,title=?,excerpt=?,body=?,author_id=?,
         issue_id=?,date=?,read_time=?,cover_image=?,updated_at=datetime('now') WHERE id=?`,
      [data.type, data.status, data.title, data.excerpt||'', data.body||'',
       data.author||'', data.issueId||'', data.date||'', data.readTime||5, data.coverImage||'', id]
    );
    const rows = await query(env, 'SELECT * FROM articles WHERE id=?', [id]);
    return ok(mapArticle(rows[0]));
  }
  if (resource === 'writers') {
    await query(env,
      `UPDATE writers SET name=?,role=?,bio=?,avatar=?,updated_at=datetime('now') WHERE id=?`,
      [data.name, data.role||'', data.bio||'', data.avatar||'', id]
    );
    const rows = await query(env, 'SELECT * FROM writers WHERE id=?', [id]);
    return ok(mapWriter(rows[0]));
  }
  if (resource === 'issues') {
    await query(env,
      `UPDATE issues SET title=?,date=?,description=?,updated_at=datetime('now') WHERE id=?`,
      [data.title, data.date||'', data.description||'', id]
    );
    const rows = await query(env, 'SELECT * FROM issues WHERE id=?', [id]);
    return ok(mapIssue(rows[0]));
  }
  return err('Unknown resource');
}

async function handleDelete(env, resource, id) {
  if (!id) return err('id required');
  if (resource === 'articles') {
    await query(env, 'DELETE FROM articles WHERE id=?', [id]);
    return ok({ deleted: id });
  }
  if (resource === 'writers') {
    await query(env, 'DELETE FROM writers WHERE id=?', [id]);
    return ok({ deleted: id });
  }
  if (resource === 'issues') {
    await batch(env, [
      { q: 'DELETE FROM issues WHERE id=?',               params: [id] },
      { q: "UPDATE articles SET issue_id='' WHERE issue_id=?", params: [id] },
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
    return err('TURSO_URL and TURSO_TOKEN are not set in Cloudflare environment variables.', 500);
  }

  try {
    await ensureSchema(env);
  } catch (e) {
    return err('Schema error: ' + e.message, 500);
  }

  const url      = new URL(request.url);
  const resource = url.searchParams.get('resource') || 'all';
  const id       = url.searchParams.get('id') || null;
  const method   = request.method;

  try {
    if (method === 'GET') return await handleGet(env, resource, id);

    if (!isAuthorised(request, env)) return err('Unauthorised', 401);

    const body = await request.json().catch(() => ({}));
    if (method === 'POST')   return await handlePost(env,   body.resource||resource, body.data||body);
    if (method === 'PUT')    return await handlePut(env,    body.resource||resource, body.id||id, body.data||body);
    if (method === 'DELETE') return await handleDelete(env, body.resource||resource, body.id||id);

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('API error:', e);
    return err('Internal error: ' + e.message, 500);
  }
}
