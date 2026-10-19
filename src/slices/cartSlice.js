import { createSlice } from "@reduxjs/toolkit"
import { toast } from "react-hot-toast"

const readStored = (key, fallback) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const storedCart = readStored("cart", [])
const totalOf = (cart) => cart.reduce((sum, course) => sum + (Number(course.price) || 0), 0)

const initialState = {
  cart: storedCart,
  // Derived from `cart` on every change, so they can't drift from the items.
  total: totalOf(storedCart),
  totalItems: storedCart.length,
}

// Recomputes the totals and saves the cart.
const commit = (state) => {
  state.total = totalOf(state.cart)
  state.totalItems = state.cart.length
  try {
    localStorage.setItem("cart", JSON.stringify(state.cart))
    localStorage.setItem("total", JSON.stringify(state.total))
    localStorage.setItem("totalItems", JSON.stringify(state.totalItems))
  } catch {
    // Storage full or unavailable: the cart still works for this visit.
  }
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const course = action.payload
      if (state.cart.some((item) => item._id === course._id)) {
        toast.error("Course already in cart")
        return
      }
      state.cart.push(course)
      commit(state)
      toast.success("Course added to cart")
    },
    // Silent: the cart page shows its own "removed · Undo" toast.
    removeFromCart: (state, action) => {
      state.cart = state.cart.filter((item) => item._id !== action.payload)
      commit(state)
    },
    // Puts a removed course back where it was (for Undo).
    restoreToCart: (state, action) => {
      const { course, index } = action.payload
      if (state.cart.some((item) => item._id === course._id)) return
      state.cart.splice(Math.min(index, state.cart.length), 0, course)
      commit(state)
    },
    // After a purchase, only the courses that were bought leave the cart.
    removeCoursesFromCart: (state, action) => {
      const ids = new Set(action.payload.map(String))
      state.cart = state.cart.filter((item) => !ids.has(String(item._id)))
      commit(state)
    },
    // Replaces the stored copies with fresh course data (prices, ratings), dropping unavailable ones.
    syncCart: (state, action) => {
      state.cart = action.payload
      commit(state)
    },
    resetCart: (state) => {
      state.cart = []
      state.total = 0
      state.totalItems = 0
      localStorage.removeItem("cart")
      localStorage.removeItem("total")
      localStorage.removeItem("totalItems")
    },
  },
})

export const { addToCart, removeFromCart, restoreToCart, removeCoursesFromCart, syncCart, resetCart } = cartSlice.actions

export default cartSlice.reducer
