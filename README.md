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

## Postgres With Docker

Copy [`.env.example`](./.env.example) to `.env`, then start Postgres:

```bash
docker compose up -d postgres
```

The database will be available at:

```bash
postgresql://postgres:postgres@localhost:5432/app
```

Useful commands:

```bash
docker compose ps
docker compose logs -f postgres
docker compose down
```

## Better Auth + Drizzle

This project now includes:

- Better Auth with email/password authentication
- Drizzle ORM configured for PostgreSQL
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
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
