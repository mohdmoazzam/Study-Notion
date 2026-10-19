import logoOnDark from "../../assets/Logo/Logo-Full-Light.png"
import logoOnLight from "../../assets/Logo/Logo-Full-Dark.png"

// Shows the dark logo on the light theme and swaps automatically once dark mode is enabled.
function Logo({ className = "", ...imgProps }) {
  return (
    <>
      <img src={logoOnLight} alt="StudyNotion" className={`${className} dark:hidden`} {...imgProps} />
      <img src={logoOnDark} alt="StudyNotion" className={`${className} hidden dark:block`} {...imgProps} />
    </>
  )
}

export default Logo
