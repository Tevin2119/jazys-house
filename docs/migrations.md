# Migration Policy

`prisma/migrations/20260712193000_baseline` is the first committed schema baseline. It is correct for a new empty database.

## Existing database rollout

Existing development, staging, or production databases created with `prisma db push` already contain these baseline tables. Do not run `npm run db:deploy` against one until the baseline is marked as applied after a verified backup:

```bash
npx prisma migrate resolve --applied 20260712193000_baseline
npm run db:deploy
```

Run the commands once, from a controlled operator environment using the direct `DIRECT_URL`. First rehearse the sequence against a restored copy of the database. Future schema changes must be created with `npm run db:migrate`, reviewed, committed, and deployed via `npm run db:deploy`.

Never use `db push` against a shared environment after this baseline is adopted.
