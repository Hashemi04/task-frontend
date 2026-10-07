# ویدیوهای صرافی تبدیل

A Nuxt app for the Tabdeal channel on Aparat (`tabdealplatform`).

The home page lists the channel videos, nine per page. Search filters by title and ignores Persian spelling variants (Arabic ي/ك, half-spaces, Persian digits). Opening a video shows the player, title, channel, views, date, and description. An unknown video, or one from another channel, returns a 404.

Pages are server-rendered. The browser talks to this app, and a Nitro route fetches Aparat.

## Requirements

- Node.js 22.12 or newer (see `.nvmrc`; run `nvm use`)
- pnpm 10

## Setup

```bash
pnpm install
```

Installing also sets up a pre-commit hook that checks the Node version, then lints and formats the staged files.

### Why `h3` is a dev dependency

`@nuxt/test-utils` accepts h3 v1 or v2, and without a direct dependency pnpm installs v2 at the root. Nitro then bundles h3 v2 into the server, and every API route fails. The direct `h3@^1` dependency keeps the server on the version Nuxt 3 expects. Remove it only together with `@nuxt/test-utils`, or after moving to Nuxt 4.

## Configuration

The channel defaults to `tabdealplatform`. Set `NUXT_APARAT_CHANNEL` to list another one (see `.env.example`).

Canonical links, Open Graph URLs, `robots.txt` and `/sitemap.xml` build absolute URLs from the site URL, which defaults to https://tabdeal-frontend-task.vercel.app. Set `NUXT_PUBLIC_SITE_URL` to deploy under another domain.

## SEO

- Every list page links to itself as canonical, with page 1 as `/`. Search results (`?q=`) are `noindex, follow`.
- Video pages have Open Graph video tags with the poster as the image, and `VideoObject` JSON-LD with the upload date, duration and embed URL.
- `/sitemap.xml` is a video sitemap built from the cached channel catalog. `/robots.txt` points to it and keeps crawlers out of `/api/`.

## Caching

- Pages and API responses send `Cache-Control` headers so the CDN caches them with stale-while-revalidate: one minute for the list, five minutes for videos, an hour for the sitemap. On Vercel, the edge network serves them.
- The server also keeps the channel catalog for one minute and up to 200 videos for five minutes in memory. Concurrent requests share one Aparat call, and when Aparat fails the last good copy is served and the failure is logged.
- Aparat returns 40 videos per page with a cursor to the next one, so the catalog is read page by page, up to 20 pages. A larger channel is cut off with a warning in the logs.
- Aparat responses are checked against a schema (`server/lib/aparatSchema.ts`). Videos with an unexpected shape are skipped and logged; a response that does not match at all returns a 502.

## Development

```bash
pnpm dev
```

Open http://localhost:3000.

## Checks

```bash
pnpm lint          # ESLint
pnpm format:check  # Prettier
pnpm typecheck     # vue-tsc through nuxt typecheck
pnpm test          # Vitest: unit tests and Nuxt component tests
pnpm check         # all of the above
```

CI runs the same checks and a production build on every pull request.

## Production

```bash
pnpm build
pnpm preview
```

## Vercel

The app is live at https://tabdeal-frontend-task.vercel.app. Connect this repo in Vercel and the Nuxt framework preset builds it with `pnpm build`. To deploy under another domain, set `NUXT_PUBLIC_SITE_URL` to it.
