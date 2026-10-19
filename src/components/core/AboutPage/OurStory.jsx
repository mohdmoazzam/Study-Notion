import { FiEye, FiTarget } from "react-icons/fi"

import foundingStoryImage from "../../../assets/Images/FoundingStory.png"

const PILLARS = [
  {
    Icon: FiEye,
    title: "Our vision",
    text: "An e-learning platform that changes the way people learn, combining modern technology with engaging content for a dynamic, interactive learning experience.",
  },
  {
    Icon: FiTarget,
    title: "Our mission",
    text: "To go beyond delivering courses online and build a community where learners and instructors connect, share knowledge and learn from one another.",
  },
]

function OurStory() {
  return (
    <>
      <section className="border-y border-line bg-surface">
        <p className="mx-auto w-11/12 max-w-4xl py-16 text-center text-2xl font-semibold leading-snug tracking-tight text-content sm:text-3xl">
          We&apos;re passionate about changing the way people learn, bringing together{" "}
          <span className="highlight-marker">technology, expertise and community</span> to create
          a learning experience that works for everyone.
        </p>
      </section>

      <section className="mx-auto grid w-11/12 max-w-maxContent items-center gap-12 py-20 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Our story</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-content sm:text-4xl">
            How StudyNotion started
          </h2>
          <div className="mt-6 space-y-4 text-content-muted">
            <p>
              StudyNotion was born from a shared passion for transforming education. It began with a
              group of educators, technologists and lifelong learners who saw the need for
              accessible, flexible and high-quality learning in a fast-changing digital world.
            </p>
            <p>
              As educators ourselves, we saw the limits of traditional classrooms first-hand. We
              believe learning shouldn&apos;t be confined by walls or geography, so we set out to
              build a platform that helps people everywhere unlock their full potential.
            </p>
          </div>
        </div>

        <img
          src={foundingStoryImage}
          alt="Students learning together on laptops in a classroom"
          loading="lazy"
          className="w-full rounded-2xl border border-line object-cover shadow-xl"
        />
      </section>

      <section className="mx-auto grid w-11/12 max-w-maxContent gap-6 pb-20 md:grid-cols-2">
        {PILLARS.map(({ Icon, title, text }) => (
          <article key={title} className="rounded-2xl border border-line bg-surface p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-selected text-xl text-accent">
              <Icon aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-xl font-semibold text-content">{title}</h3>
            <p className="mt-2 text-content-muted">{text}</p>
          </article>
        ))}
      </section>
    </>
  )
}

export default OurStory
