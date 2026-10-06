# ویدیوهای صرافی تبدیل

A Nuxt app for the Tabdeal channel on Aparat (`tabdealplatform`).

The home page lists the channel videos. Search filters by title, and the list is paginated. Opening a video shows the player, title, channel, views, date, and description. An unknown video returns a 404.

Pages are server-rendered. The browser talks to this app, and a Nitro route fetches Aparat.

## Requirements

- Node.js 22.12 or newer (see `.nvmrc`; run `nvm use`)
- pnpm 10

## Setup

```bash
pnpm install
```

Installing also sets up a pre-commit hook that lints and formats the staged files.

## Configuration

The channel defaults to `tabdealplatform`. Set `NUXT_APARAT_CHANNEL` to list another one (see `.env.example`).

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
