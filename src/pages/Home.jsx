import { useSelector } from "react-redux"

import Footer from "../components/common/Footer"
import { ReviewSlider } from "../components/common/ReviewSlider"
import AudienceSection from "../components/core/HomePage/AudienceSection"
import CallToAction from "../components/core/HomePage/CallToAction"
import CategoriesSection from "../components/core/HomePage/CategoriesSection"
import Hero from "../components/core/HomePage/Hero"
import HowItWorks from "../components/core/HomePage/HowItWorks"
import SectionHeading from "../components/core/HomePage/SectionHeading"

function Home() {
  const { token } = useSelector((state) => state.auth)
  const isLoggedIn = Boolean(token)

  return (
    <div className="bg-page">
      <Hero isLoggedIn={isLoggedIn} />
      <AudienceSection />
      <HowItWorks />
      <CategoriesSection />
      <ReviewSlider
        title={
          <SectionHeading
            eyebrow="Testimonials"
            title="What our learners say"
            subtitle="Real reviews from students learning on StudyNotion."
          />
        }
      />
      {!isLoggedIn && <CallToAction />}
      <Footer />
    </div>
  )
}

export default Home
