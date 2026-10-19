import SectionHeading from "./SectionHeading"

const STEPS = [
  {
    title: "Create your free account",
    description: "Sign up as a student or an instructor and verify your email in seconds.",
  },
  {
    title: "Find or create a course",
    description: "Students explore the catalog. Instructors build a course in a few guided steps.",
  },
  {
    title: "Learn and grow",
    description: "Watch lessons, track your progress and leave reviews, or watch your enrollments grow.",
  },
]

function HowItWorks() {
  return (
    <section className="mx-auto w-11/12 max-w-maxContent py-20">
      <SectionHeading eyebrow="How it works" title="Get started in three simple steps" />

      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map(({ title, description }, index) => (
          <li key={title} className="rounded-2xl border border-line bg-surface p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-bold text-on-brand">
              {index + 1}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-content">{title}</h3>
            <p className="mt-2 text-sm text-content-muted">{description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default HowItWorks
