// ═══════════════════════════════════════════════════════════════════
//  THE INKWELL — Data Layer (Netlify Functions + Neon Postgres)
// ═══════════════════════════════════════════════════════════════════
//
//  All reads  → GET  /.netlify/functions/api?resource=all   (public, no auth)
//  All writes → POST/PUT/DELETE /.netlify/functions/api     (requires CMS_SECRET)
//
//  CMS_SECRET is set in Netlify → Site Settings → Environment Variables.
//  It is stored in the browser's localStorage after first login — never
//  hardcoded here.
// ═══════════════════════════════════════════════════════════════════

const API      = '/api';
const CACHE_KEY  = 'cahseffect_cache';
const SECRET_KEY = 'cahseffect_cms_secret';

// ─── Local cache ──────────────────────────────────────────────────────
const Cache = {
  get()    { try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; } },
  set(d)   { try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch {} },
  clear()  { localStorage.removeItem(CACHE_KEY); }
};

// ─── CMS secret (stored in localStorage after first CMS login) ────────
function getCmsSecret() { return localStorage.getItem(SECRET_KEY) || ''; }
function setCmsSecret(s) { localStorage.setItem(SECRET_KEY, s); }

// ─── API helpers ──────────────────────────────────────────────────────
async function apiFetch(method, params, body) {
  const url = new URL(API, window.location.origin);
  if (params) Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));

  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  const secret = getCmsSecret();
  if (secret) opts.headers['Authorization'] = `Bearer ${secret}`;
  if (body)   opts.body = JSON.stringify(body);

  const res = await fetch(url.toString(), opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `API ${res.status}`);
  return json;
}

// ─── Default data (shown only if DB unreachable — e.g. local dev) ─────
const DEFAULT_DATA = {
  articles: [], writers: [], issues: []
};

// ─── Store — public API used by all pages ─────────────────────────────
const Store = {
  // Synchronous read from cache (instant, used for optimistic CMS updates)
  get() {
    return Cache.get() || DEFAULT_DATA;
  },

  // Used by all public pages on load — fetches everything in one request
  async fetchPublic() {
    try {
      const data = await apiFetch('GET', { resource: 'all' });
      Cache.set(data);
      return data;
    } catch (e) {
      console.warn('DB fetch failed, using cache:', e.message);
      return Cache.get() || DEFAULT_DATA;
    }
  },

  // ── CMS write operations ────────────────────────────────────────────

  async createArticle(data) {
    const result = await apiFetch('POST', null, { resource: 'articles', data });
    await this._refreshCache();
    return result;
  },

  async updateArticle(id, data) {
    const result = await apiFetch('PUT', null, { resource: 'articles', id, data });
    await this._refreshCache();
    return result;
  },

  async deleteArticle(id) {
    const result = await apiFetch('DELETE', null, { resource: 'articles', id });
    await this._refreshCache();
    return result;
  },

  async createWriter(data) {
    const result = await apiFetch('POST', null, { resource: 'writers', data });
    await this._refreshCache();
    return result;
  },

  async updateWriter(id, data) {
    const result = await apiFetch('PUT', null, { resource: 'writers', id, data });
    await this._refreshCache();
    return result;
  },

  async deleteWriter(id) {
    const result = await apiFetch('DELETE', null, { resource: 'writers', id });
    await this._refreshCache();
    return result;
  },

  async createIssue(data) {
    const result = await apiFetch('POST', null, { resource: 'issues', data });
    await this._refreshCache();
    return result;
  },

  async updateIssue(id, data) {
    const result = await apiFetch('PUT', null, { resource: 'issues', id, data });
    await this._refreshCache();
    return result;
  },

  async deleteIssue(id) {
    const result = await apiFetch('DELETE', null, { resource: 'issues', id });
    await this._refreshCache();
    return result;
  },

  // Refresh the local cache after any mutation
  async _refreshCache() {
    try {
      const data = await apiFetch('GET', { resource: 'all' });
      Cache.set(data);
      return data;
    } catch { return null; }
  },

  // Test the connection + auth with the CMS secret
  async testConnection() {
    // Public read test
    const data = await apiFetch('GET', { resource: 'all' });
    return data;
  },

  init() {} // legacy no-op
};

// ─── Utilities ────────────────────────────────────────────────────────
function formatDate(s) {
  if (!s) return '';
  return new Date(s+'T00:00:00').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
}
function getParam(k) { return new URLSearchParams(window.location.search).get(k); }
function truncate(s,max=140) { if(!s||s.length<=max)return s||''; return s.slice(0,max).trim()+'…'; }
function getWriterName(id,data) { const w=data.writers.find(x=>x.id===id); return w?w.name:'Unknown'; }
function getWriterInitials(n) { if(!n)return'?'; return n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(); }

function showToast(msg, type) {
  let t = document.getElementById('global-toast');
  if (!t) { t=document.createElement('div'); t.id='global-toast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.style.borderLeftColor = type==='error'?'#e55': type==='success'?'#6bba6b':'var(--accent)';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 3200);
}

function setupNav() {
  const navbar=document.getElementById('navbar');
  if(!navbar)return;
  window.addEventListener('scroll',()=>navbar.classList.toggle('scrolled',scrollY>20));
  const hb=document.getElementById('hamburger'),mn=document.getElementById('mobile-nav');
  if(hb&&mn){
    hb.addEventListener('click',()=>mn.classList.add('open'));
    document.getElementById('mobile-nav-close')?.addEventListener('click',()=>mn.classList.remove('open'));
    mn.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mn.classList.remove('open')));
  }
  const path=window.location.pathname;
  document.querySelectorAll('.nav-links a,.mobile-nav a').forEach(a=>{
    const href=a.getAttribute('href')||'';
    if(path.endsWith(href)||(href!=='index.html'&&path.includes(href.replace('.html',''))))a.classList.add('active');
  });
}

function setupReveal() {
  const els=document.querySelectorAll('.reveal');
  if(!els.length)return;
  const ob=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');ob.unobserve(e.target);}});
  },{threshold:0.12});
  els.forEach(el=>ob.observe(el));
}

function showPageLoader(msg) {
  let el=document.getElementById('page-loader');
  if(!el){
    el=document.createElement('div');el.id='page-loader';
    el.style.cssText='position:fixed;inset:0;z-index:2000;background:var(--warm-white);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;transition:opacity 0.4s;';
    el.innerHTML=`<div style="font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:900;">The <span style="color:var(--accent)">Ink</span>well</div><div id="page-loader-msg" style="font-size:0.8rem;color:var(--mid);letter-spacing:1px;"></div><div style="width:40px;height:2px;background:var(--border);overflow:hidden;margin-top:4px;"><div style="height:100%;background:var(--accent);animation:loaderSlide 1s ease-in-out infinite;"></div></div><style>@keyframes loaderSlide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}</style>`;
    document.body.appendChild(el);
  }
  document.getElementById('page-loader-msg').textContent=msg||'Loading…';
  el.style.opacity='1';el.style.pointerEvents='all';
}

function hidePageLoader() {
  const el=document.getElementById('page-loader');
  if(!el)return;
  el.style.opacity='0';el.style.pointerEvents='none';
  setTimeout(()=>el.remove(),400);
}

function buildArticleCard(article,data) {
  const authorName=getWriterName(article.author,data);
  const imgHTML=article.coverImage
    ?`<img src="${article.coverImage}" alt="${article.title}" loading="lazy">`
    :`<div class="article-card-img-placeholder"><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="10" width="36" height="28" rx="2" stroke="currentColor" stroke-width="2"/><path d="M6 30l10-8 8 6 6-5 12 10" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="20" r="3" stroke="currentColor" stroke-width="2"/></svg></div>`;
  return `<div class="article-card reveal" onclick="location.href='article.html?id=${article.id}'"><div class="article-card-img">${imgHTML}</div><div class="article-card-meta">${formatDate(article.date)}</div><h3>${article.title}</h3><p>${truncate(article.excerpt,120)}</p><div class="article-card-footer"><span class="article-card-author">By ${authorName}</span><a href="article.html?id=${article.id}" class="read-more">Read <span class="arrow">→</span></a></div></div>`;
}
