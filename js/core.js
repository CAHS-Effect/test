const STORE_KEY = 'gce_data';

const DEFAULT_DATA = {
  articles: [
    {
      id: 'a1', type: 'creative', status: 'published',
      title: 'The Last Light of the Harbour',
      excerpt: 'A meditative essay on endings, memory, and the particular sadness of ports at dusk.',
      body: `<p>There is a particular quality of light that exists only at the end of things. I discovered this truth standing at the edge of the harbour, watching the last cargo ship heave itself out toward the horizon, its rusted flanks catching the dying gold of a March sun.</p>
<p>I had come to the harbour for no particular reason — or rather, for the reason that all writers eventually arrive at: I needed to feel something real. The city behind me had grown loud with opinions and urgent with noise. The water, at least, remained honest.</p>
<blockquote>The sea does not care about your narrative arc. It simply continues, which is perhaps the most radical thing anything can do.</blockquote>
<p>A dockworker in an orange vest walked the length of the pier, checking moorings with the methodical patience of someone who has made peace with repetition. I envied him. Not his labour, but his certainty — the knowledge that the rope either held or it didn't, and that you would know which by morning.</p>
<p>Writing is less forgiving. A sentence can feel secure for years before the rot becomes visible. You think you have said something true, and then one cold afternoon you read it again and find only the shell of a thought, the architecture of meaning without the meaning itself.</p>
<p>The last light touched the water and went out. The dockworker finished his rounds and lit a cigarette, looking out at exactly nothing. I walked back through the city feeling, if not lighter, then at least honestly heavy.</p>`,
      author: 'w1', date: '2025-03-08', readTime: 7,
      coverImage: '',
      issueId: ''
    },
    {
      id: 'a2', type: 'creative', status: 'published',
      title: 'Inheritance: A Portrait in Three Kitchens',
      excerpt: 'What we inherit from the women who cooked for us, and what we fail to carry forward.',
      body: `<p>My grandmother's kitchen smelled of rendered fat and old newspapers. She kept her recipes in her head, which is to say she kept her recipes nowhere. When she died, we lost the lamb stew, the plum cake, and something she called "the sour pickle," which no one had ever thought to write down because she had always simply been there to make it.</p>
<p>My mother's kitchen smells of coffee and sunscreen. She cooks from the internet now, reading instructions from her phone propped against the fruit bowl, and though the food is good — genuinely good — there is a specific texture of confidence missing. The confidence of someone who has made the dish a thousand times without looking.</p>
<p>My own kitchen smells of whatever I burned last Tuesday. I am thirty-four years old and I still approach pastry with the terror of someone defusing something. I have five different olive oils and no idea when to use which.</p>
<blockquote>We are the first generation to lose the recipes and know we have lost them.</blockquote>
<p>I think about this when I watch cooking videos at midnight, searching for the lamb stew I remember but cannot quite reconstruct. The algorithm knows what I'm doing. It keeps offering me grief in the form of technique.</p>`,
      author: 'w2', date: '2025-02-20', readTime: 5,
      coverImage: '', issueId: ''
    },
    {
      id: 'a3', type: 'news', status: 'published',
      title: 'City Council Approves Waterfront Redevelopment Plan After Lengthy Debate',
      excerpt: 'The 4-3 vote clears the way for a $240 million project that opponents say will price out longtime residents.',
      body: `<p>The city council voted narrowly Tuesday evening to approve a sweeping waterfront redevelopment plan, ending months of contentious debate over a project that supporters say will revitalise an underused industrial corridor while critics argue it will accelerate displacement in surrounding neighbourhoods.</p>
<p>The vote was four to three, with council member Dana Park casting the deciding vote after more than two hours of public comment that stretched well past midnight. Outside the chambers, a crowd of roughly eighty residents had gathered, some holding signs reading "Homes Not Hotels."</p>
<p>"This is a difficult decision and I don't make it lightly," Park said before casting her vote. "But I believe the community benefits package negotiated over the past six months represents meaningful protections for current residents."</p>
<p>The $240 million project, developed by Meridian Partners, calls for the construction of four mixed-use towers on a 14-acre site that has sat largely vacant since the closure of a container shipping facility in 2019. Plans include 1,200 residential units, a hotel, retail space, and a publicly accessible waterfront promenade.</p>
<p>Under the community benefits agreement, 18 percent of the residential units will be deed-restricted affordable housing — a figure housing advocates called insufficient. The agreement also includes $4 million toward a neighbourhood stabilisation fund and commitments to hire locally for construction jobs.</p>`,
      author: 'w3', date: '2025-03-10', readTime: 4,
      coverImage: '', issueId: 'i1'
    },
    {
      id: 'a4', type: 'news', status: 'published',
      title: 'Regional Transit Authority Announces Service Cuts Amid Budget Shortfall',
      excerpt: 'Fourteen bus routes face elimination or significant reduction starting in July as the authority grapples with a $38 million deficit.',
      body: `<p>The Regional Transit Authority announced a sweeping package of service reductions on Thursday, citing a projected $38 million budget shortfall and declining federal operating support as the authority struggles to restore ridership to pre-pandemic levels.</p>
<p>The proposed cuts, which will go before the board for a final vote in April, would eliminate seven bus routes entirely and reduce service frequency on seven others. An estimated 12,000 daily riders use the affected routes, according to agency data.</p>
<p>"We have exhausted our ability to absorb these costs through internal efficiencies," said transit director Marlowe Chen at a press conference. "The state of our budget requires that we make hard choices."</p>
<p>The announcement drew immediate criticism from transit advocacy groups, who noted that the routes slated for elimination serve predominantly low-income neighbourhoods in the eastern districts, where car ownership rates are lowest.</p>
<p>"These are not redundant routes," said Alicia Ferris of the Transit Equity Coalition. "These are lifelines. For thousands of people, this is their only way to get to work."</p>
<p>The authority has scheduled four public comment sessions in affected neighbourhoods before the April board vote. Officials say they remain open to a reduced package of cuts if alternative revenue sources can be identified.</p>`,
      author: 'w1', date: '2025-03-10', readTime: 5,
      coverImage: '', issueId: 'i1'
    },
    {
      id: 'a5', type: 'news', status: 'published',
      title: 'University Researchers Develop Drought-Resistant Crop Variant in Breakthrough Study',
      excerpt: 'Scientists at the Institute for Agricultural Sciences say the engineered wheat strain could significantly improve yields in water-scarce regions.',
      body: `<p>Researchers at the Regional Institute for Agricultural Sciences have announced the successful development of a drought-resistant wheat variant that maintained yields under conditions where conventional strains failed, according to findings published in the journal Nature Food on Wednesday.</p>
<p>The variant, designated RWS-7, was engineered over eight years using a combination of traditional cross-breeding techniques and targeted gene modification to enhance the plant's capacity to retain moisture at the root level. In controlled trials across three growing seasons, RWS-7 produced commercially viable yields with 40 percent less water than standard wheat varieties.</p>
<p>"This doesn't solve food insecurity," said lead researcher Dr. Priya Malhotra. "But it represents a meaningful tool for farmers in regions where water scarcity is already affecting livelihoods and will only become more acute."</p>
<p>Field trials are now underway in three countries facing chronic drought conditions, with early results described as promising. Commercial licensing of the variant is expected to be structured to allow affordable access for smallholder farmers in low-income nations.</p>`,
      author: 'w2', date: '2025-02-15', readTime: 4,
      coverImage: '', issueId: 'i2'
    },
    {
      id: 'a6', type: 'creative', status: 'published',
      title: 'Notes Toward an Understanding of Tuesday',
      excerpt: 'A lyric essay about the texture of ordinary time and why the middle of the week feels like a country no one has named.',
      body: `<p>Tuesday is the most honest day of the week. Monday still carries the bruised optimism of Sunday evening; Wednesday has achieved the modest milestone of the midpoint; Thursday is already tilting toward the weekend. But Tuesday is simply itself — a day with no mythology, no character, no brand partnership with any emotion in particular.</p>
<p>I have always done my best work on Tuesdays. I suspect this is because no one expects anything of them, and expectations are the enemy of getting things done. On a Tuesday, you can write badly for an hour and nobody, not even yourself, is especially surprised.</p>
<blockquote>The middle of the week is where ordinary life actually happens, which is perhaps why writers rarely set their climaxes there.</blockquote>
<p>Consider the sentences that have been written on Tuesdays. Not the famous ones — those were probably written on dramatic Mondays or autumnal Thursdays. I mean the unremarkable sentences, the ones that turned out to be necessary, the structural ones that no reader ever notices but without which the paragraph would collapse.</p>
<p>I am trying to learn to live more Tuesdays. To stop performing the arc and simply continue. To find the work that gets done in the middle of things, without ceremony, because that is mostly what a life is.</p>`,
      author: 'w3', date: '2025-01-30', readTime: 4,
      coverImage: '', issueId: ''
    }
  ],
  issues: [
    { id: 'i1', title: 'Issue No. 12', date: '2025-03-10', description: 'Spring Edition — City, Transit & the Politics of Space' },
    { id: 'i2', title: 'Issue No. 11', date: '2025-02-15', description: 'February Edition — Science, Climate & the Future of Food' }
  ],
  writers: [
    {
      id: 'w1',
      name: 'Eleanor Voss',
      role: 'Senior Correspondent',
      bio: 'Eleanor covers urban policy and civic life with a focus on the tension between development and community. She was previously a staff writer at The Municipal Review and holds an MA in Urban Studies from NYU. Her longform journalism has been recognised with three regional press awards.',
      avatar: ''
    },
    {
      id: 'w2',
      name: 'James Okafor',
      role: 'Science & Culture Editor',
      bio: 'James writes at the intersection of science, culture, and the everyday. His essays have appeared in Granta, The Atlantic, and Best American Essays. He is the author of "The Careful Animals," a collection of narrative nonfiction. He teaches creative writing at the university level.',
      avatar: ''
    },
    {
      id: 'w3',
      name: 'Simone Lacroix',
      role: 'Contributing Writer',
      bio: 'Simone is a poet and essayist whose work explores time, memory, and domestic life. Her debut essay collection was shortlisted for the Fitzcarraldo Prize. She writes a monthly column on the philosophy of ordinary experience and is currently working on her first novel.',
      avatar: ''
    }
  ]
};

// ─── Store API ───────────────────────────────
const Store = {
  get() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_DATA));
    } catch { return JSON.parse(JSON.stringify(DEFAULT_DATA)); }
  },
  save(data) {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  },
  init() {
    if (!localStorage.getItem(STORE_KEY)) {
      this.save(JSON.parse(JSON.stringify(DEFAULT_DATA)));
    }
  }
};

// ─── Utilities ───────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function truncate(str, max = 140) {
  if (!str || str.length <= max) return str || '';
  return str.slice(0, max).trim() + '…';
}

function getWriterName(writerId, data) {
  const w = data.writers.find(x => x.id === writerId);
  return w ? w.name : 'Unknown';
}

function getWriterInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
}

function showToast(msg) {
  let t = document.getElementById('global-toast');
  if (!t) { t = document.createElement('div'); t.id = 'global-toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── Shared Nav setup ────────────────────────
function setupNav() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => mobileNav.classList.add('open'));
    document.getElementById('mobile-nav-close')?.addEventListener('click', () => mobileNav.classList.remove('open'));
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('open')));
  }

  // Active link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (path.endsWith(href) || (href !== 'index.html' && path.includes(href.replace('.html','')))) {
      a.classList.add('active');
    }
  });
}

// ─── Scroll reveal ───────────────────────────
function setupReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
}

// ─── Article card builder ────────────────────
function buildArticleCard(article, data) {
  const authorName = getWriterName(article.author, data);
  const imgHTML = article.coverImage
    ? `<img src="${article.coverImage}" alt="${article.title}" loading="lazy">`
    : `<div class="article-card-img-placeholder"><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="10" width="36" height="28" rx="2" stroke="currentColor" stroke-width="2"/><path d="M6 30l10-8 8 6 6-5 12 10" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="20" r="3" stroke="currentColor" stroke-width="2"/></svg></div>`;
  const page = article.type === 'creative' ? 'creative.html' : 'news.html';
  return `
    <div class="article-card reveal" onclick="location.href='article.html?id=${article.id}'">
      <div class="article-card-img">${imgHTML}</div>
      <div class="article-card-meta">${formatDate(article.date)}</div>
      <h3>${article.title}</h3>
      <p>${truncate(article.excerpt, 120)}</p>
      <div class="article-card-footer">
        <span class="article-card-author">By ${authorName}</span>
        <a href="article.html?id=${article.id}" class="read-more">Read <span class="arrow">→</span></a>
      </div>
    </div>`;
}
