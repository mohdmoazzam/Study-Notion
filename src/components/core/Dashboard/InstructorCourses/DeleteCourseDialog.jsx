import { useEffect, useRef } from "react"
import { FiAlertTriangle } from "react-icons/fi"

import { secondaryButtonClass } from "../../../common/formUi"

// Confirms a course delete. Closes on Escape or backdrop click unless the delete is in progress.
export default function DeleteCourseDialog({ course, deleting, onConfirm, onCancel }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !deleting) onCancel()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [deleting, onCancel])

  const students = course.totalStudentsEnrolled ?? 0

  return (
    <div
      className="fixed inset-0 z-[1000] !mt-0 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && !deleting && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-course-title"
        aria-describedby="delete-course-description"
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger/10 text-xl text-danger">
          <FiAlertTriangle aria-hidden="true" />
        </span>
        <h2 id="delete-course-title" className="mt-4 text-lg font-semibold text-content">
          Delete this course?
        </h2>
        <div id="delete-course-description" className="mt-2 space-y-2 text-sm text-content-muted">
          <p>
            <span className="font-semibold text-content">{course.courseName}</span> and all of its sections,
            lectures and reviews will be permanently deleted. This can&apos;t be undone.
          </p>
          {students > 0 && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 font-medium text-danger">
              {students} enrolled {students === 1 ? "student" : "students"} will lose access to this course.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={deleting} className={secondaryButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete course"}
          </button>
        </div>
      </div>
    </div>
  )
}
