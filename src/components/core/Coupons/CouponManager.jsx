import copy from "copy-to-clipboard"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import { FiChevronLeft, FiChevronRight, FiCopy, FiPlus, FiSearch, FiTag, FiTrash2 } from "react-icons/fi"
import { useSearchParams } from "react-router-dom"

import { formattedDate } from "../../../utils/dateFormatter"
import { formatAmount } from "../../../utils/formatPrice"
import Dialog from "../../common/Dialog"
import { inputClass, primaryButtonClass, secondaryButtonClass } from "../../common/formUi"
import CreateCouponDialog from "./CreateCouponDialog"

// Filters live in the URL and are applied by the API.
const STATUS_TABS = [
  { key: "", label: "All", count: "all" },
  { key: "active", label: "Active", count: "active" },
  { key: "inactive", label: "Inactive", count: "inactive" },
]
const SEARCH_DELAY_MS = 300

const STATE_STYLES = {
  active: { label: "Active", className: "bg-selected text-accent" },
  disabled: { label: "Disabled", className: "bg-page text-content-muted ring-1 ring-line" },
  expired: { label: "Expired", className: "bg-danger/10 text-danger" },
  usedUp: { label: "Limit reached", className: "bg-brand/15 text-content" },
}

const fullName = (user) => (user ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "")

const describeDiscount = ({ discountType, value }) => (discountType === "percent" ? `${value}% off` : `${formatAmount(value)} off`)

const describeScope = (coupon, isAdmin) => {
  const courseNames = (coupon.courses ?? []).map((course) => course?.courseName).filter(Boolean)
  if (courseNames.length) return courseNames.join(", ")
  if (isAdmin && coupon.instructor) return `All courses by ${fullName(coupon.instructor) || coupon.instructor.email}`
  return isAdmin ? "All courses" : "All your courses"
}

function CouponRow({ coupon, isAdmin, busy, onToggle, onDelete }) {
  const state = STATE_STYLES[coupon.state] ?? STATE_STYLES.active

  return (
    <li className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg font-semibold text-content">{coupon.code}</span>
          <button
            type="button"
            onClick={() => {
              copy(coupon.code)
              toast.success("Code copied")
            }}
            aria-label={`Copy ${coupon.code}`}
            className="rounded p-1 text-content-subtle transition hover:bg-selected hover:text-accent"
          >
            <FiCopy aria-hidden="true" />
          </button>
          <span className="rounded-full bg-page px-2.5 py-0.5 text-xs font-semibold text-content ring-1 ring-line">{describeDiscount(coupon)}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${state.className}`}>{state.label}</span>
        </div>
        <p className="mt-1 break-words text-sm text-content-muted">Applies to: {describeScope(coupon, isAdmin)}</p>
        <p className="mt-1 text-xs text-content-subtle">
          Used {coupon.usedCount}
          {coupon.usageLimit ? ` of ${coupon.usageLimit}` : coupon.usedCount === 1 ? " time" : " times"} ·{" "}
          {coupon.expiresAt ? `Expires ${formattedDate(coupon.expiresAt)}` : "No expiry"}
          {coupon.showOnCoursePage === false && " · Private (not shown on course pages)"}
          {isAdmin && ` · Created by ${coupon.owner ? fullName(coupon.owner) || coupon.owner.email : "super admin"}`}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <button type="button" disabled={busy} onClick={() => onToggle(coupon)} className={`${secondaryButtonClass} px-3 py-1.5 text-sm`}>
          {coupon.active ? "Disable" : "Enable"}
        </button>
        {coupon.usedCount === 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(coupon)}
            aria-label={`Delete ${coupon.code}`}
            className="inline-flex items-center justify-center rounded-lg border border-line px-3 py-1.5 text-content-muted transition hover:border-danger hover:text-danger disabled:opacity-60"
          >
            <FiTrash2 aria-hidden="true" />
          </button>
        )}
      </div>
    </li>
  )
}

// Coupon list with status tabs, code search, paging and create / enable / disable / delete.
// `api` holds { list, create, setActive, remove }; each resolves to null/false on failure.
// Shared by the instructor dashboard (their own coupons) and the super admin console (`isAdmin`, every coupon).
export default function CouponManager({ api, isAdmin = false, courses, title, description }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = STATUS_TABS.some(({ key }) => key && key === searchParams.get("status")) ? searchParams.get("status") : ""
  const search = searchParams.get("q") ?? ""
  const page = Math.max(1, Number.parseInt(searchParams.get("page"), 10) || 1)

  const [searchInput, setSearchInput] = useState(search)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [creating, setCreating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
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

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === search) return undefined
    const timer = setTimeout(() => updateParams({ q: trimmed, page: "" }), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [searchInput, search, updateParams])

  useEffect(() => {
    const id = ++requestId.current
    setLoading(true)
    api.list({ status: status || undefined, search: search || undefined, page }).then((data) => {
      if (id !== requestId.current) return // a newer request superseded this one
      setFailed(data === null)
      if (data) setResult(data)
      setLoading(false)
    })
  }, [api, status, search, page, reloadKey])

  // Deleting the last coupon on a page can leave us past the final page.
  useEffect(() => {
    if (result && page > result.totalPages) updateParams({ page: result.totalPages > 1 ? String(result.totalPages) : "" })
  }, [result, page, updateParams])

  const reload = () => setReloadKey((key) => key + 1)
  const closeCreate = useCallback(() => setCreating(false), [])
  const closeDelete = useCallback(() => setPendingDelete(null), [])

  const submitCoupon = async (body) => {
    setSubmitting(true)
    const created = await api.create(body)
    setSubmitting(false)
    if (created) {
      setCreating(false)
      reload()
    }
  }

  const toggle = async (coupon) => {
    setBusyId(coupon._id)
    const done = await api.setActive(coupon._id, !coupon.active)
    setBusyId(null)
    if (done) reload()
  }

  const confirmDelete = async () => {
    setBusyId(pendingDelete._id)
    const done = await api.remove(pendingDelete._id)
    setBusyId(null)
    if (done) {
      setPendingDelete(null)
      reload()
    }
  }

  const counts = result?.counts ?? {}
  const coupons = result?.coupons ?? []
  const totalPages = result?.totalPages ?? 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content">{title}</h1>
          <p className="mt-1 text-content-muted">{description}</p>
        </div>
        <button type="button" onClick={() => setCreating(true)} className={`${primaryButtonClass} self-start text-sm sm:self-auto`}>
          <FiPlus aria-hidden="true" /> Create coupon
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div role="tablist" aria-label="Filter by status" className="flex shrink-0 overflow-x-auto rounded-xl border border-line bg-surface p-1">
          {STATUS_TABS.map(({ key, label, count }) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={status === key}
              onClick={() => updateParams({ status: key, page: "" })}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                status === key ? "bg-brand text-on-brand" : "text-content-muted hover:text-content"
              }`}
            >
              {label}
              <span className={`text-xs ${status === key ? "opacity-80" : "text-content-subtle"}`}>{counts[count] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <FiSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by code"
            aria-label="Search by code"
            maxLength={20}
            className={`${inputClass()} pl-9`}
          />
        </div>
      </div>

      {failed && (
        <p role="alert" className="rounded-lg bg-danger/10 px-4 py-2 text-sm font-medium text-danger">
          Couldn&apos;t load coupons.{" "}
          <button type="button" onClick={reload} className="underline">
            Try again
          </button>
        </p>
      )}

      {result === null ? (
        !failed && <div aria-hidden="true" className="h-64 animate-pulse rounded-2xl bg-line" />
      ) : (
        <div aria-busy={loading} className={`transition-opacity ${loading ? "pointer-events-none opacity-60" : ""}`}>
          {coupons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-selected text-xl text-accent">
                <FiTag aria-hidden="true" />
              </span>
              <p className="mt-3 font-semibold text-content">
                {search ? `No coupons matching "${search}"` : status ? "No coupons here" : "No coupons yet"}
              </p>
              {!search && !status && (
                <p className="mt-1 text-sm text-content-muted">Create one for a launch offer or promotion.</p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-surface shadow-sm">
              {coupons.map((coupon) => (
                <CouponRow
                  key={coupon._id}
                  coupon={coupon}
                  isAdmin={isAdmin}
                  busy={busyId === coupon._id}
                  onToggle={toggle}
                  onDelete={setPendingDelete}
                />
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateParams({ page: page - 1 > 1 ? String(page - 1) : "" })}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-content disabled:opacity-40"
              >
                <FiChevronLeft aria-hidden="true" /> Previous
              </button>
              <span className="text-sm text-content-muted">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-content disabled:opacity-40"
              >
                Next <FiChevronRight aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      )}

      {creating && (
        <CreateCouponDialog isAdmin={isAdmin} courses={courses} submitting={submitting} onSubmit={submitCoupon} onClose={closeCreate} />
      )}

      {pendingDelete && (
        <Dialog
          id="delete-coupon"
          Icon={FiTrash2}
          tone="danger"
          title={`Delete ${pendingDelete.code}?`}
          busy={busyId === pendingDelete._id}
          onClose={closeDelete}
          actions={
            <>
              <button type="button" onClick={closeDelete} className={`${secondaryButtonClass} text-sm`}>
                Keep it
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busyId === pendingDelete._id}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                Delete coupon
              </button>
            </>
          }
        >
          <p className="text-sm text-content-muted">Nobody has used this code yet. Students won&apos;t be able to apply it any more.</p>
        </Dialog>
      )}
    </div>
  )
}
