import Footer from "../components/common/Footer"
import ContactDetails from "../components/core/ContactPage/ContactDetails"
import ContactUsForm from "../components/core/ContactPage/ContactUsForm"
import SectionHeading from "../components/core/HomePage/SectionHeading"

function Contact() {
  return (
    <div className="bg-page">
      <section className="relative isolate">
        <div aria-hidden="true" className="notebook-grid absolute inset-0 -z-10" />
        <div className="mx-auto w-11/12 max-w-maxContent py-16 lg:py-20">
          <SectionHeading
            as="h1"
            eyebrow="Contact us"
            title="We'd love to hear from you"
            subtitle="Questions about a course, teaching on StudyNotion, or anything else? Send us a message and our team will get back to you."
          />
        </div>
      </section>

      <section className="mx-auto grid w-11/12 max-w-maxContent items-start gap-8 pb-20 lg:grid-cols-5">
        <aside className="lg:col-span-2">
          <ContactDetails />
        </aside>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-10 lg:col-span-3">
          <h2 className="text-2xl font-semibold text-content">Send us a message</h2>
          <p className="mt-2 text-sm text-content-muted">
            Fill out the form and we&apos;ll reply to your email.
          </p>
          <div className="mt-8">
            <ContactUsForm />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Contact
