import { FiBriefcase, FiClock, FiShield, FiStar, FiTrendingUp, FiUsers } from "react-icons/fi"

import SectionHeading from "../HomePage/SectionHeading"

const REASONS = [
  {
    Icon: FiBriefcase,
    title: "Industry-relevant skills",
    description: "Courses focus on practical, job-ready skills that match what the industry needs.",
  },
  {
    Icon: FiClock,
    title: "Learn at your own pace",
    description: "Watch lessons whenever it suits you and pick up right where you left off.",
  },
  {
    Icon: FiTrendingUp,
    title: "Track your progress",
    description: "See how far you've come in every course, lesson by lesson.",
  },
  {
    Icon: FiUsers,
    title: "Learn from real instructors",
    description: "Experienced instructors create and teach every course on the platform.",
  },
  {
    Icon: FiStar,
    title: "Honest reviews",
    description: "Ratings and reviews from enrolled students help you choose the right course.",
  },
  {
    Icon: FiShield,
    title: "Secure payments",
    description: "Checkout is handled by Razorpay, so your payment details stay safe.",
  },
]

function WhyStudyNotion() {
  return (
    <section className="mx-auto w-11/12 max-w-maxContent py-20">
      <SectionHeading
        eyebrow="Why StudyNotion"
        title="Built for how people actually learn"
        subtitle="Everything you need to learn new skills, or to teach them, in one place."
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {REASONS.map(({ Icon, title, description }) => (
          <article key={title} className="rounded-2xl border border-line bg-surface p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-selected text-lg text-accent">
              <Icon aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-content">{title}</h3>
            <p className="mt-2 text-sm text-content-muted">{description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default WhyStudyNotion
