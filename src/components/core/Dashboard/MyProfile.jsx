import {
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiChevronRight,
  FiEdit2,
  FiGrid,
  FiMail,
  FiPhone,
  FiPlusCircle,
  FiSettings,
  FiShoppingCart,
  FiUser,
  FiUsers,
} from "react-icons/fi"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"

import LinkButton from "../../common/LinkButton"
import { ACCOUNT_TYPE } from "../../../utils/constants"
import { formattedDate, getCreatedAt } from "../../../utils/dateFormatter"

// Deep links into Settings: scroll to the section and focus the field.
const SETTINGS = "/dashboard/settings"
const settingsLink = { photo: `${SETTINGS}#profile-photo`, details: `${SETTINGS}#personal-info` }
const focusLink = (fieldId) => `${SETTINGS}?focus=${fieldId}#personal-info`

const QUICK_ACTIONS = {
  [ACCOUNT_TYPE.STUDENT]: [
    { to: "/dashboard/enrolled-courses", label: "Enrolled courses", description: "Continue where you left off", Icon: FiBookOpen },
    { to: "/dashboard/cart", label: "Cart", description: "Courses you saved to buy", Icon: FiShoppingCart },
    { to: SETTINGS, label: "Settings", description: "Profile, photo and password", Icon: FiSettings },
  ],
  [ACCOUNT_TYPE.INSTRUCTOR]: [
    { to: "/dashboard/instructor", label: "Dashboard", description: "Students and earnings", Icon: FiGrid },
    { to: "/dashboard/my-courses", label: "My courses", description: "Edit and publish courses", Icon: FiBookOpen },
    { to: "/dashboard/add-course", label: "Add course", description: "Create a new course", Icon: FiPlusCircle },
  ],
}

const hasValue = (value) => (typeof value === "string" ? value.trim().length > 0 : Boolean(value))

function Card({ title, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-6 shadow-sm ${className}`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-content">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function EditLink({ to }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-accent transition hover:bg-selected"
    >
      <FiEdit2 aria-hidden="true" /> Edit
    </Link>
  )
}

function DetailRow({ Icon, label, value, addLink, className = "" }) {
  const filled = hasValue(value)
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-page text-content-muted">
        <Icon aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-content-subtle">{label}</dt>
        <dd className="mt-0.5 break-words">
          {filled ? (
            <span className="font-medium text-content">{value}</span>
          ) : addLink ? (
            <Link to={addLink} className="text-sm font-semibold text-accent hover:underline">
              + Add
            </Link>
          ) : (
            <span className="text-content-subtle">Not added</span>
          )}
        </dd>
      </div>
    </div>
  )
}

const MyProfile = () => {
  const { user } = useSelector((state) => state.profile)
  const details = user?.additionalDetails ?? {}
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ")
  const isInstructor = user?.accountType === ACCOUNT_TYPE.INSTRUCTOR
  const courseCount = user?.courses?.length ?? 0
  const memberSince = getCreatedAt(user)?.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const hasCustomPhoto = hasValue(user?.image) && !user.image.includes("dicebear")

  // Profile completeness: every missing item links straight to its field in Settings.
  const checklist = [
    { done: hasCustomPhoto, label: "Upload a profile photo", to: settingsLink.photo },
    { done: hasValue(details.about), label: "Add a bio", to: focusLink("about") },
    { done: hasValue(details.contactNumber), label: "Add phone number", to: focusLink("contactNumber") },
    { done: hasValue(details.dateOfBirth), label: "Add date of birth", to: focusLink("dateOfBirth") },
    { done: hasValue(details.gender), label: "Add gender", to: focusLink("gender") },
  ]
  const completion = Math.round((checklist.filter((item) => item.done).length / checklist.length) * 100)
  const missing = checklist.filter((item) => !item.done)

  const stats = [
    { Icon: isInstructor ? FiUsers : FiBookOpen, label: isInstructor ? "Courses created" : "Enrolled courses", value: courseCount },
    { Icon: FiCalendar, label: "Member since", value: memberSince ?? "-" },
  ]

  const quickActions = QUICK_ACTIONS[user?.accountType] ?? [QUICK_ACTIONS[ACCOUNT_TYPE.STUDENT][2]]

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-content">My profile</h1>
        <p className="mt-1 text-content-muted">Your public details and account overview.</p>
      </div>

      {/* Header: banner, then avatar overlapping it, then name and actions below the banner */}
      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="relative isolate h-24 overflow-hidden sm:h-32">
          <div aria-hidden="true" className="notebook-grid absolute inset-0 -z-10" />
          <div aria-hidden="true" className="absolute -right-10 -top-16 -z-10 h-56 w-56 rounded-full bg-brand/30 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-20 left-1/4 -z-10 h-40 w-72 rounded-full bg-blue-100/20 blur-3xl" />
        </div>

        <div className="px-6 pb-6 sm:px-8">
          <Link to={settingsLink.photo} aria-label="Change profile photo" className="-mt-12 inline-block rounded-full">
            <img
              src={user?.image}
              alt=""
              className="h-24 w-24 rounded-full border-4 border-surface bg-surface object-cover shadow-md transition hover:opacity-90"
            />
          </Link>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="break-words text-2xl font-bold tracking-tight text-content">{fullName}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-content-muted">
                {user?.accountType && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-selected px-2.5 py-0.5 text-xs font-semibold text-accent">
                    <FiUser aria-hidden="true" /> {user.accountType}
                  </span>
                )}
                {completion === 100 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-page px-2.5 py-0.5 text-xs font-semibold text-content-muted ring-1 ring-line">
                    <FiCheckCircle aria-hidden="true" className="text-accent" /> Profile complete
                  </span>
                )}
                <span className="inline-flex min-w-0 items-center gap-1.5 break-all">
                  <FiMail aria-hidden="true" className="shrink-0" /> {user?.email}
                </span>
              </div>
            </div>
            <LinkButton to={settingsLink.details} variant="secondary" className="shrink-0 self-start">
              <FiEdit2 aria-hidden="true" /> Edit profile
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Stats */}
      <dl className="grid gap-4 sm:grid-cols-2">
        {stats.map(({ Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-selected text-lg text-accent">
              <Icon aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-col-reverse">
              <dt className="text-sm text-content-muted">{label}</dt>
              <dd className="text-xl font-bold text-content">{value}</dd>
            </div>
          </div>
        ))}
      </dl>

      {/* Profile completion (only while something is missing) */}
      {missing.length > 0 && (
        <Card
          title="Complete your profile"
          action={<span className="text-sm font-semibold text-accent">{completion}% done</span>}
        >
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${completion}%` }} />
          </div>
          <p className="mt-3 text-sm text-content-muted">
            A complete profile helps {isInstructor ? "students trust you as an instructor" : "instructors and classmates know you"}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {missing.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-page px-3 py-1.5 text-sm font-medium text-content transition hover:border-brand hover:bg-selected"
              >
                <FiPlusCircle aria-hidden="true" className="text-accent" /> {label}
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Details + About: side by side only when there is room */}
      <div className="grid gap-6 xl:grid-cols-5">
        <Card title="Personal details" action={<EditLink to={settingsLink.details} />} className="xl:col-span-3">
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailRow Icon={FiUser} label="First name" value={user?.firstName} />
            <DetailRow Icon={FiUser} label="Last name" value={user?.lastName} />
            <DetailRow Icon={FiMail} label="Email" value={user?.email} className="sm:col-span-2" />
            <DetailRow Icon={FiPhone} label="Phone" value={details.contactNumber} addLink={focusLink("contactNumber")} />
            <DetailRow
              Icon={FiCalendar}
              label="Date of birth"
              value={formattedDate(details.dateOfBirth)}
              addLink={focusLink("dateOfBirth")}
            />
            <DetailRow Icon={FiUser} label="Gender" value={details.gender} addLink={focusLink("gender")} />
          </dl>
        </Card>

        <Card title="About" action={<EditLink to={focusLink("about")} />} className="xl:col-span-2">
          {hasValue(details.about) ? (
            <p className="whitespace-pre-line break-words leading-relaxed text-content">{details.about}</p>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-page p-5 text-center">
              <p className="text-sm text-content-muted">Tell others a little about yourself.</p>
              <Link to={focusLink("about")} className="mt-2 inline-block text-sm font-semibold text-accent hover:underline">
                Write a bio
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-content">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map(({ to, label, description, Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-selected text-lg text-accent">
                <Icon aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-content">{label}</span>
                <span className="block text-sm text-content-muted">{description}</span>
              </span>
              <FiChevronRight
                aria-hidden="true"
                className="shrink-0 text-content-subtle transition group-hover:translate-x-0.5 group-hover:text-accent"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MyProfile
