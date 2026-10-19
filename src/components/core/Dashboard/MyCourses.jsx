import { useCallback, useEffect, useRef, useState } from "react"
import { FiBookOpen, FiPlus, FiSearch, FiX } from "react-icons/fi"
import { useSelector } from "react-redux"
import { useSearchParams } from "react-router-dom"

import { deleteCourse, fetchInstructorCourses } from "../../../services/operations/courseDetailsAPI"
import { inputClass } from "../../common/formUi"
import LinkButton from "../../common/LinkButton"
import CourseRow from "./InstructorCourses/CourseRow"
import DeleteCourseDialog from "./InstructorCourses/DeleteCourseDialog"

// Status, search and sort are applied by the API; they live in the URL so reloads and back/forward keep them.
const STATUS_TABS = [
  { key: "", label: "All", count: "all" },
  { key: "Published", label: "Published", count: "Published" },
  { key: "Draft", label: "Drafts", count: "Draft" },
]
const SORTS = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "students", label: "Most students" },
  { key: "name", label: "Name (A–Z)" },
]
const SEARCH_DELAY_MS = 300

function ListSkeleton() {
  return (
    <ul aria-hidden="true" className="space-y-4">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-44 animate-pulse rounded-2xl bg-line" />
      ))}
    </ul>
  )
}

function Notice({ title, children, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-selected text-2xl text-accent">
        <FiBookOpen aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-xl font-semibold text-content">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-content-muted">{children}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

const MyCourses = () => {
  const { token } = useSelector((state) => state.auth)
  const [searchParams, setSearchParams] = useSearchParams()
  const status = STATUS_TABS.some(({ key }) => key && key === searchParams.get("status")) ? searchParams.get("status") : ""
  const sort = SORTS.some(({ key }) => key === searchParams.get("sort")) ? searchParams.get("sort") : "newest"
  const search = searchParams.get("q") ?? ""

  const [searchInput, setSearchInput] = useState(search)
  // null until the first response; afterwards the last successful result stays visible while refetching
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const requestId = useRef(0)

  const updateParams = useCallback(
    (changes) =>
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
          return next
        },
        { replace: true }
      ),
    [setSearchParams]
  )

  // Debounce typing before it reaches the URL (and therefore the API).
  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === search) return undefined
    const timer = setTimeout(() => updateParams({ q: trimmed }), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [searchInput, search, updateParams])

  useEffect(() => {
    const id = ++requestId.current
    setLoading(true)
    fetchInstructorCourses(token, { status: status || undefined, search: search || undefined, sort }).then((data) => {
      if (id !== requestId.current) return // a newer request superseded this one
      setFailed(data === null)
      if (data) setResult(data)
      setLoading(false)
    })
  }, [token, status, search, sort, reloadKey])

  const closeDialog = useCallback(() => setPendingDelete(null), [])

  const confirmDelete = async () => {
    setDeleting(true)
    const deleted = await deleteCourse({ courseId: pendingDelete._id }, token)
    setDeleting(false)
    if (deleted) {
      setPendingDelete(null)
      setReloadKey((key) => key + 1) // refresh the list and the tab counts
    }
  }

  const clearFilters = () => {
    setSearchInput("")
    updateParams({ q: "", status: "" })
  }

  const courses = result?.courses ?? []
  const counts = result?.counts
  const hasNoCourses = counts?.all === 0 && !search
  const filtersActive = Boolean(status || search)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content">My courses</h1>
          <p className="mt-1 text-content-muted">Create, edit and publish your courses.</p>
        </div>
        <LinkButton to="/dashboard/add-course" className="self-start sm:self-auto">
          <FiPlus aria-hidden="true" /> Create course
        </LinkButton>
      </div>

      {result === null ? (
        failed ? (
          <Notice
            title="Couldn't load your courses"
            action={
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="text-sm font-semibold text-accent hover:underline"
              >
                Try again
              </button>
            }
          >
            Check your connection and try again.
          </Notice>
        ) : (
          <ListSkeleton />
        )
      ) : hasNoCourses ? (
        <Notice
          title="Create your first course"
          action={
            <LinkButton to="/dashboard/add-course">
              <FiPlus aria-hidden="true" /> Create course
            </LinkButton>
          }
        >
          Share what you know with students. Add course details, build sections and lectures, then publish when
          you&apos;re ready.
        </Notice>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div role="tablist" aria-label="Filter by status" className="flex shrink-0 rounded-xl border border-line bg-surface p-1">
              {STATUS_TABS.map(({ key, label, count }) => (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={status === key}
                  onClick={() => updateParams({ status: key })}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition lg:flex-none ${
                    status === key ? "bg-brand text-on-brand" : "text-content-muted hover:text-content"
                  }`}
                >
                  {label}
                  <span className={`text-xs ${status === key ? "opacity-80" : "text-content-subtle"}`}>
                    {counts?.[count] ?? 0}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-1 gap-3">
              <div className="relative flex-1">
                <FiSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search your courses"
                  aria-label="Search your courses"
                  maxLength={100}
                  className={`${inputClass()} pl-9`}
                />
              </div>
              <select
                value={sort}
                onChange={(event) => updateParams({ sort: event.target.value === "newest" ? "" : event.target.value })}
                aria-label="Sort courses"
                className={`${inputClass()} !w-auto shrink-0`}
              >
                {SORTS.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {failed && (
            <p role="alert" className="rounded-lg bg-danger/10 px-4 py-2 text-sm font-medium text-danger">
              Couldn&apos;t update the list.{" "}
              <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="underline">
                Try again
              </button>
            </p>
          )}

          <div aria-busy={loading} className={`transition-opacity ${loading ? "pointer-events-none opacity-60" : ""}`}>
            {courses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
                <p className="font-semibold text-content">
                  {search ? `No courses match "${search}"` : `No ${status === "Draft" ? "drafts" : "published courses"} yet`}
                </p>
                {filtersActive && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                  >
                    <FiX aria-hidden="true" /> Clear filters
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-4">
                {courses.map((course) => (
                  <CourseRow key={course._id} course={course} onDelete={setPendingDelete} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {pendingDelete && (
        <DeleteCourseDialog course={pendingDelete} deleting={deleting} onConfirm={confirmDelete} onCancel={closeDialog} />
      )}
    </div>
  )
}

export default MyCourses
