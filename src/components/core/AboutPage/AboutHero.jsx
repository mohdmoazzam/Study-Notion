import aboutImage1 from "../../../assets/Images/aboutus1.webp"
import aboutImage2 from "../../../assets/Images/aboutus2.webp"
import aboutImage3 from "../../../assets/Images/aboutus3.webp"
import SectionHeading from "../HomePage/SectionHeading"

const IMAGES = [
  { src: aboutImage1, alt: "Student writing notes at a desk next to a computer" },
  { src: aboutImage2, alt: "Student studying with a notebook and laptop" },
  { src: aboutImage3, alt: "Smiling student writing in a notebook" },
]

function AboutHero() {
  return (
    <section className="relative isolate">
      <div aria-hidden="true" className="notebook-grid absolute inset-0 -z-10" />
      <div className="mx-auto w-11/12 max-w-maxContent py-16 lg:py-20">
        <SectionHeading
          as="h1"
          eyebrow="About us"
          title="Driving innovation in online education"
          subtitle="StudyNotion is building a brighter future for learning: modern courses, practical skills and a community where students and instructors grow together."
        />

        <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-5">
          {IMAGES.map(({ src, alt }) => (
            <img
              key={src}
              src={src}
              alt={alt}
              loading="lazy"
              className="aspect-[4/3] w-full rounded-2xl border border-line object-cover shadow-sm"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default AboutHero
