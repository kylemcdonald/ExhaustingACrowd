# Cloudflare port

This directory contains the Cloudflare Workers + Static Assets + D1 port of the
site. The existing VPS app remains in the repository root.

## Local development

```sh
cd cloudflare
npm install
npm run d1:migrate:local
npm run dev
```

## Production data migration

Production data contains user IP addresses. Generated SQL files are ignored by
`cloudflare/.gitignore` and must not be committed.

```sh
cd cloudflare
npm run export:prod
npm run d1:migrate:remote
npx wrangler d1 execute exhausting-a-crowd --remote --file=tmp/prod-d1-data.sql
```

## Deploy

```sh
cd cloudflare
npm run deploy
```
