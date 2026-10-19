const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

// 1999 -> "₹1,999"; 0 or missing -> "Free"
export const formatPrice = (price) => (price ? inr.format(price) : "Free")

// Money amounts such as earnings: 0 -> "₹0", 15990 -> "₹15,990"
export const formatAmount = (amount) => inr.format(amount || 0)
