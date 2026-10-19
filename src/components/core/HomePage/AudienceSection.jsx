import { FaArrowRight, FaChalkboardTeacher, FaUserGraduate } from "react-icons/fa"
import { FiCheck } from "react-icons/fi"

import LinkButton from "../../common/LinkButton"
import SectionHeading from "./SectionHeading"

const AUDIENCES = [
  {
    title: "For students",
    Icon: FaUserGraduate,
    description: "Pick up new skills with structured video courses taught by experienced instructors.",
    points: [
      "Browse courses by category",
      "Learn at your own pace with video lessons",
      "Track your progress lesson by lesson",
      "Rate and review the courses you take",
    ],
    cta: "Start learning",
  },
  {
    title: "For instructors",
    Icon: FaChalkboardTeacher,
    description: "Turn your expertise into courses and reach learners wherever they are.",
    points: [
      "Build courses with sections and video lectures",
      "Keep drafts private until you're ready to publish",
      "See enrollments and earnings on your dashboard",
      "Grow your audience with student reviews",
    ],
    cta: "Start teaching",
  },
]

function AudienceSection() {
  return (
    <section className="border-y border-line bg-surface py-20">
      <div className="mx-auto w-11/12 max-w-maxContent">
        <SectionHeading
          eyebrow="Who it's for"
          title="One platform, two ways to grow"
          subtitle="Whether you're here to learn or to teach, StudyNotion has the tools you need."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {AUDIENCES.map(({ title, Icon, description, points, cta }) => (
            <article key={title} className="flex flex-col rounded-2xl border border-line bg-page p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-selected text-xl text-accent">
                <Icon />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-content">{title}</h3>
              <p className="mt-2 text-content-muted">{description}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {points.map((point) => (
                  <li key={point} className="flex gap-3 text-sm text-content">
                    <FiCheck className="mt-0.5 shrink-0 text-accent" />
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <LinkButton to="/signup" variant="secondary">
                  {cta} <FaArrowRight />
                </LinkButton>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AudienceSection
