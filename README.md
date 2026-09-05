# Good News — live positive news app

Good News is a mobile-first PWA that pulls current headlines from RSS feeds, filters out war/politics/violence/tragedy, ranks positive and quirky stories, and links readers to the original publishers.

## What is included

- Live server-side RSS aggregation from a small starter set of publishers.
- Hard negative-topic exclusions and positive/quirky scoring.
- Optional OpenAI editorial pass for a second content check.
- Category filters: People, Animals, Science, Community, Quirky.
- Save and share buttons.
- "Lift me up" random positive story.
- PWA manifest + service worker so it can be added to an iPhone Home Screen.
- Server caching headers set to roughly 3 hours.
- Vercel cron configured once daily (compatible with Vercel Hobby). Normal visits still refresh from the cached API as the cache expires.

## Publish on Vercel (easiest)

### Option A — GitHub + Vercel website
1. Create a GitHub account/repository if you do not already have one.
2. Upload every file/folder from this project to the repository root.
3. Create/log in to Vercel and choose **Add New → Project**.
4. Import the GitHub repository.
5. Framework preset: **Other**. No build command is required.
6. Deploy.
7. Vercel gives you a public `*.vercel.app` address. The live news API is at `/api/news`.

### Turn on AI review
This is optional. The rules-based filter works without it.

1. Create an OpenAI API key in the OpenAI developer dashboard.
2. In Vercel: Project → Settings → Environment Variables.
3. Add `OPENAI_API_KEY` as a secret value.
4. Optional: add `OPENAI_MODEL` if you want to override the default model (`gpt-5-mini`).
5. Redeploy.
6. The app status line will change from `rules` to `rules + AI` when AI review succeeds.

Never put an API key inside `index.html` or other browser-side code.

## Update frequency

`/api/news` sends CDN cache headers for a 3-hour cache (`s-maxage=10800`). This means ordinary traffic refreshes the feed after the cached result expires.

`vercel.json` also includes a once-daily cron warm-up at 06:17 UTC, which works on Vercel Hobby as of September 2026. If you later use a Vercel plan that allows multiple cron invocations per day, you can change the schedule to every three hours:

```json
{
  "crons": [{ "path": "/api/news", "schedule": "17 */3 * * *" }]
}
```

## Add/remove news sources

Edit the `SOURCES` array near the top of `api/news.js`. Each source has:

```js
{ name: 'Publisher', url: 'https://publisher.example/feed/', hint: 'People' }
```

Only add feeds you are comfortable linking to and whose terms allow your use case. The app displays a headline/short excerpt and sends the reader to the original publisher; it does not copy full articles.

## Content rules

The starter filter is intentionally strict. You can edit these arrays in `api/news.js`:

- `HARD_BLOCK` — story is rejected if these topics appear.
- `POSITIVE` — signals uplifting/constructive content.
- `QUIRKY` — signals unusual/fun content.
- `CATEGORY_RULES` — categorises stories.

For a serious public launch, add an admin moderation queue/report button rather than relying only on automation.

## Test locally

The front end opens in preview mode if `/api/news` is unavailable. To test the serverless function exactly as Vercel will run it, install Vercel CLI and run the project with Vercel's local development command.

## Make it feel like an iPhone app

After deployment, open the website in Safari on iPhone → Share → **Add to Home Screen**. The included web app manifest lets it launch in standalone mode.

## App Store later

This package is a PWA, not yet an App Store binary. A later phase can wrap/rebuild it as a native iOS app (for example with Capacitor or SwiftUI), add push notifications, accounts, an admin review panel, analytics, and prepare App Store assets/privacy information.
