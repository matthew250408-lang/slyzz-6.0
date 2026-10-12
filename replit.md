# Slyzz 6.0 — Bot Discord

Bot Discord configurable pour gérer les inscriptions des membres et les conversations de modmail.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional secret: `DISCORD_BOT_TOKEN` (or `DISCORD_TOKEN`) — enables the Discord bot

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/discord/bot.ts` — slash commands and Discord interaction handlers
- `artifacts/api-server/src/discord/modmail.ts` — member support conversations and moderator actions
- `artifacts/api-server/src/discord/store.ts` — persisted registration configuration
- `lib/db/src/schema/` — registration and modmail tables

## Architecture decisions

- The API server keeps running if the Discord token is absent; bot startup is disabled until one is configured.
- Registration settings and active modmail conversation state are persisted in PostgreSQL.
- Setup access is checked in bot interactions; members can still use the public registration flow.

## Product

- Administrators configure a registration embed, button, questions, and response channel.
- Members submit their application through a Discord modal.
- Members can open support conversations through modmail; moderators can claim, reply, and close conversations.
- Authorized users can publish custom embeds with `/message`; `/info-bot` displays the bot version, developer, and last-modified date.
- `/rank-derank` lets an authorized user choose `rank` or `derank`, changes the configured role, and posts an announcement embed in the configured announcement channel.

### Custom embeds

Use `/message` with any combination of `titre`, `description`, `couleur`, `image`, `miniature`, `footer`, `icone-footer`, and `champs`. If `couleur` is omitted, the embed uses `#f2b2a8`. Image, thumbnail, and footer-icon values must be public HTTP(S) URLs.

Example: `/message titre:Bienvenue description:Bienvenue sur le serveur ! couleur:#5865F2`

`champs` is a JSON array using French keys, for example:

```json
[{"nom":"Règles","contenu":"Respecte le règlement","inline":true}]
```

The command is limited to the primary administrators and users authorized for that server with `/setup-permission`. `/info-bot` is public and reports version `6.0`, developer `<@1140296215469240401>`, and the last-modified date.

### Rank and derank

`/rank-derank` takes an `action` choice (`rank` or `derank`), a member, a `role` to add/remove, and a reason. It posts the rank/derank embed in channel `1542655357728456855`; the message above the embed mentions the affected member and the notification role `1429508546550038648`, while the embed includes the selected role in the action copy. The footer identifies the command author and shows their avatar. Rank and derank use Markdown H2 headings, the specified French copy, and quoted member/reason lines with `<:utilisateur:1558391260375556097>` and `<:raison:1558391410498084925>`; use `<:rank:1558389911625662544>` for rank and `<:derank:1558389778406440991>` for derank. Access is limited to members with role `1429494599730335765`, server administrators, and the server owner. Biscotto needs **Manage Roles**, permission to send embeds and mention the notification role in the announcement channel, and a role hierarchy above the target role and member.

## User preferences

_Aucune préférence particulière indiquée._

## Gotchas

- Discord bot actions require `DISCORD_BOT_TOKEN` or `DISCORD_TOKEN` in Replit Secrets.
- Run `pnpm --filter @workspace/db run push` in development after schema changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
