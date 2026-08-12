-- Admin auth no longer uses a per-user account/table — a single shared
-- ADMIN_ACCESS_CODE (checked in src/app/admin/login/actions.ts) replaces
-- username/password login. See src/lib/auth.ts.
DROP TABLE "AdminUser";
