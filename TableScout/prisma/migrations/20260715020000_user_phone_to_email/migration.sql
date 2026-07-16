-- Firebase Phone Auth now requires a Blaze billing account to send SMS at
-- all (Google policy change, Sept 2024) — switching login to email-link
-- sign-in instead. Renaming preserves existing rows (including the test
-- user tied to a real completed Resy reservation) rather than dropping data.
ALTER TABLE "User" RENAME COLUMN "phone" TO "email";
