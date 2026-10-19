import { useForm } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"

import { updateProfile } from "../../../../services/operations/settingsAPI"
import { Field, FormCard, inputClass, primaryButtonClass, secondaryButtonClass } from "../../../common/formUi"

// Values match what is already stored for existing users.
const GENDERS = ["Male", "Female", "Non-Binary", "Prefer not to say", "Other"]
const ABOUT_MAX_LENGTH = 500
const today = () => new Date().toISOString().split("T")[0]

const valuesFrom = (user) => ({
  firstName: user?.firstName ?? "",
  lastName: user?.lastName ?? "",
  dateOfBirth: user?.additionalDetails?.dateOfBirth ?? "",
  gender: user?.additionalDetails?.gender ?? "",
  contactNumber: user?.additionalDetails?.contactNumber ?? "",
  about: user?.additionalDetails?.about ?? "",
})

const EditProfile = () => {
  const { user } = useSelector((state) => state.profile)
  const { token } = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({ defaultValues: valuesFrom(user) })
  const aboutLength = (watch("about") ?? "").length

  const onSubmit = async (data) => {
    const saved = await dispatch(updateProfile(token, data))
    // Make the saved values the new baseline so "Save" disables again.
    if (saved) reset(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormCard id="personal-info" title="Personal information" description="Only your name is required; everything else is optional.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" required error={errors.firstName && "Please enter your first name"}>
            <input id="firstName" autoComplete="given-name" className={inputClass(errors.firstName)} {...register("firstName", { required: true })} />
          </Field>
          <Field label="Last name" htmlFor="lastName" required error={errors.lastName && "Please enter your last name"}>
            <input id="lastName" autoComplete="family-name" className={inputClass(errors.lastName)} {...register("lastName", { required: true })} />
          </Field>

          <Field label="Date of birth" htmlFor="dateOfBirth" error={errors.dateOfBirth?.message}>
            <input
              id="dateOfBirth"
              type="date"
              max={today()}
              className={inputClass(errors.dateOfBirth)}
              {...register("dateOfBirth", {
                validate: (value) => !value || value <= today() || "Date of birth can't be in the future",
              })}
            />
          </Field>
          <Field label="Gender" htmlFor="gender">
            <select id="gender" className={inputClass(false)} {...register("gender")}>
              <option value="">Select gender</option>
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Phone number" htmlFor="contactNumber" error={errors.contactNumber?.message}>
            <input
              id="contactNumber"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              className={inputClass(errors.contactNumber)}
              {...register("contactNumber", {
                pattern: { value: /^\+?[0-9][0-9\s-]{6,15}$/, message: "Please enter a valid phone number" },
              })}
            />
          </Field>
        </div>

        <Field
          label="About"
          htmlFor="about"
          hint={`${aboutLength}/${ABOUT_MAX_LENGTH} characters`}
          error={errors.about && `Keep it under ${ABOUT_MAX_LENGTH} characters`}
        >
          <textarea
            id="about"
            rows={4}
            placeholder="A few lines about you, your interests or what you teach."
            className={`${inputClass(errors.about)} resize-y`}
            {...register("about", { maxLength: ABOUT_MAX_LENGTH })}
          />
        </Field>

        <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5">
          <button
            type="button"
            onClick={() => reset()}
            disabled={!isDirty || isSubmitting}
            className={secondaryButtonClass}
          >
            Discard
          </button>
          <button type="submit" disabled={!isDirty || isSubmitting} className={primaryButtonClass}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </FormCard>
    </form>
  )
}

export default EditProfile
