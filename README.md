# ویدیوهای صرافی تبدیل

A Nuxt app for the Tabdeal channel on Aparat (`tabdealplatform`).

The home page lists the channel videos. Search filters by title, and the list is paginated. Opening a video shows the player, title, channel, views, date, and description. An unknown video returns a 404.

Pages are server-rendered. The browser talks to this app, and a Nitro route fetches Aparat.

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Open http://localhost:3000.

## Production

```bash
pnpm build
pnpm preview
```
