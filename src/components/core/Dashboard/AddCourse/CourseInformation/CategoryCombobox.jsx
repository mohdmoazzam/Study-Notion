import { useEffect, useRef, useState } from "react"
import { FiCheck, FiChevronDown, FiPlus } from "react-icons/fi"

import { createCourseCategory } from "../../../../../services/operations/courseDetailsAPI"
import CategoryIcon from "../../../../common/CategoryIcon"
import { inputClass } from "../../../../common/formUi"

// Mirrors the backend: trimmed, single spaces, first letter capitalized ("web  dev" -> "Web dev").
export const normalizeCategoryName = (name) => {
  const cleaned = name.trim().replace(/\s+/g, " ")
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

// Searchable category picker; if the typed name doesn't exist, offers to create it.
function CategoryCombobox({ id, categories, onCategoriesChange, value, onChange, invalid, disabled, token }) {
  const selected = categories.find((category) => category._id === value)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [creating, setCreating] = useState(false)
  const containerRef = useRef(null)

  // When not typing, the input shows the selected category's name.
  useEffect(() => {
    if (!open) setQuery(selected?.name ?? "")
  }, [selected, open])

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener("mousedown", closeOnOutsideClick)
    return () => document.removeEventListener("mousedown", closeOnOutsideClick)
  }, [])

  const isTyping = query !== (selected?.name ?? "")
  const term = query.trim().toLowerCase()
  const filtered = isTyping && term ? categories.filter((c) => c.name.toLowerCase().includes(term)) : categories
  const newName = normalizeCategoryName(query)
  const canCreate =
    isTyping && newName.length >= 2 && !categories.some((c) => c.name.toLowerCase() === newName.toLowerCase())
  const options = [
    ...filtered.map((category) => ({ type: "category", category })),
    ...(canCreate ? [{ type: "create", name: newName }] : []),
  ]

  const choose = async (option) => {
    if (!option) return
    if (option.type === "category") {
      onChange(option.category._id)
      setOpen(false)
      return
    }
    setCreating(true)
    const created = await createCourseCategory(option.name, token)
    setCreating(false)
    if (!created) return
    if (!categories.some((c) => c._id === created._id)) {
      onCategoriesChange([...categories, created].sort((a, b) => a.name.localeCompare(b.name)))
    }
    onChange(created._id)
    setOpen(false)
  }

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      if (!open) return setOpen(true)
      const step = event.key === "ArrowDown" ? 1 : -1
      setActiveIndex((index) => (index + step + options.length) % Math.max(options.length, 1))
    } else if (event.key === "Enter") {
      event.preventDefault()
      if (open) choose(options[activeIndex])
    } else if (event.key === "Escape") {
      setOpen(false)
    }
  }

  const listId = `${id}-listbox`
  const optionId = (index) => `${id}-option-${index}`

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[activeIndex] ? optionId(activeIndex) : undefined}
        autoComplete="off"
        value={query}
        disabled={disabled || creating}
        placeholder={disabled ? "Loading categories..." : "Search or create a category"}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={`${inputClass(invalid)} pr-10 disabled:opacity-60`}
      />
      <FiChevronDown
        aria-hidden="true"
        className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-content-subtle transition-transform ${
          open ? "rotate-180" : ""
        }`}
      />

      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-lg"
        >
          {options.length === 0 && (
            <li className="px-3 py-2 text-sm text-content-muted">Type a name to create a new category</li>
          )}
          {options.map((option, index) => {
            const active = index === activeIndex
            if (option.type === "create") {
              return (
                <li
                  key="create"
                  id={optionId(index)}
                  role="option"
                  aria-selected={false}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    choose(option)
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`mt-1 flex cursor-pointer items-center gap-2.5 rounded-lg border-t border-line px-3 py-2 text-sm font-semibold text-accent ${
                    active ? "bg-selected" : ""
                  }`}
                >
                  <FiPlus aria-hidden="true" />
                  {creating ? "Creating..." : <>Create &ldquo;{option.name}&rdquo;</>}
                </li>
              )
            }
            const isSelected = option.category._id === value
            return (
              <li
                key={option.category._id}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(event) => {
                  event.preventDefault()
                  choose(option)
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${active ? "bg-page" : ""}`}
              >
                <CategoryIcon name={option.category.name} className="shrink-0 text-accent" />
                <span className="flex-1 text-content">{option.category.name}</span>
                {isSelected && <FiCheck aria-hidden="true" className="text-accent" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default CategoryCombobox
