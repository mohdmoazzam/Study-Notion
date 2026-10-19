import { FaArrowRight } from "react-icons/fa"

import Banner from "../../../assets/Images/banner.mp4"
import LinkButton from "../../common/LinkButton"

const STATS = [
  { value: "5K+", label: "Active students" },
  { value: "200+", label: "Courses" },
  { value: "10+", label: "Expert mentors" },
]

function Hero({ isLoggedIn }) {
  return (
    <section className="relative isolate">
      {/* Graph-paper background, like a math notebook (see .notebook-grid in index.css) */}
      <div aria-hidden="true" className="notebook-grid absolute inset-0 -z-10" />

      <div className="mx-auto grid w-11/12 max-w-maxContent items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-content-muted">
            <span className="h-2 w-2 rounded-full bg-brand" />
            For students &amp; instructors
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-content sm:text-5xl">
            Learn skills that matter.{" "}
            <span className="bg-[linear-gradient(transparent_62%,rgb(var(--color-brand)/0.55)_62%)]">
              Share what you know.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-lg text-content-muted">
            StudyNotion brings students and instructors together. Watch video courses at your own
            pace and track your progress, or build and sell courses of your own.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {isLoggedIn ? (
              <LinkButton to="/dashboard/my-profile">
                Go to dashboard <FaArrowRight />
              </LinkButton>
            ) : (
              <>
                <LinkButton to="/signup">
                  Start learning <FaArrowRight />
                </LinkButton>
                <LinkButton to="/signup" variant="secondary">
                  Become an instructor
                </LinkButton>
              </>
            )}
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col-reverse">
                <dt className="text-sm text-content-muted">{label}</dt>
                <dd className="text-2xl font-bold text-content">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative isolate">
          <div
            aria-hidden="true"
            className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-brand/30 via-transparent to-blue-100/30 blur-2xl"
          />
          <video
            muted
            loop
            autoPlay
            playsInline
            className="w-full rounded-2xl border border-line object-cover shadow-xl"
          >
            <source src={Banner} type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  )
}

export default Hero
