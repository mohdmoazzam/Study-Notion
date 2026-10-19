import { FiCheck } from "react-icons/fi"
import { useSelector } from "react-redux"

import CourseBuilderForm from "./CourseBuilder/CourseBuilderForm"
import CourseInformationForm from "./CourseInformation/CourseInformationForm"
import PublishCourse from "./PublishCourse"

const STEPS = [
  { id: 1, title: "Course information", description: "Details, price & thumbnail" },
  { id: 2, title: "Course builder", description: "Sections & lectures" },
  { id: 3, title: "Publish", description: "Make it live" },
]

function Stepper({ step }) {
  return (
    <ol className="mb-8 flex items-start">
      {STEPS.map((item, index) => {
        const done = step > item.id
        const current = step === item.id
        return (
          <li key={item.id} className="flex flex-1 items-start last:flex-none">
            <div className="flex w-24 flex-col items-center text-center sm:w-36" aria-current={current ? "step" : undefined}>
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                  done
                    ? "border-brand bg-brand text-on-brand"
                    : current
                    ? "border-brand bg-selected text-accent"
                    : "border-line bg-surface text-content-subtle"
                }`}
              >
                {done ? <FiCheck aria-hidden="true" strokeWidth={3} /> : item.id}
              </span>
              <span className={`mt-2 text-sm font-semibold ${done || current ? "text-content" : "text-content-subtle"}`}>
                {item.title}
              </span>
              <span className="hidden text-xs text-content-muted sm:block">{item.description}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div aria-hidden="true" className={`mt-5 h-0.5 flex-1 rounded-full transition ${done ? "bg-brand" : "bg-line"}`} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

const RenderSteps = () => {
  const { step } = useSelector((state) => state.course)

  return (
    <>
      <Stepper step={step} />
      {step === 1 && <CourseInformationForm />}
      {step === 2 && <CourseBuilderForm />}
      {step === 3 && <PublishCourse />}
    </>
  )
}

export default RenderSteps
