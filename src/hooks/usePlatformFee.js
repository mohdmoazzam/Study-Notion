import { useEffect, useState } from "react"

import { getPlatformFee } from "../services/operations/studentFeaturesAPI"

// The platform fee for an order whose price after discounts is `amount`: the flat fee, or 0 when
// there's nothing to pay (the server applies the same rule). null until the fee has loaded.
export default function usePlatformFee(amount) {
  const [fee, setFee] = useState(null)

  useEffect(() => {
    let active = true
    getPlatformFee().then((value) => active && setFee(value))
    return () => {
      active = false
    }
  }, [])

  if (fee === null) return null
  return amount > 0 ? fee : 0
}
