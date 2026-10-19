import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { FiArrowLeft, FiEye, FiEyeOff } from "react-icons/fi"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { editCourseDetails } from "../../../../../services/operations/courseDetailsAPI"
import { resetCourseState, setStep } from "../../../../../slices/courseSlice"
import { COURSE_STATUS } from "../../../../../utils/constants"
import { cardClass, primaryButtonClass, secondaryButtonClass } from "../../../../common/formUi"

const PublishCourse = () => {
  const { register, handleSubmit, setValue, watch } = useForm()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { token } = useSelector((state) => state.auth)
  const { course } = useSelector((state) => state.course)
  const [loading, setLoading] = useState(false)
  const isPublic = watch("public", false)

  useEffect(() => {
    setValue("public", course?.status === COURSE_STATUS.PUBLISHED)
  }, [course, setValue])

  // Done: clear the in-progress course and go to the instructor's course list.
  const goToCourses = () => {
    dispatch(resetCourseState())
    navigate("/dashboard/my-courses")
  }

  const onSubmit = async ({ public: makePublic }) => {
    const nextStatus = makePublic ? COURSE_STATUS.PUBLISHED : COURSE_STATUS.DRAFT
    if (course?.status === nextStatus) {
      goToCourses()
      return
    }
    const formData = new FormData()
    formData.append("courseId", course._id)
    formData.append("status", nextStatus)

    setLoading(true)
    const result = await editCourseDetails(formData, token)
    setLoading(false)
    if (result) goToCourses()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cardClass}>
      <h2 className="text-lg font-semibold text-content">Publish course</h2>
      <p className="mt-1 text-sm text-content-muted">
        Choose who can see this course. You can change this any time.
      </p>

      <label
        htmlFor="public"
        className={`mt-6 flex cursor-pointer items-start gap-4 rounded-xl border p-5 transition ${
          isPublic ? "border-brand bg-selected" : "border-line bg-page hover:border-content-subtle"
        }`}
      >
        <input
          type="checkbox"
          id="public"
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded accent-[rgb(var(--color-brand))]"
          {...register("public")}
        />
        <span>
          <span className="flex items-center gap-2 font-semibold text-content">
            {isPublic ? <FiEye aria-hidden="true" /> : <FiEyeOff aria-hidden="true" />}
            Make this course public
          </span>
          <span className="mt-1 block text-sm text-content-muted">
            {isPublic
              ? "Students can find this course in the catalog and enroll."
              : "The course stays a private draft that only you can see."}
          </span>
        </span>
      </label>

      <div className="mt-8 flex flex-wrap justify-end gap-3">
        <button type="button" disabled={loading} onClick={() => dispatch(setStep(2))} className={secondaryButtonClass}>
          <FiArrowLeft aria-hidden="true" /> Back
        </button>
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  )
}

export default PublishCourse
