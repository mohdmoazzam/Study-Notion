import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useParams } from "react-router-dom"

import { getFullDetailsOfCourse } from "../../../../services/operations/courseDetailsAPI"
import { resetCourseState, setCourse, setEditCourse, setStep } from "../../../../slices/courseSlice"
import RenderSteps from "../AddCourse/RenderSteps"

export default function EditCourse() {
  const dispatch = useDispatch()
  const { courseId } = useParams()
  const { course } = useSelector((state) => state.course)
  const { token } = useSelector((state) => state.auth)
  // Start in the loading state so a previously stored course is never shown.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    dispatch(resetCourseState())
    ;(async () => {
      const result = await getFullDetailsOfCourse(courseId, token)
      if (!active) return
      if (result?.courseDetails) {
        dispatch(setCourse(result.courseDetails))
        dispatch(setEditCourse(true))
        dispatch(setStep(1))
      }
      setLoading(false)
    })()
    return () => {
      active = false
      dispatch(resetCourseState())
    }
  }, [courseId, token, dispatch])

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-content">Edit course</h1>
      <p className="mt-1 text-content-muted">Update your course details, curriculum or visibility.</p>

      <div className="mt-8">
        {loading ? (
          <div aria-hidden="true" className="space-y-4">
            <div className="h-16 animate-pulse rounded-2xl bg-line" />
            <div className="h-64 animate-pulse rounded-2xl bg-line" />
          </div>
        ) : course ? (
          <RenderSteps />
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
            <p className="text-xl font-semibold text-content">Course not found</p>
            <p className="mt-2 text-content-muted">It may have been deleted, or you don&apos;t have access to it.</p>
          </div>
        )}
      </div>
    </div>
  )
}
