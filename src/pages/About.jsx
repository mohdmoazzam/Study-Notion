import { useSelector } from "react-redux"

import Footer from "../components/common/Footer"
import AboutHero from "../components/core/AboutPage/AboutHero"
import OurStory from "../components/core/AboutPage/OurStory"
import StatsBand from "../components/core/AboutPage/StatsBand"
import WhyStudyNotion from "../components/core/AboutPage/WhyStudyNotion"
import CallToAction from "../components/core/HomePage/CallToAction"

function About() {
  const { token } = useSelector((state) => state.auth)

  return (
    <div className="bg-page">
      <AboutHero />
      <OurStory />
      <StatsBand />
      <WhyStudyNotion />
      {!token && (
        <CallToAction
          title="Learn with us, or teach with us"
          description="Create a free account to start learning, or reach out if you have any questions."
          secondary={{ label: "Contact us", to: "/contact" }}
        />
      )}
      <Footer />
    </div>
  )
}

export default About
