import { useEffect, useState } from "react"
import { FiX } from "react-icons/fi"
import { useSelector } from "react-redux"

import { Field } from "../../../../common/formUi"

// Tag input: Enter or comma adds a tag, Backspace on an empty input removes the last one.
const ChipInput = ({ label, name, placeholder, register, errors, setValue }) => {
  const { editCourse, course } = useSelector((state) => state.course)
  const [chips, setChips] = useState(() => (editCourse ? course?.tag ?? [] : []))
  const [text, setText] = useState("")

  useEffect(() => {
    register(name, { validate: (value) => value?.length > 0 || "Add at least one tag" })
  }, [register, name])

  useEffect(() => {
    setValue(name, chips)
  }, [chips, name, setValue])

  const addChip = (value) => {
    const chip = value.trim()
    if (chip && !chips.includes(chip)) setChips([...chips, chip])
    setText("")
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      addChip(text)
    } else if (event.key === "Backspace" && !text && chips.length) {
      setChips(chips.slice(0, -1))
    }
  }

  const invalid = Boolean(errors[name])

  return (
    <Field
      label={label}
      htmlFor={name}
      required
      hint="Press Enter or comma to add a tag."
      error={errors[name]?.message}
    >
      <div
        className={`flex flex-wrap items-center gap-2 rounded-lg border bg-field px-2.5 py-2 transition focus-within:ring-2 ${
          invalid
            ? "border-danger focus-within:ring-danger/20"
            : "border-line focus-within:border-brand focus-within:ring-brand/30"
        }`}
      >
        {chips.map((chip, index) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-full bg-selected py-1 pl-3 pr-1.5 text-sm font-medium text-accent"
          >
            {chip}
            <button
              type="button"
              aria-label={`Remove ${chip}`}
              onClick={() => setChips(chips.filter((_, i) => i !== index))}
              className="rounded-full p-0.5 transition hover:bg-brand/20"
            >
              <FiX aria-hidden="true" className="text-xs" />
            </button>
          </span>
        ))}
        <input
          id={name}
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => text && addChip(text)}
          placeholder={chips.length ? "" : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-content outline-none placeholder:text-content-subtle"
        />
      </div>
    </Field>
  )
}

export default ChipInput
