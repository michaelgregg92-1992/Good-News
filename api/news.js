import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 9000,
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator']
    ]
  }
});

const SOURCES = [
  { name: 'Positive News', url: 'https://www.positive.news/feed/', hint: 'People', trustedPositive: true },
  { name: 'Good News Network', url: 'https://www.goodnewsnetwork.org/feed/', hint: 'People', trustedPositive: true },
  { name: 'BBC Science & Environment', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', hint: 'Science' },
  { name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', hint: 'Science' },
  { name: 'The Guardian Science', url: 'https://www.theguardian.com/science/rss', hint: 'Science' },
  { name: 'UPI Odd News', url: 'https://rss.upi.com/news/odd_news.rss', hint: 'Quirky' }
];

const HARD_BLOCK = [
  'war','warfare','missile','missiles','bomb','bombing','airstrike','air strike','invasion','invades','troops','military attack',
  'murder','murdered','homicide','shooting','shot dead','stabbing','stabbed','terror','terrorist','hostage','kidnap','rape','sexual assault',
  'election','prime minister','president said','parliament','political row','politics','mp says','senator','congress','government crisis',
  'deadly','death toll','dies after','died after','fatal crash','earthquake kills','famine','genocide','massacre','execution','suicide'
];

const POSITIVE = [
  'rescue','rescued','saved','reunited','recovery','recovers','breakthrough','discovery','record','wins','winner','award','kindness','kind',
  'donates','donation','raises','fundraiser','community','volunteer','volunteers','restored','returns','rebounds','revival','protect','protected',
  'conservation','reintroduced','born','baby','adopted','adoption','celebrates','celebration','success','successful','improves','improved',
  'solution','clean energy','renewable','recycle','recycling','cure','treatment','hope','helps','helping','free','friendship','surprise','joy',
  'found','finds','first ever','milestone','thrives','thriving','honoured','honored','welcomes','welcome','raises money','funding secured'
];

const QUIRKY = [
  'odd','weird','quirky','unusual','unexpected','mystery','giant','tiny','world record','costume','hat','festival','accidentally','mistaken for',
  'wanders into','stuck in','escapes','photobomb','proposal','wedding','birthday','lottery','treasure','message in a bottle','surprise visitor',
  'unexpected guest','wrong house','goes viral','viral video','unusual visitor'
];

const CATEGORY_RULES = {
  Animals: ['animal','dog','dogs','cat','cats','seal','whale','dolphin','bird','penguin','otter','turtle','elephant','horse','wildlife','zoo','puppy','puppies','kitten','kittens','goose','duck','alpaca','llama','squirrel','cow','sheep','goat','pony','tortoise'],
  Science: ['science','research','researcher','scientist','study','space','planet','star','technology','energy','solar','battery','medical','health','recycle','climate solution','breakthrough','discovery','innovation'],
  Community: ['community','neighbour','neighbor','town','village','school','club','charity','volunteer','fundraiser','local','donation','food bank','neighbourhood','neighborhood'],
  People: ['teacher','student','family','grandmother','grandfather','child','children','man','woman','couple','friend','people','artist','athlete','worker','resident'],
  Quirky: QUIRKY
};

function cleanHtml(input = '') {
  return String(input)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&hellip;/g, 'â¦')
    .replace(/\s+/g, ' ')
    .trim();
}

function absolutize(url, base) {
  if (!url) return '';
  try { return new URL(String(url).replace(/&amp;/g, '&'), base).href; } catch { return ''; }
}

function mediaUrl(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const v of value) { const found = mediaUrl(v); if (found) return found; }
    return '';
  }
  return value.url || value.href || value.$?.url || value.$?.href || '';
}

function imageFromItem(item, baseUrl = '') {
  const direct = [
    item.enclosure?.url,
    mediaUrl(item.mediaContent),
    mediaUrl(item.mediaThumbnail),
    mediaUrl(item['media:content']),
    mediaUrl(item['media:thumbnail']),
    item.image?.url,
    typeof item.image === 'string' ? item.image : ''
  ].find(Boolean);
  if (direct) return absolutize(direct, baseUrl);

  const html = item.contentEncoded || item['content:encoded'] || item.content || item.summary || '';
  const patterns = [
    /<img[^>]+(?:data-lazy-src|data-src|src)=["']([^"']+)["']/i,
    /<source[^>]+srcset=["']([^"',\s]+)[^"']*["']/i,
    /<img[^>]+srcset=["']([^"',\s]+)[^"']*["']/i
  ];
  for (const pattern of patterns) {
    const match = String(html).match(pattern);
    if (match?.[1]) return absolutize(match[1], baseUrl);
  }
  return '';
}

function keywordHits(text, words) {
  return words.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
}

function chooseCategory(text, fallback = 'People') {
  const scores = Object.entries(CATEGORY_RULES).map(([category, words]) => [category, keywordHits(text, words)]);
  scores.sort((a,b) => b[1] - a[1]);
  const [best, bestScore] = scores[0];
  if (!bestScore) return fallback;

  // Keep obvious animal stories in Animals even if the situation itself is unusual.
  const animalScore = scores.find(([c]) => c === 'Animals')?.[1] || 0;
  const quirkyScore = scores.find(([c]) => c === 'Quirky')?.[1] || 0;
  if (animalScore > 0 && animalScore >= quirkyScore) return 'Animals';
  return best;
}

function heuristicScore(article) {
  const text = `${article.title} ${article.summary}`.toLowerCase();
  if (HARD_BLOCK.some(term => text.includes(term))) return { approved: false, score: -99, positivity: 0, quirkiness: 0 };
  const pos = keywordHits(text, POSITIVE);
  const quirky = keywordHits(text, QUIRKY);
  const sourceBonus = article.trustedPositive ? 3 : 0;
  const recencyHours = Math.max(0, (Date.now() - new Date(article.publishedAt).getTime()) / 36e5);
  const freshness = recencyHours <= 24 ? 3 : recencyHours <= 72 ? 2 : recencyHours <= 168 ? 1 : 0;
  const positivity = Math.min(10, 4 + pos * 1.35 + sourceBonus);
  const quirkiness = Math.min(10, quirky * 2.2);
  const score = positivity * 2 + quirkiness + freshness;
  return { approved: positivity >= 5 || quirkiness >= 4, score, positivity, quirkiness };
}

function extractOutputText(response) {
  if (response.output_text) return response.output_text;
  const chunks = [];
  for (const item of response.output || []) {
    for (const part of item.content || []) if (part.type === 'output_text' && part.text) chunks.push(part.text);
  }
  return chunks.join('\n');
}

async function aiReview(articles) {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !articles.length) return null;
  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
  const payload = articles.slice(0, 26).map(a => ({ id: a.id, title: a.title, summary: a.summary, source: a.source }));
  const prompt = `You are the editor for an app called Good News. Approve only uplifting, constructive, heartwarming, genuinely useful, delightful or quirky stories. Reject party politics, political conflict, war, weapons, violence, crime, deaths, disasters, fear-led health stories, outrage bait and stories whose main emotional effect is anger, fear or sadness. A rescue/recovery story may be approved if the dominant takeaway is clearly hopeful and it is not graphic. Categorise animal stories as Animals unless the story is primarily about an unusual non-animal event. Write a warm factual 1-2 sentence summary using only information provided; do not invent details. Return JSON only as an array of objects with id, approve (boolean), category (People|Animals|Science|Community|Quirky), positivity (0-10), quirkiness (0-10), shortSummary (max 38 words), and reason (max 12 words). Stories: ${JSON.stringify(payload)}`;
  try {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: prompt, store: false, max_output_tokens: 3200 })
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}`);
    const data = await r.json();
    const text = extractOutputText(data).replace(/^```json\s*|\s*```$/g, '');
    return JSON.parse(text);
  } catch (err) {
    console.error('AI review failed, using rules only:', err.message);
    return null;
  }
}

async function fetchPageImage(article) {
  if (article.image || !article.url) return article.image || '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4200);
  try {
    const r = await fetch(article.url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'GoodNewsApp/2.1 (+positive-news-reader)' }
    });
    if (!r.ok) return '';
    const html = (await r.text()).slice(0, 450000);
    const patterns = [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
      /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
      /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return absolutize(match[1], article.url);
    }
  } catch (err) {
    console.error(`Image lookup failed: ${article.source}`, err.message);
  } finally {
    clearTimeout(timer);
  }
  return '';
}

async function fetchSource(source) {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items || []).slice(0, 20).map((item, idx) => {
      const title = cleanHtml(item.title || 'Untitled story');
      const rawSummary = cleanHtml(item.contentSnippet || item.summary || item.content || item.contentEncoded || item['content:encoded'] || '');
      const summary = rawSummary.slice(0, 320);
      const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();
      const link = item.link || item.guid || source.url;
      return {
        id: Buffer.from(`${source.name}|${link}|${idx}`).toString('base64url').slice(0, 28),
        title,
        summary: summary || 'Open the original article to read the full positive story.',
        source: source.name,
        url: link,
        image: imageFromItem(item, link),
        publishedAt,
        category: source.hint,
        trustedPositive: !!source.trustedPositive
      };
    });
  } catch (err) {
    console.error(`Feed failed: ${source.name}`, err.message);
    return [];
  }
}

const FALLBACK = [
  { id:'fallback-1', title:'Good News is refreshing its live feed', summary:'The app could not reach enough publishers just now. Try again shortly â your saved stories are still available.', source:'Good News', url:'https://www.goodnewsnetwork.org/', image:'', publishedAt:new Date().toISOString(), category:'Community', positivity:8, quirkiness:2, score:18 }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=10800, stale-while-revalidate=86400');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const batches = await Promise.all(SOURCES.map(fetchSource));
  const seen = new Set();
  const raw = batches.flat().filter(a => {
    const key = a.url.replace(/[#?].*$/, '').replace(/\/$/, '');
    if (seen.has(key) || !a.title) return false;
    seen.add(key); return true;
  });

  const heuristic = raw.map(a => {
    const h = heuristicScore(a);
    const text = `${a.title} ${a.summary}`.toLowerCase();
    return { ...a, ...h, category: chooseCategory(text, a.category) };
  }).filter(a => a.approved).sort((a,b) => b.score - a.score).slice(0, 28);

  const reviews = await aiReview(heuristic);
  let final = heuristic;
  let filterMode = 'rules';
  if (Array.isArray(reviews)) {
    const byId = new Map(reviews.map(r => [String(r.id), r]));
    final = heuristic.map(a => {
      const r = byId.get(String(a.id));
      if (!r) return a;
      return {
        ...a,
        approved: !!r.approve,
        category: r.category || a.category,
        positivity: Number(r.positivity) || a.positivity,
        quirkiness: Number(r.quirkiness) || a.quirkiness,
        summary: cleanHtml(r.shortSummary || a.summary).slice(0, 320),
        aiReason: r.reason || ''
      };
    }).filter(a => a.approved).map(a => ({ ...a, score: a.positivity * 2 + a.quirkiness })).sort((a,b) => b.score - a.score);
    filterMode = 'rules + AI';
  }

  final = final.slice(0, 20);
  const withImages = await Promise.all(final.map(async a => ({ ...a, image: a.image || await fetchPageImage(a) })));
  final = withImages.map(({ approved, trustedPositive, ...a }) => a);

  return res.status(200).json({
    updatedAt: new Date().toISOString(),
    filterMode,
    count: final.length,
    articles: final.length ? final : FALLBACK
  });
}
