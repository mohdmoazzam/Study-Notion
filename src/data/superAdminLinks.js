import { FiCreditCard, FiTag } from "react-icons/fi"

// Sidebar of the super admin console, in groups. To add a section: add a link here and a
// matching child route under "/super-admin" in App.js.
export const superAdminNav = [
  {
    group: "Finance",
    links: [{ name: "Payouts", path: "/super-admin/payouts", Icon: FiCreditCard }],
  },
  {
    group: "Sales",
    links: [{ name: "Coupons", path: "/super-admin/coupons", Icon: FiTag }],
  },
]
