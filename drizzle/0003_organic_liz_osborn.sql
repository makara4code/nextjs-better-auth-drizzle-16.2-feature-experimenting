ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;

UPDATE "member"
SET "role" = 'org_superadmin'
WHERE "role" = 'owner';

UPDATE "member"
SET "role" = 'org_admin'
WHERE "role" = 'admin';

UPDATE "invitation"
SET "role" = 'org_superadmin'
WHERE "role" = 'owner';

UPDATE "invitation"
SET "role" = 'org_admin'
WHERE "role" = 'admin';

UPDATE "user"
SET "role" = 'global_admin'
WHERE "role" = 'admin';

UPDATE "user"
SET "role" = NULL
WHERE "role" = 'user';
