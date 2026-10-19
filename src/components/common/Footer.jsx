import { FiMail } from "react-icons/fi"
import { Link } from "react-router-dom"

import Logo from "./Logo"

const SUPPORT_EMAIL = "info@studynotion.com"

const LINK_GROUPS = [
  {
    title: "Platform",
    links: [
      { label: "Home", to: "/" },
      { label: "About us", to: "/about" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Sign up", to: "/signup" },
      { label: "Teach on StudyNotion", to: "/signup" },
      { label: "Log in", to: "/login" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Forgot password", to: "/forgot-password" },
      { label: "Contact support", to: "/contact" },
    ],
  },
]

function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid w-11/12 max-w-maxContent grid-cols-2 gap-10 py-14 md:grid-cols-5">
        <div className="col-span-2">
          <Link to="/" aria-label="StudyNotion home" className="inline-block">
            <Logo width={150} height={40} />
          </Link>
          <p className="mt-4 max-w-xs text-sm text-content-muted">
            Learn skills that matter. Share what you know. Courses for students, tools for
            instructors.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-content hover:text-accent"
          >
            <FiMail />
            {SUPPORT_EMAIL}
          </a>
        </div>

        {LINK_GROUPS.map(({ title, links }) => (
          <nav key={title} aria-label={title}>
            <h2 className="text-sm font-semibold text-content">{title}</h2>
            <ul className="mt-4 space-y-3">
              {links.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-content-muted transition hover:text-content">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-11/12 max-w-maxContent flex-col items-center justify-between gap-2 py-6 text-sm text-content-muted sm:flex-row">
          <p>&copy; {new Date().getFullYear()} StudyNotion. All rights reserved.</p>
          <p>Made with &#10084;&#65039; CodeHelp</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
