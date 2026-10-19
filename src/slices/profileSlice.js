import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null,
  loading: false,
};

const profileSlice = createSlice({
  name: "profile",
  initialState: initialState,
  reducers: {
    // Persisted here so every update (login, profile edit, new photo, refresh) survives a page reload.
    setUser(state, value) {
      state.user = value.payload;
      try {
        if (value.payload) localStorage.setItem("user", JSON.stringify(value.payload));
        else localStorage.removeItem("user");
      } catch {
        // storage unavailable (private mode); the in-memory user still works
      }
    },
    setLoading(state, value) {
      state.loading = value.payload;
    },
  },
});

export const { setUser, setLoading } = profileSlice.actions;
export default profileSlice.reducer;
