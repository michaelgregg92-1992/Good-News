import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 9000,
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

const SOURCES = [
  {
    name: 'Positive News',
    url: 'https://www.positive.news/feed/',
    hint: 'People',
    trustedPositive: true
  },
  {
    name: 'Good News Network',
    url: 'https://www.goodnewsnetwork.org/feed/',
    hint: 'People',
    trustedPositive: true
  },
  {
    name: 'BBC Science & Environment',
    url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    hint: 'Science'
  },
  {
    name: 'BBC Technology',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    hint: 'Science'
  },
  {
    name: 'The Guardian Science',
    url: 'https://www.theguardian.com/science/rss',
    hint: 'Science'
  },
  {
    name: 'UPI Odd News',
    url: 'https://rss.upi.com/news/odd_news.rss',
    hint: 'Quirky'
  }
];

const HARD_BLOCK = [
  'war',
  'warfare',
  'missile',
  'missiles',
  'bomb',
  'bombing',
  'airstrike',
  'air strike',
  'invasion',
  'troops',
  'military attack',

  'murder',
  'murdered',
  'homicide',
  'shooting',
  'shot dead',
  'stabbing',
  'stabbed',
  'terror',
  'terrorist',
  'hostage',
  'kidnap',
  'rape',
  'sexual assault',

  'election',
  'prime minister',
  'president said',
  'parliament',
  'political row',
  'politics',
  'senator',
  'congress',
  'government crisis',

  'death toll',
  'dies after',
  'died after',
  'fatal crash',
  'famine',
  'genocide',
  'massacre',
  'execution',
  'suicide'
];

const POSITIVE = [
  'rescue',
  'rescued',
  'saved',
  'reunited',
  'recovery',
  'recovers',
  'breakthrough',
  'discovery',
  'record',
  'wins',
  'winner',
  'award',
  'kindness',
  'kind',

  'donates',
  'donation',
  'raises',
  'fundraiser',
  'community',
  'volunteer',
  'volunteers',
  'restored',
  'returns',
  'rebounds',
  'revival',

  'protect',
  'protected',
  'conservation',
  'reintroduced',
  'born',
  'baby',
  'adopted',
  'adoption',
  'celebrates',
  'celebration',

  'success',
  'successful',
  'improves',
  'improved',
  'solution',
  'clean energy',
  'renewable',
  'recycle',
  'recycling',
  'hope',

  'helps',
  'helping',
  'friendship',
  'surprise',
  'joy',
  'found',
  'finds',
  'first ever',
  'milestone',
  'thrives',
  'thriving',
  'welcomes'
];

const QUIRKY = [
  'odd',
  'weird',
  'quirky',
  'unusual',
  'unexpected',
  'mystery',
  'giant',
  'tiny',
  'world record',
  'costume',
  'festival',
  'accidentally',
  'mistaken for',

  'wanders into',
  'escapes',
  'photobomb',
  'proposal',
  'wedding',
  'birthday',
  'lottery',
  'treasure',
  'message in a bottle',
  'surprise visitor',

  'unexpected guest',
  'wrong house',
  'goes viral',
  'viral video'
];

const CATEGORY_RULES = {
  Animals: [
    'animal',
    'dog',
    'dogs',
    'cat',
    'cats',
    'seal',
    'whale',
    'dolphin',
    'bird',
    'penguin',
    'otter',
    'turtle',
    'elephant',
    'horse',
    'wildlife',
    'zoo',
    'puppy',
    'puppies',
    'kitten',
    'kittens',
    'goose',
    'duck',
    'alpaca',
    'llama',
    'squirrel',
    'cow',
    'sheep',
    'goat',
    'pony',
    'tortoise'
  ],

  Science: [
    'science',
    'research',
    'researcher',
    'scientist',
    'study',
    'space',
    'planet',
    'star',
    'technology',
    'energy',
    'solar',
    'battery',
    'medical',
    'health',
    'recycle',
    'breakthrough',
    'discovery',
    'innovation'
  ],

  Community: [
    'community',
    'neighbour',
    'neighbor',
    'town',
    'village',
    'school',
    'club',
    'charity',
    'volunteer',
    'fundraiser',
    'local',
    'donation',
    'food bank',
    'neighbourhood',
    'neighborhood'
  ],

  People: [
    'teacher',
    'student',
    'family',
    'grandmother',
    'grandfather',
    'child',
    'children',
    'man',
    'woman',
    'couple',
    'friend',
    'people',
    'artist',
    'athlete',
    'worker',
    'resident'
  ],

  Quirky: QUIRKY
};

function cleanHtml(input = '') {
  return String(input)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&hellip;/g, '…')
    .replace(/&mdash;|&#8212;/g, '—')
    .replace(/&ndash;|&#8211;/g, '–')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8220;|&ldquo;/g, '“')
    .replace(/&#8221;|&rdquo;/g, '”')
    .replace(/\s+/g, ' ')
    .trim();
}

function removeFeedJunk(text = '') {
  return String(text)
    .replace(/\[\s*…\s*\]/g, '')
    .replace(/\[\s*\.\.\.\s*\]/g, '')
    .replace(/\bThe post\b[\s\S]*$/i, '')
    .replace(/\bRead more\b[\s\S]*$/i, '')
    .replace(/\bContinue reading\b[\s\S]*$/i, '')
    .replace(/\bappeared first on\b[\s\S]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentences(text = '') {
  return removeFeedJunk(cleanHtml(text))
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map(s => s.trim())
    .filter(Boolean) || [];
}

function neatSummary(text = '', maxLength = 280) {
  const parts = sentences(text);

  if (!parts.length) {
    return 'A positive story worth a closer look.';
  }

  let result = '';

  for (const sentence of parts) {
    const candidate = result
      ? `${result} ${sentence}`
      : sentence;

    if (candidate.length > maxLength) {
      break;
    }

    result = candidate;

    if (result.length >= 110) {
      break;
    }
  }

  if (result) return result;

  const first = parts[0];

  if (first.length <= maxLength) {
    return first;
  }

  const shortened =
    first.slice(0, maxLength);

  const lastSpace =
    shortened.lastIndexOf(' ');

  return (
    shortened.slice(
      0,
      lastSpace > 80
        ? lastSpace
        : maxLength
    ) + '…'
  );
}

function buildParagraphs(summary, source) {
  const parts = sentences(summary)
    .slice(0, 3);

  const paragraphs = [];

  if (parts.length >= 1) {
    paragraphs.push(parts[0]);
  }

  if (parts.length >= 2) {
    paragraphs.push(
      parts.slice(1).join(' ')
    );
  }

  paragraphs.push(
    `This Good News digest is based on reporting by ${source}. Tap the source button below to read the original story.`
  );

  return paragraphs;
}

function absolutize(url, base) {
  if (!url) return '';

  try {
    return new URL(
      String(url).replace(/&amp;/g, '&'),
      base
    ).href;
  } catch {
    return '';
  }
}

function mediaUrl(value) {
  if (!value) return '';

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = mediaUrl(item);

      if (result) return result;
    }

    return '';
  }

  return (
    value.url ||
    value.href ||
    value.$?.url ||
    value.$?.href ||
    ''
  );
}

function imageFromItem(item, baseUrl = '') {
  const direct = [
    item.enclosure?.url,
    mediaUrl(item.mediaContent),
    mediaUrl(item.mediaThumbnail),
    mediaUrl(item['media:content']),
    mediaUrl(item['media:thumbnail']),
    item.image?.url,
    typeof item.image === 'string'
      ? item.image
      : ''
  ].find(Boolean);

  if (direct) {
    return absolutize(
      direct,
      baseUrl
    );
  }

  const html =
    item.contentEncoded ||
    item['content:encoded'] ||
    item.content ||
    item.summary ||
    '';

  const patterns = [
    /<img[^>]+(?:data-lazy-src|data-src|src)=["']([^"']+)["']/i,
    /<source[^>]+srcset=["']([^"',\s]+)[^"']*["']/i,
    /<img[^>]+srcset=["']([^"',\s]+)[^"']*["']/i
  ];

  for (const pattern of patterns) {
    const match =
      String(html).match(pattern);

    if (match?.[1]) {
      return absolutize(
        match[1],
        baseUrl
      );
    }
  }

  return '';
}

function keywordHits(text, words) {
  return words.reduce(
    (count, word) =>
      count +
      (text.includes(word) ? 1 : 0),
    0
  );
}

function chooseCategory(
  text,
  fallback = 'People'
) {
  const scores =
    Object.entries(CATEGORY_RULES)
      .map(([category, words]) => [
        category,
        keywordHits(text, words)
      ])
      .sort((a, b) => b[1] - a[1]);

  const [best, bestScore] =
    scores[0] || [];

  if (!bestScore) {
    return fallback;
  }

  const animalScore =
    scores.find(
      ([category]) =>
        category === 'Animals'
    )?.[1] || 0;

  const quirkyScore =
    scores.find(
      ([category]) =>
        category === 'Quirky'
    )?.[1] || 0;

  if (
    animalScore > 0 &&
    animalScore >= quirkyScore
  ) {
    return 'Animals';
  }

  return best;
}

function scoreArticle(article) {
  const text =
    `${article.title} ${article.summary}`
      .toLowerCase();

  if (
    HARD_BLOCK.some(term =>
      text.includes(term)
    )
  ) {
    return {
      approved: false,
      positivity: 0,
      quirkiness: 0,
      score: -100
    };
  }

  const positiveHits =
    keywordHits(
      text,
      POSITIVE
    );

  const quirkyHits =
    keywordHits(
      text,
      QUIRKY
    );

  const sourceBonus =
    article.trustedPositive
      ? 3
      : 0;

  const published =
    new Date(
      article.publishedAt
    ).getTime();

  const hoursOld =
    Number.isFinite(published)
      ? Math.max(
          0,
          (Date.now() - published) /
            3600000
        )
      : 999;

  const freshness =
    hoursOld <= 24
      ? 3
      : hoursOld <= 72
      ? 2
      : hoursOld <= 168
      ? 1
      : 0;

  const positivity =
    Math.min(
      10,
      4 +
        positiveHits * 1.35 +
        sourceBonus
    );

  const quirkiness =
    Math.min(
      10,
      quirkyHits * 2.2
    );

  const approved =
    article.trustedPositive ||
    positivity >= 5 ||
    quirkiness >= 4;

  const score =
    positivity * 2 +
    quirkiness +
    freshness;

  return {
    approved,
    positivity,
    quirkiness,
    score
  };
}

async function fetchSource(source) {
  try {
    const feed =
      await parser.parseURL(
        source.url
      );

    return (
      feed.items || []
    )
      .slice(0, 25)
      .map((item, index) => {
        const title =
          cleanHtml(
            item.title ||
              'Untitled story'
          );

        const rawText =
          item.contentSnippet ||
          item.summary ||
          item.content ||
          item.contentEncoded ||
          item['content:encoded'] ||
          '';

        const summary =
          neatSummary(
            rawText,
            300
          );

        const publishedAt =
          item.isoDate ||
          item.pubDate ||
          new Date().toISOString();

        const link =
          item.link ||
          item.guid ||
          source.url;

        return {
          id: Buffer
            .from(
              `${source.name}|${link}|${index}`
            )
            .toString('base64url')
            .slice(0, 28),

          title,
          summary,

          source:
            source.name,

          url:
            link,

          image:
            imageFromItem(
              item,
              link
            ),

          publishedAt,

          category:
            source.hint,

          trustedPositive:
            !!source.trustedPositive
        };
      });

  } catch (error) {
    console.error(
      `Feed failed: ${source.name}`,
      error.message
    );

    return [];
  }
}

const FALLBACK = [
  {
    id: 'fallback-1',

    title:
      'Good News is refreshing its live feed',

    displayTitle:
      'Good News is refreshing its live feed',

    summary:
      'Fresh positive stories are on the way.',

    dek:
      'Fresh positive stories are on the way.',

    articleParagraphs: [
      'We could not reach enough of our selected publishers just now.',
      'Try again shortly — your saved stories are still available.'
    ],

    source:
      'Good News',

    url:
      'https://www.goodnewsnetwork.org/',

    image: '',

    publishedAt:
      new Date().toISOString(),

    category:
      'Community',

    positivity: 8,
    quirkiness: 2,
    score: 18,

    digestMode:
      'free RSS digest'
  }
];

export default async function handler(
  req,
  res
) {
  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );

  res.setHeader(
    'Cache-Control',
    's-maxage=43200, stale-while-revalidate=86400'
  );

  if (req.method === 'OPTIONS') {
    return res
      .status(204)
      .end();
  }

  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({
        error:
          'Method not allowed'
      });
  }

  const batches =
    await Promise.all(
      SOURCES.map(
        fetchSource
      )
    );

  const seen =
    new Set();

  let articles =
    batches
      .flat()
      .filter(article => {
        if (!article.title) {
          return false;
        }

        const key =
          String(article.url)
            .replace(
              /[#?].*$/,
              ''
            )
            .replace(
              /\/$/,
              ''
            );

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);

        return true;
      })
      .map(article => {
        const result =
          scoreArticle(
            article
          );

        const category =
          chooseCategory(
            `${article.title} ${article.summary}`
              .toLowerCase(),
            article.category
          );

        return {
          ...article,
          ...result,
          category
        };
      })
      .filter(
        article =>
          article.approved
      )
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .slice(
        0,
        20
      );

  articles =
    articles.map(
      article => {
        const cleanSummary =
          neatSummary(
            article.summary,
            300
          );

        const dek =
          neatSummary(
            cleanSummary,
            180
          );

        return {
          id:
            article.id,

          title:
            article.title,

          displayTitle:
            article.title,

          summary:
            cleanSummary,

          dek,

          articleParagraphs:
            buildParagraphs(
              cleanSummary,
              article.source
            ),

          source:
            article.source,

          url:
            article.url,

          image:
            article.image,

          publishedAt:
            article.publishedAt,

          category:
            article.category,

          positivity:
            article.positivity,

          quirkiness:
            article.quirkiness,

          score:
            article.score,

          digestMode:
            'free RSS digest'
        };
      }
    );

  return res
    .status(200)
    .json({
      updatedAt:
        new Date()
          .toISOString(),

      filterMode:
        'rules + free RSS digests',

      count:
        articles.length,

      articles:
        articles.length
          ? articles
          : FALLBACK
    });
}
