import { configureStore, createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: null, user: null },
  reducers: {
    setAuth: (state, { payload }) => { state.token = payload.token; state.user = payload.user },
    logout: (state) => { state.token = null; state.user = null }
  }
})

const compareSlice = createSlice({
  name: 'compare',
  initialState: { items: [] }, // [{productId, title, price, brand, category}]
  reducers: {
    addToCompare: (state, { payload }) => {
      if (!state.items.find(i => i.productId === payload.productId)) {
        state.items.push(payload)
      }
    },
    removeFromCompare: (state, { payload }) => {
      state.items = state.items.filter(i => i.productId !== payload.productId)
    },
    clearCompare: (state) => { state.items = [] }
  }
})

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    setCart: (state, { payload }) => { state.items = payload || [] },
    addToCart: (state, { payload }) => {
      const idx = state.items.findIndex(i => i.productId === payload.productId)
      if (idx >= 0) state.items[idx].quantity += payload.quantity || 1
      else state.items.push({ ...payload, quantity: payload.quantity || 1 })
    },
    updateQty: (state, { payload }) => {
      const item = state.items.find(i => i.productId === payload.productId)
      if (item) item.quantity = payload.quantity
    },
    removeFromCart: (state, { payload }) => {
      state.items = state.items.filter(i => i.productId !== payload.productId)
    },
    clearCart: (state) => { state.items = [] }
  }
})

export const { setAuth, logout } = authSlice.actions
export const { setCart, addToCart, updateQty, removeFromCart, clearCart } = cartSlice.actions
export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    cart: cartSlice.reducer,
    compare: compareSlice.reducer,
  }
})

export default store
