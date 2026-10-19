# Platform and quality

## 25. Notifications centre

**Status:** Idea

**Why:** Important events (payout paid, new review, announcement, Q&A answer) currently only go
out by email, and emails are failing.

**Scope:** A bell icon in the navbar with unread count, a dropdown and a full page. Notifications
are stored on the server; real-time delivery (WebSocket) is optional, polling is fine to start.

## 26. Dark mode

**Status:** Idea

**Why:** Commonly expected, and easier on the eyes for long viewing sessions.

**Scope:** The groundwork is done: `darkMode: "class"` in `tailwind.config.js`, dark values for
the colour tokens in `src/index.css`, and a `Logo` that swaps automatically. Adding `class="dark"`
to `<html>` already switches the app. What's left: a toggle (for example in the account menu),
remembering the choice, defaulting to the system setting, and checking older pages that still use
fixed colours instead of the tokens.

## 27. Google sign-in

**Status:** Idea

**Why:** Signup currently needs email, password and an OTP, and the OTP depends on email working.

**Scope:** "Continue with Google" on login and signup; link to an existing account with the same
email; students and instructors choose their role on first sign-in.

**Touches:** `server/src/modules/auth/`, login and signup pages.

## 28. Automated tests

**Status:** Idea

**Why:** The repo has no test setup, and payments and payouts handle real money.

**Scope:**
- Server: Vitest or Jest with an in-memory MongoDB, starting with payment verification,
  enrollment, payout balance and the super admin login lockout.
- Frontend: a few end-to-end flows with Playwright (signup, buy a course, request a payout).
- Run them in GitHub Actions on every push.

## 29. Rate limiting and security headers

**Status:** Idea

**Why:** Only the super admin login has brute-force protection. User login, OTP sending and
password reset requests have no limits.

**Scope:** Per-IP and per-email limits on login, OTP and reset endpoints (for example with
`express-rate-limit`), plus `helmet` for security headers.

**Touches:** `server/src/app.ts`, `server/src/modules/auth/auth.routes.ts`.

## 30. Video streaming (HLS)

**Status:** Idea

**Why:** Lectures are served as single MP4 files, which load slowly on poor connections and are
easy to download.

**Scope:** Use Cloudinary's adaptive streaming (HLS) profiles and a player that supports it, with
signed, short-lived video URLs for enrolled students.

**Touches:** `server/src/modules/courses/subSection.service.ts`, `server/src/lib/cloudinary.ts`,
the course player.
