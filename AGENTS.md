This file provides guidance to AI coding agents like Claude Code (claude.ai/code), Cursor AI, Codex, Gemini CLI, GitHub Copilot, and other AI coding assistants when working with code in this repository.

# Galactic Canvas AGENTS.md

## Architecture

- This repository is a monorepo with two workspaces:
  - `ui/` — SvelteKit frontend deployed to Cloudflare Pages
  - `api/` — Hono API deployed to Cloudflare Workers
- There is no root `package.json`; run commands from `ui/` or `api/`, or use the root `Taskfile.yml`.
- Main frontend page: `ui/src/routes/+page.svelte`
- Worker entrypoint: `api/src/index.ts`
- Azure OpenAI image generation wrapper: `api/src/services/azureAI.ts`

## Common commands

### UI (`ui/`)
- Dev: `yarn dev` (`vite dev`)
- Build: `yarn build` (`vite build`)
- Preview: `yarn preview` (`yarn run build && wrangler pages dev`)
- Validation: `yarn check` (`svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`)
- Watch validation: `yarn check:watch`
- Deploy: `yarn deploy:dev` / `yarn deploy:prod` (Wrangler Pages deploy scripts)

### API (`api/`)
- Dev: `yarn start:dev` (`wrangler dev --config wrangler.dev.toml`)
- Prod-style local run: `yarn start:prod` (`wrangler dev --config wrangler.prod.toml`)
- Deploy: `yarn deploy:dev` / `yarn deploy:prod` (Wrangler deploy scripts)

### Root Taskfile
Use the Taskfile when coordinating both workspaces:
- Dev tasks: `api`, `deploy-api`, `ui`, `build-ui`, `deploy-ui`
- Prod tasks: `dev-api`, `deploy-api`, `dev-ui`, `build-ui`, `deploy-ui`

## Validation and deploy workflow

- UI validation starts with `cd ui && yarn check`, then `cd ui && yarn build`
- API validation/deploy work is driven by the `api/` Wrangler scripts:
  - local/dev: `yarn start:dev`
  - production-like local run: `yarn start:prod`
  - deployment: `yarn deploy:dev` and `yarn deploy:prod`
- When changing both sides, prefer the Taskfile to keep UI/API commands aligned.

## Environment and config

- UI env example: `ui/.env.example`
  - contains `TOKEN`
- API env example: `api/.dev.vars.example`
  - contains `API_KEY`
  - contains `API_ENDPOINT`
- Keep Cloudflare config aligned with the target environment:
  - `api/wrangler.dev.toml`
  - `api/wrangler.prod.toml`

## Main workflow

1. Make UI changes in `ui/` and API changes in `api/`.
2. Use the workspace-specific scripts, not root-level commands.
3. Validate UI changes with `yarn check` and `yarn build` from `ui/`.
4. Validate API changes with the relevant Wrangler dev command from `api/`.
5. Deploy with the matching `deploy:dev` or `deploy:prod` script in the workspace, or the corresponding Taskfile target.
