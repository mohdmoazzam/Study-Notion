import { useState } from "react"
import { FiTag } from "react-icons/fi"

import Dialog from "../../common/Dialog"
import { Field, inputClass, primaryButtonClass, secondaryButtonClass } from "../../common/formUi"

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,19}$/
const OBJECT_ID = /[0-9a-f]{24}/gi

// Who can use it. Instructors pick from their own courses; the super admin can also limit a
// coupon to one instructor (by email) or to courses pasted as links or ids.
const scopesFor = (isAdmin) =>
  isAdmin
    ? [
        { key: "all", label: "All courses" },
        { key: "instructor", label: "One instructor" },
        { key: "courses", label: "Specific courses" },
      ]
    : [
        { key: "all", label: "All my courses" },
        { key: "courses", label: "Selected courses" },
      ]

const todayInputValue = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const validate = (form, { isAdmin }) => {
  const errors = {}
  if (!CODE_PATTERN.test(form.code)) errors.code = "3-20 letters or numbers (- and _ allowed)"
  const value = Number(form.value)
  if (form.discountType === "percent" && !(Number.isInteger(value) && value >= 1 && value <= 100)) {
    errors.value = "A whole number from 1 to 100"
  }
  if (form.discountType === "fixed" && !(Number.isFinite(value) && value >= 1)) errors.value = "At least ₹1"
  if (form.usageLimit && !(Number.isInteger(Number(form.usageLimit)) && Number(form.usageLimit) >= 1)) {
    errors.usageLimit = "A whole number of at least 1"
  }
  if (form.scope === "instructor" && !/^\S+@\S+\.\S+$/.test(form.instructorEmail.trim())) {
    errors.instructorEmail = "Enter the instructor's email"
  }
  if (form.scope === "courses") {
    const count = isAdmin ? (form.courseText.match(OBJECT_ID) ?? []).length : form.courseIds.length
    if (count === 0) errors.courses = isAdmin ? "Paste at least one course link or id" : "Pick at least one course"
  }
  return errors
}

// Form for a new coupon. `courses` (instructors only) are the courses the coupon can be limited to.
export default function CreateCouponDialog({ isAdmin, courses = [], submitting, onSubmit, onClose }) {
  const [form, setForm] = useState({
    code: "",
    discountType: "percent",
    value: "",
    expiresOn: "",
    usageLimit: "",
    scope: "all",
    instructorEmail: "",
    courseIds: [],
    courseText: "",
    showOnCoursePage: true,
  })
  const [errors, setErrors] = useState({})
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const toggleCourse = (id) =>
    set("courseIds", form.courseIds.includes(id) ? form.courseIds.filter((item) => item !== id) : [...form.courseIds, id])

  const submit = (event) => {
    event.preventDefault()
    const found = validate(form, { isAdmin })
    setErrors(found)
    if (Object.keys(found).length) return

    const courseIds =
      form.scope !== "courses" ? [] : isAdmin ? [...new Set(form.courseText.match(OBJECT_ID).map((id) => id.toLowerCase()))] : form.courseIds
    onSubmit({
      code: form.code,
      discountType: form.discountType,
      value: Number(form.value),
      // Valid through the end of the chosen day, in the creator's time zone.
      ...(form.expiresOn && { expiresAt: new Date(`${form.expiresOn}T23:59:59.999`).toISOString() }),
      ...(form.usageLimit && { usageLimit: Number(form.usageLimit) }),
      courses: courseIds,
      showOnCoursePage: form.showOnCoursePage,
      ...(form.scope === "instructor" && { instructorEmail: form.instructorEmail.trim() }),
    })
  }

  const scopes = scopesFor(isAdmin)

  return (
    <Dialog
      id="create-coupon"
      Icon={FiTag}
      title="Create a coupon"
      busy={submitting}
      onClose={onClose}
      as="form"
      onSubmit={submit}
      actions={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={`${secondaryButtonClass} text-sm`}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} className={`${primaryButtonClass} text-sm`}>
            {submitting ? "Creating…" : "Create coupon"}
          </button>
        </>
      }
    >
      <div className="mt-4 space-y-4">
        <Field label="Code" htmlFor="coupon-code-input" required error={errors.code} hint="Students type this at checkout">
          <input
            id="coupon-code-input"
            value={form.code}
            onChange={(event) => set("code", event.target.value.toUpperCase().replace(/\s/g, ""))}
            placeholder="LAUNCH20"
            maxLength={20}
            autoComplete="off"
            className={`${inputClass(Boolean(errors.code))} font-mono uppercase`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Discount type" htmlFor="coupon-type">
            <select
              id="coupon-type"
              value={form.discountType}
              onChange={(event) => set("discountType", event.target.value)}
              className={inputClass()}
            >
              <option value="percent">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </Field>
          <Field label={form.discountType === "percent" ? "Percent off" : "Amount off (₹)"} htmlFor="coupon-value" required error={errors.value}>
            <input
              id="coupon-value"
              type="number"
              inputMode="numeric"
              min={1}
              max={form.discountType === "percent" ? 100 : undefined}
              value={form.value}
              onChange={(event) => set("value", event.target.value)}
              placeholder={form.discountType === "percent" ? "20" : "500"}
              className={inputClass(Boolean(errors.value))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Expires on" htmlFor="coupon-expiry" hint="Optional">
            <input
              id="coupon-expiry"
              type="date"
              min={todayInputValue()}
              value={form.expiresOn}
              onChange={(event) => set("expiresOn", event.target.value)}
              className={inputClass()}
            />
          </Field>
          <Field label="Usage limit" htmlFor="coupon-limit" error={errors.usageLimit} hint="Optional · total uses">
            <input
              id="coupon-limit"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.usageLimit}
              onChange={(event) => set("usageLimit", event.target.value)}
              placeholder="Unlimited"
              className={inputClass(Boolean(errors.usageLimit))}
            />
          </Field>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-content">Applies to</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {scopes.map(({ key, label }) => (
              <label
                key={key}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  form.scope === key ? "border-brand bg-selected text-accent" : "border-line text-content-muted hover:text-content"
                }`}
              >
                <input type="radio" name="coupon-scope" value={key} checked={form.scope === key} onChange={() => set("scope", key)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {form.scope === "instructor" && (
          <Field label="Instructor email" htmlFor="coupon-instructor" required error={errors.instructorEmail}>
            <input
              id="coupon-instructor"
              type="email"
              value={form.instructorEmail}
              onChange={(event) => set("instructorEmail", event.target.value)}
              placeholder="instructor@example.com"
              className={inputClass(Boolean(errors.instructorEmail))}
            />
          </Field>
        )}

        {form.scope === "courses" &&
          (isAdmin ? (
            <Field label="Courses" htmlFor="coupon-courses" required error={errors.courses} hint="Paste course page links or ids, one per line">
              <textarea
                id="coupon-courses"
                rows={3}
                value={form.courseText}
                onChange={(event) => set("courseText", event.target.value)}
                placeholder="https://…/courses/652f…"
                className={inputClass(Boolean(errors.courses))}
              />
            </Field>
          ) : (
            <div>
              {courses.length === 0 ? (
                <p className="text-sm text-content-muted">You don&apos;t have any courses yet.</p>
              ) : (
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
                  {courses.map((course) => (
                    <li key={course._id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-content hover:bg-page">
                        <input
                          type="checkbox"
                          checked={form.courseIds.includes(course._id)}
                          onChange={() => toggleCourse(course._id)}
                          className="h-4 w-4 shrink-0 cursor-pointer rounded accent-[rgb(var(--color-brand))]"
                        />
                        <span className="min-w-0 truncate">{course.courseName}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              {errors.courses && <p className="mt-1.5 text-xs text-danger">{errors.courses}</p>}
            </div>
          ))}

        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={form.showOnCoursePage}
            onChange={(event) => set("showOnCoursePage", event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-[rgb(var(--color-brand))]"
          />
          <span>
            <span className="font-medium text-content">Show on course pages</span>
            <span className="block text-xs text-content-muted">Untick for a private code you share yourself (e.g. by email).</span>
          </span>
        </label>
      </div>
    </Dialog>
  )
}
