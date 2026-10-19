import { useEffect, useState } from "react"
import { FaStar } from "react-icons/fa"
import { FiBookOpen, FiDollarSign, FiEdit2, FiExternalLink, FiPlus, FiStar, FiUsers } from "react-icons/fi"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"

import LinkButton from "../../../common/LinkButton"
import { getInstructorData } from "../../../../services/operations/profileAPI"
import { formatAmount, formatPrice } from "../../../../utils/formatPrice"
import { InstructorChart } from "./InstructorChart"

const RECENT_COURSES = 5

export function StatCard({ Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-content-muted">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-selected text-accent">
          <Icon aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-content">{value}</p>
      {hint && <p className="mt-1 text-xs text-content-muted">{hint}</p>}
    </div>
  )
}

function StatusBadge({ status }) {
  const published = status === "Published"
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        published ? "bg-selected text-accent" : "bg-page text-content-muted ring-1 ring-line"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  )
}

function DashboardSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-line" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-line" />
      <div className="h-64 animate-pulse rounded-2xl bg-line" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-selected text-2xl text-accent">
        <FiBookOpen aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-xl font-semibold text-content">Create your first course</h2>
      <p className="mx-auto mt-2 max-w-md text-content-muted">
        Share what you know with students. Add course details, build sections and lectures, then publish when
        you&apos;re ready.
      </p>
      <div className="mt-6">
        <LinkButton to="/dashboard/add-course">
          <FiPlus aria-hidden="true" /> Create course
        </LinkButton>
      </div>
    </div>
  )
}

export const Instructor = () => {
  const { token } = useSelector((state) => state.auth)
  const { user } = useSelector((state) => state.profile)
  // null while loading; [] when the instructor has no courses
  const [courses, setCourses] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    getInstructorData(token).then((result) => {
      if (!active) return
      if (result === null) setFailed(true)
      setCourses(result ?? [])
    })
    return () => {
      active = false
    }
  }, [token])

  const list = courses ?? []
  const totalEarnings = list.reduce((sum, course) => sum + (course.totalAmountGenerated ?? 0), 0)
  const totalStudents = list.reduce((sum, course) => sum + (course.totalStudentsEnrolled ?? 0), 0)
  const published = list.filter((course) => course.status === "Published").length
  const totalReviews = list.reduce((sum, course) => sum + (course.reviews ?? 0), 0)
  const averageRating = totalReviews
    ? list.reduce((sum, course) => sum + (course.rating ?? 0) * (course.reviews ?? 0), 0) / totalReviews
    : 0

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content">Welcome back, {user?.firstName} 👋</h1>
          <p className="mt-1 text-content-muted">Here&apos;s how your courses are doing.</p>
        </div>
        {list.length > 0 && (
          <LinkButton to="/dashboard/add-course" className="self-start sm:self-auto">
            <FiPlus aria-hidden="true" /> Create course
          </LinkButton>
        )}
      </div>

      {courses === null ? (
        <DashboardSkeleton />
      ) : failed ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-content-muted">
          We couldn&apos;t load your dashboard right now. Please refresh the page to try again.
        </div>
      ) : list.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard Icon={FiDollarSign} label="Total earnings" value={formatAmount(totalEarnings)} hint="From all enrollments" />
            <StatCard Icon={FiUsers} label="Total students" value={totalStudents.toLocaleString("en-IN")} hint="Across all courses" />
            <StatCard
              Icon={FiBookOpen}
              label="Courses"
              value={list.length}
              hint={`${published} published · ${list.length - published} ${list.length - published === 1 ? "draft" : "drafts"}`}
            />
            <StatCard
              Icon={FiStar}
              label="Average rating"
              value={totalReviews ? averageRating.toFixed(1) : "-"}
              hint={totalReviews ? `From ${totalReviews} ${totalReviews === 1 ? "review" : "reviews"}` : "No reviews yet"}
            />
          </div>

          <InstructorChart courses={list} />

          <section className="rounded-2xl border border-line bg-surface shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-content">Your courses</h2>
                <p className="text-sm text-content-muted">Most recent first</p>
              </div>
              <Link to="/dashboard/my-courses" className="text-sm font-semibold text-accent hover:underline">
                View all
              </Link>
            </div>

            <ul className="divide-y divide-line">
              {list.slice(0, RECENT_COURSES).map((course) => (
                <li key={course._id} className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <img
                      src={course.thumbnail}
                      alt=""
                      className="h-14 w-24 shrink-0 rounded-lg border border-line bg-page object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-content sm:truncate">{course.courseName}</p>
                        <StatusBadge status={course.status} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-content-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <FiUsers aria-hidden="true" /> {course.totalStudentsEnrolled}{" "}
                          {course.totalStudentsEnrolled === 1 ? "student" : "students"}
                        </span>
                        <span>{formatPrice(course.price)}</span>
                        <span className="font-medium text-content">{formatAmount(course.totalAmountGenerated)} earned</span>
                        {course.reviews > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <FaStar aria-hidden="true" className="text-brand" /> {course.rating.toFixed(1)} ({course.reviews})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Link
                      to={`/dashboard/edit-course/${course._id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-content transition hover:border-content-subtle"
                    >
                      <FiEdit2 aria-hidden="true" /> Edit
                    </Link>
                    {course.status === "Published" && (
                      <Link
                        to={`/courses/${course._id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-accent transition hover:bg-selected"
                      >
                        <FiExternalLink aria-hidden="true" /> View
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
