import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { FiSend } from "react-icons/fi"

import CountryCode from "../../../data/countrycode.json"
import { apiConnector } from "../../../services/apiconnector"
import { contactusEndpoint } from "../../../services/apis"

const EMPTY_FORM = {
  firstname: "",
  lastname: "",
  email: "",
  countrycode: "+91",
  phoneNo: "",
  message: "",
}

const inputClass = (invalid) =>
  `w-full rounded-lg border bg-field px-3.5 py-2.5 text-content outline-none transition placeholder:text-content-subtle focus:ring-2 ${
    invalid
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-line focus:border-brand focus:ring-brand/30"
  }`

function Field({ label, htmlFor, optional, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-content">
        {label}
        {optional && <span className="ml-1 font-normal text-content-subtle">(optional)</span>}
      </label>
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}

function ContactUsForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY_FORM })

  const submitContactForm = async (data) => {
    const toastId = toast.loading("Sending your message...")
    try {
      await apiConnector("POST", contactusEndpoint.CONTACT_US_API, data)
      toast.success("Message sent successfully", { id: toastId })
      reset(EMPTY_FORM)
    } catch (error) {
      // Keep what the user typed so they can retry.
      toast.error(error?.response?.data?.message || "Could not send your message. Please try again.", {
        id: toastId,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(submitContactForm)} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstname" error={errors.firstname?.message}>
          <input
            id="firstname"
            type="text"
            autoComplete="given-name"
            placeholder="John"
            aria-invalid={Boolean(errors.firstname)}
            className={inputClass(errors.firstname)}
            {...register("firstname", { required: "Please enter your first name" })}
          />
        </Field>
        <Field label="Last name" htmlFor="lastname" optional>
          <input
            id="lastname"
            type="text"
            autoComplete="family-name"
            placeholder="Doe"
            className={inputClass(false)}
            {...register("lastname")}
          />
        </Field>
      </div>

      <Field label="Email address" htmlFor="email" error={errors.email?.message}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
          className={inputClass(errors.email)}
          {...register("email", {
            required: "Please enter your email address",
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Please enter a valid email address" },
          })}
        />
      </Field>

      <Field label="Phone number" htmlFor="phoneNo" optional error={errors.phoneNo?.message}>
        <div className="flex gap-3">
          {/* Fixed-width wrapper: the shared input style is w-full. */}
          <div className="w-28 shrink-0">
            <select aria-label="Country code" className={`${inputClass(false)} h-full px-2`} {...register("countrycode")}>
              {CountryCode.map(({ code, country }) => (
                <option key={`${code}-${country}`} value={code}>
                  {code} {country}
                </option>
              ))}
            </select>
          </div>
          <input
            id="phoneNo"
            type="tel"
            autoComplete="tel-national"
            placeholder="12345 67890"
            aria-invalid={Boolean(errors.phoneNo)}
            className={`${inputClass(errors.phoneNo)} min-w-0`}
            {...register("phoneNo", {
              pattern: { value: /^[0-9][0-9\s-]{6,14}$/, message: "Please enter a valid phone number" },
            })}
          />
        </div>
      </Field>

      <Field label="Message" htmlFor="message" error={errors.message?.message}>
        <textarea
          id="message"
          rows={5}
          placeholder="How can we help?"
          aria-invalid={Boolean(errors.message)}
          className={`${inputClass(errors.message)} resize-y`}
          {...register("message", { required: "Please enter your message" })}
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 font-semibold text-on-brand transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Sending..." : "Send message"}
        {!isSubmitting && <FiSend aria-hidden="true" />}
      </button>
    </form>
  )
}

export default ContactUsForm
