# Fix or finish first

Gaps that already affect users. These come before new features.

## 1. Working emails

**Status:** Idea

**Why:** Every email currently fails. Gmail rejects the `MAIL_PASS` credentials
("Username and Password not accepted"). That breaks signup OTPs, password reset,
enrollment confirmations, payment receipts and payout updates.

**Scope:**
- Short term: create a Gmail App Password and set it as `MAIL_PASS` locally and on Render.
- Better: move to a transactional provider (Resend, Brevo, Postmark) for deliverability,
  bounce handling and higher sending limits.
- Add a startup check that logs clearly when mail credentials are rejected.

**Touches:** `server/src/lib/mailer.ts`, `server/src/config/env.ts`, Render environment variables.

## 2. Update-password page redesign

**Status:** Idea

**Why:** It's the second half of the password reset flow and still uses the old styling, while
the forgot-password page has been redesigned. Reset links expire after 5 minutes, but the page
gives no clear message when a link has expired.

**Scope:**
- Match the forgot-password card design.
- Password strength meter and show/hide toggles.
- Clear "This link has expired" state with a button to request a new one.
- Success screen that leads to the login page.

**Touches:** `src/pages/UpdatePassword.jsx`, `src/services/operations/authAPI.js`.

## 3. Mobile navbar

**Status:** Idea

**Why:** On phones the logo shrinks and the navigation links wrap onto two lines. Logged-out
visitors can't reach Log in / Sign up from the header.

**Scope:** Hamburger menu with the main links, catalog, and Log in / Sign up (or the account
menu when logged in).

**Touches:** `src/components/common/Navbar.jsx`.

## 4. Razorpay payment webhooks

**Status:** Idea

**Why:** Enrollment only happens when the browser returns from Razorpay and calls
`/payment/verifyPayment`. If the student closes the tab or loses connection right after paying,
they're charged but not enrolled.

**Scope:**
- `POST /payment/webhook` that verifies Razorpay's webhook signature and handles
  `payment.captured` / `order.paid`.
- Reuse `enrollStudent` and `recordPayment`. Both are already idempotent, so the browser flow
  and the webhook can both run safely.
- Configure the webhook URL and secret in the Razorpay dashboard and on Render.

**Touches:** `server/src/modules/payments/`, `server/src/config/env.ts`.
