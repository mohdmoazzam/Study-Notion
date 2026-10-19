import * as Icons from "react-icons/vsc"
import { NavLink, matchPath, useLocation } from "react-router-dom"

// Pill-shaped tab on phones, full-width row with an accent bar on tablet and up.
const SidebarLink = ({ link, iconName }) => {
  const Icon = Icons[iconName]
  const location = useLocation()
  const active = Boolean(matchPath({ path: link.path }, location.pathname))

  return (
    <NavLink
      to={link.path}
      aria-current={active ? "page" : undefined}
      className={`relative flex shrink-0 items-center gap-x-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 md:rounded-none md:px-8 ${
        active ? "bg-selected text-accent" : "text-richblack-300 hover:text-richblack-5"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 hidden h-full w-[0.2rem] bg-yellow-50 md:block ${active ? "opacity-100" : "opacity-0"}`}
      />
      <Icon className="text-lg" />
      <span>{link.name}</span>
    </NavLink>
  )
}

export default SidebarLink
