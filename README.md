# ویدیوهای صرافی تبدیل

A server-rendered Nuxt app that lists and plays the videos of the Tabdeal channel on Aparat (`tabdealplatform`).

**Live:** https://tabdeal-frontend-task.vercel.app

## Features

- **Video list** with nine videos per page and numbered pagination. The page lives in the URL (`?page=2`), and scroll position is restored on back.
- **Title search** that ignores Persian spelling variants: Arabic ي and ك, half-spaces, and Persian or Arabic digits. `بیت‌کوین`, `بیت کوین` and `بیتکوين` all match.
- **Video page** with the player, channel, views, likes, date, tags and an expandable description.
- **Custom player** with play and pause, mute, a seek slider, current time and duration, fullscreen (including iPhone), and keyboard shortcuts (Space or K, arrow keys, M, F).
- **Every state is covered:** loading skeletons, empty results, request errors with a retry button, unplayable videos, buffering, and a 404 for unknown videos or videos from another channel.

## Highlights

**Reliable data from an unofficial API**

- Aparat is only called from the server, through Nitro API routes. The browser never talks to Aparat directly.
- Every response is validated with a zod schema. A video with an unexpected shape is skipped and logged; a response that does not match at all returns a 502 instead of a broken page.
- The whole channel is read by following Aparat's next-page cursor, 40 videos at a time, so search and pagination cover every video.
- The channel and each video are cached in memory. Concurrent requests share one Aparat call, and when Aparat is down the last good copy is served and the failure is logged.

**Security**

- Video IDs are checked before they reach Aparat, and only videos owned by the configured channel are served.
- Video files must be `https` mp4 files on Aparat's own hosts. Embed links and next-page links must be on `aparat.com`.
- HTML entities from Aparat are decoded into plain text, so Vue escapes them once and nothing renders as raw HTML. JSON-LD and the sitemap are escaped as well.

**Performance and SEO**

- Pages and API responses send `Cache-Control` headers, and the Vercel CDN serves them with stale-while-revalidate: one minute for the list, five minutes for videos, an hour for the sitemap.
- Posters use responsive `srcset`; the first row loads eagerly and the rest lazily.
- Canonical links, Open Graph and Twitter tags, `VideoObject` structured data, a video sitemap and `robots.txt`. Search results are `noindex, follow`.
- Upload dates are converted with the `Asia/Tehran` time zone, including the daylight saving time Iran used until 2022.

**Accessibility**

- Right-to-left Persian layout with `lang="fa"`.
- Labelled controls, visible focus rings, an `aria-busy` list while loading, and route announcements.
- The seek bar is a real slider that announces the current time to screen readers.

**Code quality**

- TypeScript throughout, with ESLint, Prettier and `vue-tsc`.
- Unit tests for the server and parsing code, and component tests for the UI, with Vitest.
- A pre-commit hook lints and formats staged files, and CI runs every check plus a production build on each pull request.

## Tech stack

Nuxt 3, Vue 3, TypeScript, Tailwind CSS, zod, Vitest with `@nuxt/test-utils` and happy-dom, deployed on Vercel.

## Project structure

```text
├── pages/
│   ├── index.vue              # Video list, search results and pagination
│   └── videos/[uid].vue       # Video page
├── components/
│   ├── app/                   # Header with the logo and search form
│   ├── base/                  # Shared button (link or button)
│   ├── icons/                 # SVG icons
│   └── video/                 # Card, skeleton, player, pagination, avatar
├── composables/               # Search query, pagination and site URL helpers
├── layouts/default.vue        # Page shell and default SEO tags
├── error.vue                  # 404 and 500 pages
├── utils/                     # Count and duration formatting, pagination, JSON-LD
├── types/                     # Video types shared by the app and the server
├── server/
│   ├── api/                   # GET /api/videos and GET /api/videos/:uid
│   ├── routes/                # sitemap.xml and robots.txt
│   ├── utils/aparat.ts        # Aparat client: paging, caching, mapping
│   └── lib/                   # Response schema, parsing, search keys, cache, sitemap
├── tests/
│   ├── server/                # Server and parsing tests
│   └── nuxt/                  # Component and composable tests
├── assets/css/                # Tailwind entry and font
├── public/                    # Logo, favicon and Open Graph image
└── scripts/check-node.mjs     # Node version check for the pre-commit hook
```

## Getting started

You need Node.js 22.12 or newer (run `nvm use` to pick the version from `.nvmrc`) and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. Installing also sets up the pre-commit hook.

## Configuration

Both settings are optional. See `.env.example`.

| Variable               | Default                                    | Purpose                                                           |
| ---------------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| `NUXT_APARAT_CHANNEL`  | `tabdealplatform`                          | Aparat channel to list                                            |
| `NUXT_PUBLIC_SITE_URL` | `https://tabdeal-frontend-task.vercel.app` | Base for canonical links, Open Graph URLs, sitemap and robots.txt |

## Scripts

```bash
pnpm dev           # Development server
pnpm build         # Production build
pnpm preview       # Run the production build
pnpm lint          # ESLint
pnpm format:check  # Prettier
pnpm typecheck     # vue-tsc through nuxt typecheck
pnpm test          # Vitest
pnpm check         # lint, format, typecheck and tests
```

## Deployment

The app deploys to Vercel with the Nuxt framework preset, which builds with `pnpm build`. To deploy under another domain, set `NUXT_PUBLIC_SITE_URL`.

## Notes

**Why `h3` is a dev dependency.** `@nuxt/test-utils` accepts h3 v1 or v2, and without a direct dependency pnpm installs v2 at the root. Nitro then bundles h3 v2 into the server and every API route fails. The direct `h3@^1` dependency keeps the server on the version Nuxt 3 expects. Remove it only together with `@nuxt/test-utils`, or after moving to Nuxt 4.

**Channel size.** The catalog reads up to 20 Aparat pages (800 videos). A larger channel is cut off, with a warning in the server logs.
