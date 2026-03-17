// ═══════════════════════════════════════════════════════
//  THE GCE — Data Layer (GitHub-backed JSON database)
// ═══════════════════════════════════════════════════════
//
//  How it works:
//  • All data lives in `data/db.json` in your GitHub repo.
//  • Public pages fetch it via raw.githubusercontent.com (no auth).
//  • The CMS reads/writes via GitHub Contents API using a stored PAT.
//  • localStorage is used as a local write-cache for instant CMS feel.
//
//  PAT scope needed: `repo` (or `public_repo` for public repos)
// ═══════════════════════════════════════════════════════

const GH_CONFIG_KEY = 'gce_gh_config';
const GH_CACHE_KEY  = 'gce_gh_cache';
const GH_SHA_KEY    = 'gce_gh_sha';

function getGHConfig() {
  try { return JSON.parse(localStorage.getItem(GH_CONFIG_KEY)) || {}; } catch { return {}; }
}
function saveGHConfig(cfg) { localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(cfg)); }
function ghIsConfigured() {
  const c = getGHConfig(); return !!(c.owner && c.repo && c.token);
}

function rawDbUrl() {
  const c = getGHConfig(), b = c.branch || 'main';
  return `https://raw.githubusercontent.com/${c.owner}/${c.repo}/${b}/data/db.json`;
}
function apiDbUrl() {
  const c = getGHConfig();
  return `https://api.github.com/repos/${c.owner}/${c.repo}/contents/data/db.json`;
}

// ─── Default seed data ────────────────────────────────────────────────
const DEFAULT_DATA = {
  articles: [
    {
      id:'a1',type:'creative',status:'published',
      title:'The Last Light of the Harbour',
      excerpt:'A meditative essay on endings, memory, and the particular sadness of ports at dusk.',
      body:'<p>There is a particular quality of light that exists only at the end of things. I discovered this truth standing at the edge of the harbour, watching the last cargo ship heave itself out toward the horizon, its rusted flanks catching the dying gold of a March sun.</p><p>I had come to the harbour for no particular reason — or rather, for the reason that all writers eventually arrive at: I needed to feel something real. The city behind me had grown loud with opinions and urgent with noise. The water, at least, remained honest.</p><blockquote>The sea does not care about your narrative arc. It simply continues, which is perhaps the most radical thing anything can do.</blockquote><p>A dockworker in an orange vest walked the length of the pier, checking moorings with the methodical patience of someone who has made peace with repetition. I envied him. Not his labour, but his certainty — the knowledge that the rope either held or it did not, and that you would know which by morning.</p><p>The last light touched the water and went out. The dockworker finished his rounds and lit a cigarette, looking out at exactly nothing. I walked back through the city feeling, if not lighter, then at least honestly heavy.</p>',
      author:'w1',date:'2025-03-08',readTime:7,coverImage:'',issueId:''
    },
    {
      id:'a2',type:'creative',status:'published',
      title:'Inheritance: A Portrait in Three Kitchens',
      excerpt:'What we inherit from the women who cooked for us, and what we fail to carry forward.',
      body:'<p>My grandmother\'s kitchen smelled of rendered fat and old newspapers. She kept her recipes in her head, which is to say she kept her recipes nowhere. When she died, we lost the lamb stew, the plum cake, and something she called "the sour pickle."</p><p>My mother\'s kitchen smells of coffee and sunscreen. She cooks from the internet now, reading instructions from her phone propped against the fruit bowl, and though the food is good — genuinely good — there is a specific texture of confidence missing.</p><blockquote>We are the first generation to lose the recipes and know we have lost them.</blockquote><p>My own kitchen smells of whatever I burned last Tuesday. I am thirty-four years old and I still approach pastry with the terror of someone defusing something. I have five different olive oils and no idea when to use which.</p>',
      author:'w2',date:'2025-02-20',readTime:5,coverImage:'',issueId:''
    },
    {
      id:'a3',type:'news',status:'published',
      title:'City Council Approves Waterfront Redevelopment Plan After Lengthy Debate',
      excerpt:'The 4-3 vote clears the way for a $240 million project that opponents say will price out longtime residents.',
      body:'<p>The city council voted narrowly Tuesday evening to approve a sweeping waterfront redevelopment plan, ending months of contentious debate over a project that supporters say will revitalise an underused industrial corridor while critics argue it will accelerate displacement in surrounding neighbourhoods.</p><p>The vote was four to three, with council member Dana Park casting the deciding vote after more than two hours of public comment that stretched well past midnight.</p><p>"This is a difficult decision and I do not make it lightly," Park said before casting her vote. "But I believe the community benefits package negotiated over the past six months represents meaningful protections for current residents."</p>',
      author:'w3',date:'2025-03-10',readTime:4,coverImage:'',issueId:'i1'
    },
    {
      id:'a4',type:'news',status:'published',
      title:'Regional Transit Authority Announces Service Cuts Amid Budget Shortfall',
      excerpt:'Fourteen bus routes face elimination or significant reduction starting in July as the authority grapples with a $38 million deficit.',
      body:'<p>The Regional Transit Authority announced a sweeping package of service reductions on Thursday, citing a projected $38 million budget shortfall and declining federal operating support.</p><p>The proposed cuts would eliminate seven bus routes entirely and reduce service frequency on seven others. An estimated 12,000 daily riders use the affected routes.</p><p>"We have exhausted our ability to absorb these costs through internal efficiencies," said transit director Marlowe Chen. "The state of our budget requires that we make hard choices."</p>',
      author:'w1',date:'2025-03-10',readTime:5,coverImage:'',issueId:'i1'
    },
    {
      id:'a6',type:'creative',status:'published',
      title:'Notes Toward an Understanding of Tuesday',
      excerpt:'A lyric essay about the texture of ordinary time and why the middle of the week feels like a country no one has named.',
      body:'<p>Tuesday is the most honest day of the week. Monday still carries the bruised optimism of Sunday evening; Wednesday has achieved the modest milestone of the midpoint; Thursday is already tilting toward the weekend. But Tuesday is simply itself.</p><blockquote>The middle of the week is where ordinary life actually happens, which is perhaps why writers rarely set their climaxes there.</blockquote><p>I am trying to learn to live more Tuesdays. To stop performing the arc and simply continue. To find the work that gets done in the middle of things, without ceremony, because that is mostly what a life is.</p>',
      author:'w3',date:'2025-01-30',readTime:4,coverImage:'',issueId:''
    }
  ],
  issues:[
    {id:'i1',title:'Issue No. 12',date:'2025-03-10',description:'Spring Edition — City, Transit & the Politics of Space'},
    {id:'i2',title:'Issue No. 11',date:'2025-02-15',description:'February Edition — Science, Climate & the Future of Food'}
  ],
  writers:[
    {id:'w1',name:'Eleanor Voss',role:'Senior Correspondent',bio:'Eleanor covers urban policy and civic life with a focus on the tension between development and community. She was previously a staff writer at The Municipal Review and holds an MA in Urban Studies from NYU.',avatar:''},
    {id:'w2',name:'James Okafor',role:'Science & Culture Editor',bio:'James writes at the intersection of science, culture, and the everyday. His essays have appeared in Granta, The Atlantic, and Best American Essays. He is the author of "The Careful Animals," a collection of narrative nonfiction.',avatar:''},
    {id:'w3',name:'Simone Lacroix',role:'Contributing Writer',bio:'Simone is a poet and essayist whose work explores time, memory, and domestic life. Her debut essay collection was shortlisted for the Fitzcarraldo Prize.',avatar:''}
  ]
};

// ─── Cache helpers ────────────────────────────────────────────────────
const Cache = {
  get()    { try { return JSON.parse(localStorage.getItem(GH_CACHE_KEY)); } catch { return null; } },
  set(d)   { localStorage.setItem(GH_CACHE_KEY, JSON.stringify(d)); },
  clear()  { localStorage.removeItem(GH_CACHE_KEY); localStorage.removeItem(GH_SHA_KEY); },
  getSHA() { return localStorage.getItem(GH_SHA_KEY) || null; },
  setSHA(s){ localStorage.setItem(GH_SHA_KEY, s); }
};

// ─── GitHub API ───────────────────────────────────────────────────────
function ghHeaders() {
  const c = getGHConfig();
  return {
    'Authorization': `Bearer ${c.token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

async function ghGet() {
  const res = await fetch(apiDbUrl(), { headers: ghHeaders() });
  if (!res.ok) throw new Error(`GitHub error ${res.status}: ${res.statusText}`);
  const json = await res.json();
  const data = JSON.parse(atob(json.content.replace(/\n/g,'')));
  Cache.setSHA(json.sha);
  Cache.set(data);
  return data;
}

async function ghPut(data, msg) {
  const sha = Cache.getSHA();
  if (!sha) throw new Error('No file SHA — fetch data first.');
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
  const c = getGHConfig();
  const res = await fetch(apiDbUrl(), {
    method:'PUT', headers:{ ...ghHeaders(),'Content-Type':'application/json' },
    body: JSON.stringify({ message: msg || 'Update GCE database', content, sha, branch: c.branch||'main' })
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message||`GitHub PUT ${res.status}`); }
  const json = await res.json();
  Cache.setSHA(json.content.sha);
  Cache.set(data);
  return data;
}

async function ghCreate(data) {
  const c = getGHConfig();
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
  const res = await fetch(apiDbUrl(), {
    method:'PUT', headers:{ ...ghHeaders(),'Content-Type':'application/json' },
    body: JSON.stringify({ message:'Initialize GCE database', content, branch: c.branch||'main' })
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message||`GitHub create ${res.status}`); }
  const json = await res.json();
  Cache.setSHA(json.content.sha);
  Cache.set(data);
  return data;
}

// ─── Store (the public API used by all pages) ─────────────────────────
const Store = {
  get() { return Cache.get() || JSON.parse(JSON.stringify(DEFAULT_DATA)); },

  async fetchFromGitHub() {
    if (!ghIsConfigured()) throw new Error('GitHub not configured');
    return await ghGet();
  },

  async fetchPublic() {
    if (!ghIsConfigured()) {
      return Cache.get() || JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    const c = getGHConfig();
    const branch = c.branch || 'main';

    // Strategy 1: GitHub Contents API — has correct CORS headers, no token needed for public repos
    try {
      const apiUrl = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/data/db.json?ref=${branch}&t=${Date.now()}`;
      const headers = { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
      // Include token if available (increases rate limit from 60 to 5000 req/hr)
      if (c.token) headers['Authorization'] = `Bearer ${c.token}`;
      const res = await fetch(apiUrl, { headers });
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const json = await res.json();
      const data = JSON.parse(atob(json.content.replace(/\n/g, '')));
      Cache.setSHA(json.sha);
      Cache.set(data);
      return data;
    } catch (apiErr) {
      console.warn('GitHub API fetch failed, trying raw CDN:', apiErr.message);
    }

    // Strategy 2: raw.githubusercontent.com (works on GitHub Pages, may fail locally)
    try {
      const rawUrl = `https://raw.githubusercontent.com/${c.owner}/${c.repo}/${branch}/data/db.json?t=${Date.now()}`;
      const res = await fetch(rawUrl);
      if (!res.ok) throw new Error(`raw CDN ${res.status}`);
      const data = await res.json();
      Cache.set(data);
      return data;
    } catch (rawErr) {
      console.warn('Raw CDN fetch failed:', rawErr.message);
    }

    // Strategy 3: local cache (stale but better than nothing)
    const cached = Cache.get();
    if (cached) {
      console.info('Serving from local cache');
      return cached;
    }

    // Nothing worked — return empty default so page still renders
    console.error('Could not load data from GitHub or cache. Is the repo public and db.json initialised?');
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  },

  async save(data, msg) {
    if (!ghIsConfigured()) throw new Error('GitHub not configured');
    Cache.set(data);
    return await ghPut(data, msg);
  },

  async initialize(data) {
    if (!ghIsConfigured()) throw new Error('GitHub not configured');
    return await ghCreate(data || JSON.parse(JSON.stringify(DEFAULT_DATA)));
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

function showToast(msg,type) {
  let t=document.getElementById('global-toast');
  if(!t){t=document.createElement('div');t.id='global-toast';t.className='toast';document.body.appendChild(t);}
  t.textContent=msg;
  t.style.borderLeftColor=type==='error'?'#e55':type==='success'?'#6bba6b':'var(--accent)';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3200);
}

function setupNav() {
  const navbar=document.getElementById('navbar');
  if(!navbar)return;
  window.addEventListener('scroll',()=>navbar.classList.toggle('scrolled',scrollY>20));
  const hb=document.getElementById('hamburger'), mn=document.getElementById('mobile-nav');
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
    el.innerHTML=`<div style="font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:900;">The Gorgon + The CAHS & Effect</div><div id="page-loader-msg" style="font-size:0.8rem;color:var(--mid);letter-spacing:1px;"></div><div style="width:40px;height:2px;background:var(--border);overflow:hidden;margin-top:4px;"><div style="height:100%;background:var(--accent);animation:loaderSlide 1s ease-in-out infinite;"></div></div><style>@keyframes loaderSlide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}</style>`;
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
