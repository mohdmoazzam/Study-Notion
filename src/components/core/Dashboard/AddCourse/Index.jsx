import { useEffect, useState } from "react"
import { FiCheck, FiZap } from "react-icons/fi"
import { useDispatch } from "react-redux"

import { resetCourseState } from "../../../../slices/courseSlice"
import RenderSteps from "./RenderSteps"

const TIPS = [
  "Use a clear, specific title. It's the first thing students see.",
  "Thumbnail: 16:9 JPG or PNG, at least 1024×576.",
  "Write one learning outcome per line. Each becomes a ✓ point on your course page.",
  "List requirements so students know what they need before starting.",
  "In the Course Builder, group lectures into sections.",
  "Your course stays a draft until you publish it.",
]

export default function AddCourse() {
  const dispatch = useDispatch()
  // Start from a clean slate: a previously edited or half-created course must not leak into this form.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    dispatch(resetCourseState())
    setReady(true)
    return () => {
      dispatch(resetCourseState())
    }
  }, [dispatch])

  return (
    <div className="flex w-full items-start gap-8">
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-bold tracking-tight text-content">Add course</h1>
        <p className="mt-1 text-content-muted">
          Create your course in three steps. It stays a draft until you publish it.
        </p>
        <div className="mt-8">{ready && <RenderSteps />}</div>
      </div>

      <aside className="sticky top-6 hidden w-80 shrink-0 xl:block">
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-content">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-selected text-accent">
              <FiZap aria-hidden="true" />
            </span>
            Course upload tips
          </h2>
          <ul className="mt-5 space-y-3">
            {TIPS.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-sm text-content-muted">
                <FiCheck aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
