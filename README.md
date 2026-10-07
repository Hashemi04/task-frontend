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

Set `NUXT_PUBLIC_SITE_URL` (for example `https://videos.tabdeal.org`) in production. Canonical links, Open Graph URLs, `robots.txt` and `/sitemap.xml` use it to build absolute URLs. Without it they fall back to the request's host, which is wrong behind a proxy that rewrites `Host`.

## SEO

- Every list page links to itself as canonical, with page 1 as `/`. Search results (`?q=`) are `noindex, follow`.
- Video pages have Open Graph video tags with the poster as the image, and `VideoObject` JSON-LD with the upload date, duration and embed URL.
- `/sitemap.xml` is a video sitemap built from the cached channel catalog. `/robots.txt` points to it and keeps crawlers out of `/api/`.
- HTML is cached with stale-while-revalidate: one minute for the list, five minutes for videos, an hour for the sitemap.

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

Connect this repo in Vercel. The Nuxt framework preset builds with `pnpm build`. Set `NUXT_PUBLIC_SITE_URL` to the site URL, for example `https://your-site.vercel.app`. Canonical links, Open Graph, `robots.txt`, and `/sitemap.xml` use that value.
