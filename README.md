This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Postgres + Redis + Mail Tooling With Docker

Copy [`.env.example`](./.env.example) to `.env`, then start Postgres and
Redis plus the local inspection tools:

```bash
docker compose up -d postgres redis adminer redisinsight mailpit
```

The services will be available at:

```bash
postgresql://postgres:postgres@localhost:5432/app
redis://localhost:6379
http://localhost:8080
http://localhost:5540
smtp://localhost:1025
http://localhost:8025
```

Use these local tools:

- `Adminer` at `http://localhost:8080` for PostgreSQL
- `Redis Insight` at `http://localhost:5540` for Redis
- `Mailpit` at `http://localhost:8025` for captured email

Suggested local connection details:

- Adminer system: `PostgreSQL`
- Adminer server: `postgres`
- Adminer username: `postgres`
- Adminer password: `postgres`
- Adminer database: `app`
- Redis Insight host: `redis`
- Redis Insight port: `6379`
- SMTP host: `localhost`
- SMTP port: `1025`
- SMTP secure: `false`
- From address: `no-reply@local.test`

Useful commands:

```bash
docker compose ps
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f mailpit
docker compose down
```

## Better Auth + Drizzle

This project now includes:

- Better Auth with email/password authentication
- Drizzle ORM configured for PostgreSQL
- Redis wired in for dashboard snapshot caching
- Better Auth secondary storage backed by Redis when `REDIS_URL` is set, including Redis-first sessions
- Better Auth verification emails sent through local SMTP / Mailpit on sign-up
- A generated Better Auth schema in [`db/schema.ts`](./db/schema.ts)
- Auth routes mounted at `/api/auth/[...all]`
- A demo sign-in page at `/sign-in`
- A demo sign-up page at `/sign-up`
- A protected demo dashboard at `/dashboard`

Useful commands:

```bash
bun run auth:generate
bun run db:generate
bun run db:migrate
npm run cli -- --email your@email.com --role global_admin
npm run cli -- create-user --email admin@example.com --password "replace-me" --role global_superadmin
```

When you create an account locally, the verification email will be captured by
Mailpit at `http://localhost:8025`.

To bootstrap the first global operator, you can create the account directly from
the CLI:

```bash
npm run cli -- create-user --email admin@example.com --name "Platform Admin" --password "replace-me" --role global_superadmin
npm run cli -- create-admin --email admin@example.com --password "replace-me"
npm run cli -- create-superadmin --email owner@example.com --password "replace-me"
npm run cli -- --email your@email.com --role global_admin
npm run cli -- --email your@email.com --role global_superadmin
npm run cli -- --email your@email.com --role none
npm run cli -- --list-users
npm run cli -- --email your@email.com --dry-run
npm run cli -- --help
```

CLI-created users default to `emailVerified=true` so they can sign in
immediately in local development. The script also supports
`GLOBAL_PLATFORM_EMAIL`, `GLOBAL_PLATFORM_ROLE`, `GLOBAL_PLATFORM_NAME`, and
`GLOBAL_PLATFORM_PASSWORD` from `.env`, while still accepting the older
`GLOBAL_ADMIN_EMAIL` and `GLOBAL_ADMIN_ROLE` names as fallbacks. If your local
database only contains one user, the CLI can auto-pick that user when no email
is provided for role updates.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
