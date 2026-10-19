import { useState } from "react"
import { VscSignOut } from "react-icons/vsc"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { sidebarLinks } from "../../../data/dashboard-links"
import { logout } from "../../../services/operations/authAPI"
import ConfirmationModal from "../../common/ConfirmationModal"
import SidebarLink from "./SidebarLink"

// Phones: horizontal, scrollable tab bar. Tablet and up: vertical sidebar.
const Sidebar = () => {
  const { user, loading: profileLoading } = useSelector((state) => state.profile)
  const { loading: authLoading } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [confirmationModal, setConfirmationModal] = useState(null)

  if (profileLoading || authLoading) {
    return <div className="mt-10">Loading...</div>
  }

  return (
    <div className="md:shrink-0">
      <nav
        aria-label="Dashboard"
        className="flex gap-1 overflow-x-auto border-b border-richblack-700 bg-richblack-800 px-3 py-2 md:h-[calc(100vh-3.5rem)] md:min-w-[222px] md:flex-col md:gap-0 md:overflow-visible md:border-b-0 md:border-r md:px-0 md:py-10"
      >
        <div className="flex gap-1 md:flex-col md:gap-0">
          {sidebarLinks.map((link) => {
            if (link.type && user?.accountType !== link.type) return null
            return <SidebarLink key={link.id} link={link} iconName={link.icon} />
          })}
        </div>

        <div aria-hidden="true" className="mx-auto my-6 hidden h-px w-11/12 bg-richblack-600 md:block" />

        <div className="flex gap-1 md:flex-col md:gap-0">
          <SidebarLink link={{ name: "Settings", path: "/dashboard/settings" }} iconName="VscSettingsGear" />
          <button
            type="button"
            onClick={() =>
              setConfirmationModal({
                text1: "Are You Sure ?",
                text2: "You will be logged out of your account",
                btn1Text: "Logout",
                btn2Text: "Cancel",
                btn1Handler: () => dispatch(logout(navigate)),
                btn2Handler: () => setConfirmationModal(null),
              })
            }
            className="flex shrink-0 items-center gap-x-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-richblack-300 transition hover:text-richblack-5 md:rounded-none md:px-8"
          >
            <VscSignOut className="text-lg" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </div>
  )
}

export default Sidebar
