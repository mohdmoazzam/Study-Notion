# For the super admin console

The console already has a sidebar built from `src/data/superAdminLinks.js`. Each idea below
becomes one sidebar entry plus a child route under `/super-admin` in `src/App.js`, with its
API under `/api/v1/super-admin`.

## 19. Users

**Status:** Idea

**Why:** There's no way to look up, support or block an account without touching the database.

**Scope:** Search by name or email, filter by role, view a user's courses and payments, suspend
or ban (the `active` field already exists on the user model), and send a password reset email.

## 20. Course moderation

**Status:** Idea

**Why:** Any instructor can publish anything immediately.

**Scope:** Optional approval step: instructors submit a course for review, and the admin
approves or rejects it with a reason. Also a queue of reported reviews to hide or keep.

## 21. Revenue dashboard

**Status:** Idea

**Why:** No single place shows how the platform is doing financially.

**Scope:** Total sales, sales over time, top courses and instructors, refunds, payouts made and
pending. Built from the `Payment` and `Payout` collections.

## 22. Platform commission

**Status:** Idea

**Why:** Instructors currently receive 100% of each course price, so the platform earns nothing.

**Scope:**
- A configurable commission (for example 20%), with an optional per-instructor override.
- Store the instructor's share on each `Payment` record at purchase time, so a later change to
  the rate doesn't rewrite history.
- Instructor earnings, the dashboard and the payout balance switch from
  "price × students" to the sum of those stored shares.

**Touches:** payments module, `server/src/modules/payouts/payout.service.ts` (balance),
instructor dashboard.

## 23. Categories and site settings

**Status:** Idea

**Why:** Categories, featured courses and homepage content are fixed in code or created ad hoc.

**Scope:** Manage categories (rename, merge, delete), choose featured courses, and edit homepage
banners and announcements.

## 24. Audit log

**Status:** Idea

**Why:** Payouts and account bans are sensitive; there should be a record of who did what.

**Scope:** Log every super admin action (what, when, from which IP, before and after values),
with a read-only page to browse and filter it.
