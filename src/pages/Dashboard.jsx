import { useSelector } from "react-redux"
import { Outlet } from "react-router-dom"

import Sidebar from "../components/core/Dashboard/Sidebar"

const Dashboard = () => {
  const { loading: authLoading } = useSelector((state) => state.auth)
  const { loading: profileLoading } = useSelector((state) => state.profile)
  if (profileLoading || authLoading) {
    return <div className="mt-10">Loading...</div>
  }
  // Phones: tab bar above the content. Tablet and up: sidebar beside a scrolling content area.
  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] flex-col bg-richblack-900 md:flex-row">
      <Sidebar />
      <div className="flex-1 md:h-[calc(100vh-3.5rem)] md:overflow-auto">
        <div className="mx-auto w-11/12 max-w-[1000px] py-8 md:py-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
