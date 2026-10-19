import { useEffect, useState } from "react"
import { FiPlus, FiTrash2 } from "react-icons/fi"
import { useSelector } from "react-redux"

import { Field, inputClass, secondaryButtonClass } from "../../../../common/formUi"

// List input: type a requirement and press Enter (or Add); each one can be removed.
const RequirementField = ({ name, label, register, errors, setValue }) => {
  const { editCourse, course } = useSelector((state) => state.course)
  const [requirement, setRequirement] = useState("")
  const [requirementList, setRequirementList] = useState(() => (editCourse ? course?.instructions ?? [] : []))

  useEffect(() => {
    register(name, { validate: (value) => value?.length > 0 || "Add at least one requirement" })
  }, [register, name])

  useEffect(() => {
    setValue(name, requirementList)
  }, [requirementList, name, setValue])

  const addRequirement = () => {
    const value = requirement.trim()
    if (value) setRequirementList([...requirementList, value])
    setRequirement("")
  }

  return (
    <Field
      label={label}
      htmlFor={name}
      required
      hint="What should students know or have before starting?"
      error={errors[name]?.message}
    >
      <div className="flex gap-2">
        <input
          id={name}
          type="text"
          value={requirement}
          onChange={(event) => setRequirement(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              addRequirement()
            }
          }}
          placeholder="e.g. Basic programming knowledge"
          className={inputClass(errors[name])}
        />
        <button type="button" onClick={addRequirement} className={`${secondaryButtonClass} shrink-0 px-4`}>
          <FiPlus aria-hidden="true" /> Add
        </button>
      </div>

      {requirementList.length > 0 && (
        <ul className="mt-2 divide-y divide-line overflow-hidden rounded-lg border border-line">
          {requirementList.map((item, index) => (
            <li key={`${item}-${index}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="flex min-w-0 items-center gap-2.5 text-content">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-content-subtle" />
                <span className="truncate">{item}</span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => setRequirementList(requirementList.filter((_, i) => i !== index))}
                className="shrink-0 rounded-md p-1 text-content-subtle transition hover:bg-page hover:text-danger"
              >
                <FiTrash2 aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  )
}

export default RequirementField
