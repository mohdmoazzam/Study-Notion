# StudyNotion

StudyNotion is a full-stack ed-tech platform where instructors publish video courses and students discover, buy, and learn from them. It is built with a React + Redux frontend and a TypeScript, Express, and MongoDB backend.

## Features

### For students
- **Browse the catalog**: explore courses by category, see top-selling courses, and read ratings and reviews.
- **Course pages**: view the curriculum, total duration, instructor details, and average rating before buying.
- **Cart and checkout**: add courses to a cart and pay securely with **Razorpay**.
- **Learn**: watch lectures in a built-in video player with a section-by-section sidebar.
- **Track progress**: mark lectures as complete and see per-course progress on the dashboard.
- **Rate and review**: leave a star rating and review for courses you are enrolled in.

### For instructors
- **Course builder**: create a course in steps (details and thumbnail, then sections and video lectures, then publish).
- **Manage courses**: edit, publish or unpublish (draft), and delete your courses.
- **Instructor dashboard**: charts of students enrolled and revenue per course.

### Accounts and platform
- **Sign up with email OTP verification**, then log in with JWT-based authentication.
- **Password reset** by email link, and password change from settings.
- **Profile management**: update personal details and upload a profile picture.
- **Role-based access** for Student, Instructor, and Admin. Admins create course categories.
- **Transactional emails** for OTP, enrollment, payment receipts, password updates, and the contact form.
- **Media storage** on Cloudinary for thumbnails, avatars, and lecture videos.

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Redux Toolkit, React Router 6, Tailwind CSS, React Hook Form, Chart.js, Swiper, video-react |
| Backend | Node.js, Express 4, TypeScript |
| Database | MongoDB with Mongoose |
| Auth | JWT, bcrypt, email OTP |
| Services | Razorpay (payments), Cloudinary (media), Nodemailer (email) |

## Project structure

```
StudyNotion/
├── src/                  # React frontend
│   ├── pages/            # Route-level pages (Home, Catalog, Dashboard, ViewCourse, ...)
│   ├── components/       # UI components grouped by feature
│   ├── services/         # API endpoints and API call functions
│   └── slices/           # Redux state (auth, profile, cart, course, viewCourse)
└── server/               # Express + TypeScript backend
    └── src/
        ├── config/       # Environment configuration
        ├── lib/          # Database, Cloudinary, Razorpay, and mailer clients
        ├── emails/       # HTML email templates
        ├── shared/       # Errors, middleware (auth, errors, uploads), helpers
        └── modules/      # One folder per feature: auth, users, courses,
                          # categories, reviews, progress, payments, contact
```

Each backend module contains its own `model`, `service` (business logic), `controller` (HTTP handling), and `routes` files.

## Getting started

### Prerequisites
- Node.js 18 or later
- A MongoDB database (for example, a free MongoDB Atlas cluster)
- Accounts for [Cloudinary](https://cloudinary.com), [Razorpay](https://razorpay.com) (test mode works), and an SMTP email provider (for example, a Gmail app password)

### 1. Clone and install

```sh
git clone https://github.com/mohdmoazzam/Study-Notion.git
cd Study-Notion
npm install
cd server && npm install && cd ..
```

### 2. Configure environment variables

Create `.env` in the project root (frontend):

```env
REACT_APP_BASE_URL=http://localhost:4000/api/v1
RAZORPAY_KEY=your_razorpay_key_id
```

Create `server/.env` (backend):

```env
PORT=4000
MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/studyNotion-db
JWT_SECRET=a_long_random_secret

MAIL_HOST=smtp.gmail.com
MAIL_USER=you@example.com
MAIL_PASS=your_app_password

CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
FOLDER_NAME=StudyNotion

RAZORPAY_KEY=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_key_secret
```

Optional backend settings:

| Variable | Purpose | Default |
|---|---|---|
| `CLIENT_URL` | Comma-separated frontend URLs allowed by CORS; the first is also used in password-reset links | Any origin allowed; links use `http://localhost:3000` |
| `CONTACT_INBOX` | Address that receives contact-form messages | Project owner's address |
| `NODE_ENV` | Set to `production` for secure, cross-site auth cookies | `development` |
| `DNS_SERVERS` | DNS servers for the backend to use, e.g. `8.8.8.8,1.1.1.1`, if your network can't resolve `mongodb+srv://` addresses | System DNS |
| `GOOGLE_CLIENT_ID` | OAuth client ID for "Sign in with Google" (set the same value as `REACT_APP_GOOGLE_CLIENT_ID` in the frontend `.env`) | Google sign-in disabled |
| `REDIS_URL` | Redis for the notification queue (BullMQ, with retries) and for pushing in-app notifications across server instances, e.g. an Upstash `rediss://` URL | Notifications are delivered in-process |
| `RAZORPAY_WEBHOOK_SECRET` | Secret of the Razorpay webhook pointed at `<backend>/api/v1/payment/webhook` (events: `order.paid`, `payment.captured`). Enrolls students even if their browser closes before checkout finishes | Webhook disabled (returns 503) |

To enable Google sign-in, create an OAuth client ID of type **Web application** in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and add your frontend URLs (e.g. `http://localhost:3000`) under **Authorized JavaScript origins**. No client secret is needed.

### 3. Run in development

From the project root, start the frontend and backend together:

```sh
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

### 4. Create an admin (optional)

Sign-up only creates Student and Instructor accounts. To create categories, sign up normally, then set that user's `accountType` to `"Admin"` in the `users` collection of your database.

## Scripts

| Location | Command | Description |
|---|---|---|
| root | `npm run dev` | Run frontend and backend together |
| root | `npm start` | Run the frontend only |
| root | `npm run build` | Production build of the frontend |
| `server/` | `npm run dev` | Run the backend with live reload |
| `server/` | `npm run build` | Compile the backend to `server/dist` |
| `server/` | `npm start` | Run the compiled backend |
| `server/` | `npm run typecheck` | Type-check the backend |

## API overview

All endpoints are served under `/api/v1`.

| Base path | Purpose |
|---|---|
| `/auth` | Sign-up, OTP, login, password change and reset |
| `/profile` | User details, profile picture, enrolled courses, instructor dashboard, account deletion |
| `/course` | Courses, sections, lectures, categories, ratings and reviews, lecture progress |
| `/payment` | Create a Razorpay order, verify the payment and enroll, send a payment receipt |
| `/reach` | Contact form |

Protected endpoints expect an `Authorization: Bearer <token>` header.

## Deployment

**Backend** (for example on Render or Railway):
- Root directory: `server`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Set the environment variables listed above, plus `NODE_ENV=production`.

**Frontend** (for example on Vercel or Netlify):
- Build command: `npm run build`
- Output directory: `build`
- Set `REACT_APP_BASE_URL` to your deployed backend URL followed by `/api/v1`.

## Author

**Mohd Moazzam**: [GitHub](https://github.com/mohdmoazzam)
