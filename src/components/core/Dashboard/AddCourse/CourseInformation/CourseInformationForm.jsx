import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
import { FiArrowRight } from "react-icons/fi"
import { useDispatch, useSelector } from "react-redux"

import {
  addCourseDetails,
  editCourseDetails,
  fetchCourseCategories,
} from "../../../../../services/operations/courseDetailsAPI"
import { setCourse, setStep } from "../../../../../slices/courseSlice"
import { Field, FormCard, inputClass, primaryButtonClass, secondaryButtonClass } from "../../../../common/formUi"
import Upload from "../Upload"
import CategoryCombobox from "./CategoryCombobox"
import ChipInput from "./ChipInput"
import RequirementField from "./RequirementField"

// The edited course has a populated category object; the form works with its id.
const categoryIdOf = (course) => course?.category?._id ?? course?.category ?? ""

const DEFAULT_LANGUAGE = "English"
const LANGUAGES = [
  "English",
  "Hindi",
  "Hinglish",
  "Bengali",
  "Marathi",
  "Tamil",
  "Telugu",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Urdu",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Arabic",
  "Japanese",
  "Chinese",
]

const OUTCOMES_PLACEHOLDER = "Build Android apps with Kotlin\nDesign layouts with Jetpack Compose\nPublish an app to the Play Store"

const CourseInformationForm = () => {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm()
  const dispatch = useDispatch()
  const { token } = useSelector((state) => state.auth)
  const { course, editCourse } = useSelector((state) => state.course)
  const [saving, setSaving] = useState(false)
  const [courseCategories, setCourseCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const selectedCategoryId = watch("courseCategory")
  // Keep a language that isn't in the list (e.g. set via the API) selectable when editing.
  const languageOptions =
    editCourse && course?.language && !LANGUAGES.includes(course.language) ? [course.language, ...LANGUAGES] : LANGUAGES

  // The category is picked through a custom combobox, so it's registered manually.
  useEffect(() => {
    register("courseCategory", { required: true })
  }, [register])

  useEffect(() => {
    let active = true
    fetchCourseCategories()
      .then((categories) => active && setCourseCategories(categories ?? []))
      .finally(() => active && setCategoriesLoading(false))

    if (editCourse && course) {
      setValue("courseTitle", course.courseName)
      setValue("courseShortDesc", course.courseDescription)
      setValue("coursePrice", course.price)
      setValue("courseBenefits", course.whatYouWillLearn)
      setValue("courseLanguage", course.language || DEFAULT_LANGUAGE)
    }
    return () => {
      active = false
    }
    // Runs once per mount: the form is filled from the course being edited.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Category options arrive asynchronously; select the course's category once they exist.
  useEffect(() => {
    if (editCourse && course && courseCategories.length > 0) {
      setValue("courseCategory", categoryIdOf(course))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseCategories])

  const isFormUpdated = () => {
    const values = getValues()
    return (
      values.courseTitle !== course.courseName ||
      values.courseShortDesc !== course.courseDescription ||
      Number(values.coursePrice) !== course.price ||
      values.courseTags.toString() !== course.tag.toString() ||
      values.courseBenefits !== course.whatYouWillLearn ||
      values.courseCategory !== categoryIdOf(course) ||
      values.courseImage !== course.thumbnail ||
      values.courseLanguage !== (course.language || DEFAULT_LANGUAGE) ||
      values.courseRequirements.toString() !== (course.instructions ?? []).toString()
    )
  }

  const onSubmit = async (data) => {
    if (editCourse) {
      if (!isFormUpdated()) {
        toast.error("No changes made to the form")
        return
      }
      // Send only the fields that changed.
      const formData = new FormData()
      formData.append("courseId", course._id)
      if (data.courseTitle !== course.courseName) formData.append("courseName", data.courseTitle)
      if (data.courseShortDesc !== course.courseDescription) formData.append("courseDescription", data.courseShortDesc)
      if (Number(data.coursePrice) !== course.price) formData.append("price", data.coursePrice)
      if (data.courseTags.toString() !== course.tag.toString()) formData.append("tag", JSON.stringify(data.courseTags))
      if (data.courseBenefits !== course.whatYouWillLearn) formData.append("whatYouWillLearn", data.courseBenefits)
      if (data.courseCategory !== categoryIdOf(course)) formData.append("category", data.courseCategory)
      if (data.courseLanguage !== (course.language || DEFAULT_LANGUAGE)) formData.append("language", data.courseLanguage)
      if (data.courseRequirements.toString() !== (course.instructions ?? []).toString()) {
        formData.append("instructions", JSON.stringify(data.courseRequirements))
      }
      if (data.courseImage instanceof File) formData.append("thumbnailImage", data.courseImage)

      setSaving(true)
      const result = await editCourseDetails(formData, token)
      setSaving(false)
      if (result) {
        dispatch(setCourse(result))
        dispatch(setStep(2))
      }
      return
    }

    const formData = new FormData()
    formData.append("courseName", data.courseTitle)
    formData.append("courseDescription", data.courseShortDesc)
    formData.append("price", data.coursePrice)
    formData.append("tag", JSON.stringify(data.courseTags))
    formData.append("whatYouWillLearn", data.courseBenefits)
    formData.append("category", data.courseCategory)
    formData.append("language", data.courseLanguage)
    formData.append("status", "Draft")
    formData.append("instructions", JSON.stringify(data.courseRequirements))
    formData.append("thumbnailImage", data.courseImage)

    setSaving(true)
    const result = await addCourseDetails(formData, token)
    setSaving(false)
    if (result) {
      dispatch(setCourse(result))
      dispatch(setStep(2))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FormCard title="Basic information" description="Tell students what your course is about.">
        <Field label="Course title" htmlFor="courseTitle" required error={errors.courseTitle && "Course title is required"}>
          <input
            id="courseTitle"
            placeholder="e.g. Android Development with Kotlin"
            className={inputClass(errors.courseTitle)}
            {...register("courseTitle", { required: true })}
          />
        </Field>

        <Field
          label="Short description"
          htmlFor="courseShortDesc"
          required
          hint="One or two sentences shown under the course title."
          error={errors.courseShortDesc && "Course description is required"}
        >
          <textarea
            id="courseShortDesc"
            rows={3}
            placeholder="What will students be able to do after this course?"
            className={`${inputClass(errors.courseShortDesc)} resize-y`}
            {...register("courseShortDesc", { required: true })}
          />
        </Field>

        <ChipInput
          label="Tags"
          name="courseTags"
          placeholder="e.g. android, kotlin"
          register={register}
          errors={errors}
          setValue={setValue}
        />
      </FormCard>

      <FormCard title="Price, category & language">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Price (₹)" htmlFor="coursePrice" required error={errors.coursePrice && "Enter a valid price"}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-medium text-content-subtle">₹</span>
              <input
                id="coursePrice"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="499"
                className={`${inputClass(errors.coursePrice)} pl-8`}
                {...register("coursePrice", { required: true, valueAsNumber: true, min: 0 })}
              />
            </div>
          </Field>

          <Field
            label="Category"
            htmlFor="courseCategory"
            required
            hint="Pick one, or type a new name to create it."
            error={errors.courseCategory && "Choose or create a category"}
          >
            <CategoryCombobox
              id="courseCategory"
              categories={courseCategories}
              onCategoriesChange={setCourseCategories}
              value={selectedCategoryId}
              onChange={(categoryId) => setValue("courseCategory", categoryId, { shouldValidate: true })}
              invalid={Boolean(errors.courseCategory)}
              disabled={categoriesLoading}
              token={token}
            />
          </Field>

          <Field
            label="Language"
            htmlFor="courseLanguage"
            required
            hint="The language you teach this course in."
            error={errors.courseLanguage && "Choose a language"}
          >
            <select
              id="courseLanguage"
              defaultValue={DEFAULT_LANGUAGE}
              className={inputClass(errors.courseLanguage)}
              {...register("courseLanguage", { required: true })}
            >
              {languageOptions.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </FormCard>

      <FormCard title="Course thumbnail" description="Shown on course cards and at the top of your course page.">
        <Upload
          name="courseImage"
          label="Course thumbnail"
          hideLabel
          register={register}
          setValue={setValue}
          errors={errors}
          editData={editCourse ? course?.thumbnail : null}
        />
      </FormCard>

      <FormCard title="Outcomes & requirements">
        <Field
          label="What students will learn"
          htmlFor="courseBenefits"
          required
          hint="Write one outcome per line. Each line becomes a ✓ point on your course page."
          error={errors.courseBenefits && "Add at least one learning outcome"}
        >
          <textarea
            id="courseBenefits"
            rows={5}
            placeholder={OUTCOMES_PLACEHOLDER}
            className={`${inputClass(errors.courseBenefits)} resize-y`}
            {...register("courseBenefits", { required: true })}
          />
        </Field>

        <RequirementField
          name="courseRequirements"
          label="Requirements"
          register={register}
          errors={errors}
          setValue={setValue}
        />
      </FormCard>

      <div className="flex flex-wrap justify-end gap-3">
        {editCourse && (
          <button type="button" onClick={() => dispatch(setStep(2))} className={secondaryButtonClass}>
            Continue without saving
          </button>
        )}
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? "Saving..." : editCourse ? "Save changes" : "Next"}
          {!saving && <FiArrowRight aria-hidden="true" />}
        </button>
      </div>
    </form>
  )
}

export default CourseInformationForm
