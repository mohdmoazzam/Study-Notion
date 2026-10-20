# For students

## 5. Wishlist

**Status:** Idea

**Why:** Students often want to save a course without committing to buy. Today the cart is the
only place to keep courses.

**Scope:** Heart button on course cards and the course page, a Wishlist page in the dashboard,
"Move to cart". Store it on the server so it follows the student across devices (the cart
currently lives only in the browser).

**Touches:** new `wishlist` module on the server, `src/components/core/Dashboard/`, course cards.

## 6. Coupons and discounts

**Status:** Done

**Why:** Launch offers and promotions drive sales.

**Scope:**
- Coupon model: code, percent or fixed amount, expiry, usage limit, optional course or
  instructor restriction.
- "Apply coupon" in the cart. The server recalculates the order amount in `createOrder`, so the
  browser never decides the price.
- Created by instructors (for their own courses) or the super admin (site-wide).

**Touches:** `server/src/modules/payments/payment.service.ts`, cart UI, super admin console.

## 7. Certificates of completion

**Status:** Idea

**Why:** A shareable certificate is one of the strongest reasons to finish a course.

**Scope:**
- Generate a PDF when course progress reaches 100%.
- Each certificate gets a unique id and a public verification page (`/certificates/:id`).
- "Download certificate" in the course player and in Enrolled Courses.

**Touches:** `server/src/modules/progress/`, new `certificates` module, course player.

## 8. Lecture notes and bookmarks

**Status:** Idea

**Why:** Students take notes while watching; keeping them next to the video avoids losing them.

**Scope:** Time-stamped notes per lecture, listed in the player sidebar. Clicking one jumps the
video to that moment. Private to the student.

**Touches:** new `notes` collection, `src/components/core/ViewCourse/`.

## 9. Resume playback position

**Status:** Idea

**Why:** The player resumes at the first unfinished *lecture*, but always from the start of the
video.

**Scope:** Save the current time every few seconds and on pause, and restore it when the
lecture opens. Can live in `CourseProgress` alongside `completedVideos`.

**Touches:** `server/src/modules/progress/`, `src/components/core/ViewCourse/VideoDetails.jsx`.

## 10. Q&A per lecture

**Status:** Idea

**Why:** Students get stuck on specific lectures; a Q&A thread keeps answers where they're needed
and reduces repeat questions.

**Scope:** Questions and threaded answers per lecture. The instructor's answers are highlighted,
answers can be upvoted, and the instructor gets a notification for new questions.

**Touches:** new `discussions` module, course player, instructor dashboard.

## 11. Quizzes and assignments

**Status:** Idea

**Why:** Checks for understanding make courses more effective and give a clearer completion signal.

**Scope:** Multiple-choice quizzes at the end of a section, built in the course builder. Results
count toward progress and the certificate.

**Touches:** course builder (`src/components/core/Dashboard/AddCourse/`), progress module, player.

## 12. Refund requests

**Status:** Idea

**Why:** A clear refund policy builds trust and reduces payment disputes.

**Scope:**
- A rule such as "within 7 days and under 20% watched".
- Students request a refund from Purchase History; the super admin approves it, the refund
  goes through the Razorpay refunds API, and the student is unenrolled.
- Refunded amounts are taken out of the instructor's earnings and available payout balance.

**Touches:** payments module, payouts balance calculation, super admin console.

## 13. Search with filters

**Status:** Idea

**Why:** As the catalog grows, browsing by category alone isn't enough.

**Scope:** Search by course name or instructor, with filters for price range, rating, language
and length, and sorting. All done by the API with query parameters, following the existing
server-side filtering pattern.

**Touches:** `server/src/modules/courses/`, catalog page.
