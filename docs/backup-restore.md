# Backup and Restore Runbook

The scheduled GitHub Actions backup uses `BACKUP_DATABASE_URL`, which must be a dedicated least-privilege direct/session PostgreSQL connection. It produces a custom-format `pg_dump`, verifies it with `pg_restore --list`, and uploads it to Cloudflare R2.

## Before enabling the workflow

1. Create an R2 bucket and lifecycle policy retaining daily backups for the agreed period.
2. Add `BACKUP_DATABASE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET` as protected GitHub environment secrets.
3. Restrict the R2 access key to the backup bucket and prefix.
4. Run a manual workflow and verify the object and checksum.

## Restore test

1. Download one backup to an isolated non-production database.
2. Run `pg_restore --list backup.dump`.
3. Restore with `pg_restore --clean --if-exists --no-owner --dbname "$RESTORE_DATABASE_URL" backup.dump`.
4. Run `npx prisma migrate status` and application smoke tests against the restored database.
5. Record the restore duration and data timestamp. Perform this quarterly.

Do not restore into production until an incident commander has approved the target point-in-time and customer-impact plan.
