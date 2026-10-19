import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"
import { useSelector } from "react-redux"

import { changePassword } from "../../../../services/operations/settingsAPI"
import { Field, FormCard, inputClass, primaryButtonClass } from "../../../common/formUi"

const MIN_LENGTH = 8

function PasswordField({ id, label, error, hint, autoComplete, registration }) {
  const [visible, setVisible] = useState(false)
  return (
    <Field label={label} htmlFor={id} required hint={hint} error={error}>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className={`${inputClass(error)} pr-11`}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-content-subtle transition hover:text-content"
        >
          {visible ? <AiOutlineEyeInvisible fontSize={20} /> : <AiOutlineEye fontSize={20} />}
        </button>
      </div>
    </Field>
  )
}

const UpdatePassword = () => {
  const { token } = useSelector((state) => state.auth)
  const [changedAt, setChangedAt] = useState(0)
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async ({ oldPassword, newPassword }) => {
    const changed = await changePassword(token, { oldPassword, newPassword })
    if (changed) setChangedAt(Date.now())
  }

  // Clear the fields after a successful change. Resetting after the submit has finished
  // (rather than inside it) avoids re-validating the now-empty fields.
  useEffect(() => {
    if (changedAt) reset({ oldPassword: "", newPassword: "", confirmPassword: "" })
  }, [changedAt, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormCard id="password" title="Password" description="Use a strong password you don't use anywhere else.">
        <PasswordField
          id="oldPassword"
          label="Current password"
          autoComplete="current-password"
          error={errors.oldPassword && "Please enter your current password"}
          registration={register("oldPassword", { required: true })}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField
            id="newPassword"
            label="New password"
            autoComplete="new-password"
            hint={`At least ${MIN_LENGTH} characters.`}
            error={errors.newPassword?.message}
            registration={register("newPassword", {
              required: "Please enter a new password",
              minLength: { value: MIN_LENGTH, message: `Use at least ${MIN_LENGTH} characters` },
              validate: (value) => value !== getValues("oldPassword") || "New password must be different",
            })}
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            registration={register("confirmPassword", {
              required: "Please confirm your new password",
              validate: (value) => value === getValues("newPassword") || "Passwords don't match",
            })}
          />
        </div>

        <div className="flex justify-end border-t border-line pt-5">
          <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </div>
      </FormCard>
    </form>
  )
}

export default UpdatePassword
