# For instructors

## 14. Earnings analytics

**Status:** Idea

**Why:** The dashboard shows totals, but not trends or where students drop off.

**Scope:**
- Revenue over time (day / week / month) and per course, built from the new `Payment` records.
- Conversion from course page views to purchases (needs a view counter).
- Per-lecture drop-off from `CourseProgress`: where students stop watching.

**Touches:** `server/src/modules/users/profile.service.ts` (dashboard), payments, instructor dashboard UI.

## 15. Course announcements

**Status:** Idea

**Why:** Instructors need a way to tell enrolled students about new lectures, updates or live sessions.

**Scope:** Write an announcement per course; it's emailed to enrolled students and shown in the
course player and notifications.

**Touches:** new `announcements` module, mailer, course player.

## 16. Reply to reviews

**Status:** Idea

**Why:** Public replies show students the instructor is engaged and let them address criticism.

**Scope:** One instructor reply per review, shown under the review on the course page.

**Touches:** `server/src/modules/reviews/`, `src/components/core/course/CourseReviews.jsx`.

## 17. Saved payout details

**Status:** Idea

**Why:** Instructors re-enter their UPI ID or bank details for every withdrawal.

**Scope:** Save one or more payout methods (IFSC already verified at save time) and pick one when
requesting a withdrawal. Keep the masking of account numbers in responses.

**Touches:** `server/src/modules/payouts/`, `src/components/core/Dashboard/Payouts/WithdrawDialog.jsx`.

## 18. Course preview and scheduled publishing

**Status:** Idea

**Why:** Instructors can't see the course exactly as a student would before publishing, and
can't plan a launch date.

**Scope:** "Preview as student" from the course builder, and an optional publish date and time
(a scheduled job flips the status to Published).

**Touches:** course builder, `server/src/modules/courses/`, a scheduler (cron on Render or a
lightweight job runner).
