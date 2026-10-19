import { useState } from "react"
import { FiCheck, FiChevronDown } from "react-icons/fi"

const VISIBLE_COUNT = 6
// Leading "-", "*", "•", "✓" or "1." / "1)" that instructors often type before each point.
const BULLET = /^\s*(?:[-*•✓✔]|\d+[.)])\s+/

// One outcome per non-empty line of the instructor's text.
export const parseOutcomes = (text = "") =>
  text
    .split(/\r?\n/)
    .map((line) => line.replace(BULLET, "").trim())
    .filter(Boolean)

function ColumnLabel({ children }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-content-subtle">{children}</p>
}

// One card: what you'll learn (left, wider) and what you'll need (right, grey panel).
// Stacks on phones; if only one list exists it takes the full width.
function LearningOutcomes({ text, requirements = [] }) {
  const [expanded, setExpanded] = useState(false)
  const outcomes = parseOutcomes(text)
  const visible = expanded ? outcomes : outcomes.slice(0, VISIBLE_COUNT)
  const hasBoth = outcomes.length > 0 && requirements.length > 0

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface md:flex-row">
      {outcomes.length > 0 && (
        <div className={`p-6 sm:p-8 ${hasBoth ? "md:w-3/5" : "w-full"}`}>
          <ColumnLabel>You&apos;ll learn</ColumnLabel>
          <ul className="mt-4 space-y-3">
            {visible.map((outcome, index) => (
              <li key={`${outcome}-${index}`} className="flex items-start gap-3">
                <FiCheck aria-hidden="true" className="mt-1 shrink-0 text-accent" strokeWidth={3} />
                <span className="leading-relaxed text-content">{outcome}</span>
              </li>
            ))}
          </ul>

          {outcomes.length > VISIBLE_COUNT && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
            >
              {expanded ? "Show less" : `Show all ${outcomes.length}`}
              <FiChevronDown
                aria-hidden="true"
                className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      )}

      {requirements.length > 0 && (
        <div
          className={`bg-page p-6 sm:p-8 ${
            hasBoth ? "border-t border-line md:w-2/5 md:border-l md:border-t-0" : "w-full"
          }`}
        >
          <ColumnLabel>You&apos;ll need</ColumnLabel>
          <ul className="mt-4 space-y-3">
            {requirements.map((item, index) => (
              <li key={`${item}-${index}`} className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-content-subtle" />
                <span className="leading-relaxed text-content">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default LearningOutcomes
