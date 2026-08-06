import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { FailedCartItem } from "@/types/cart";

interface CartNoticeState {
  /** Items the server refused on the last offline-cart sync. */
  failedItems: FailedCartItem[];
}

const initialState: CartNoticeState = {
  failedItems: [],
};

const cartNoticeSlice = createSlice({
  name: "cartNotice",
  initialState,
  reducers: {
    setFailedCartItems: (state, action: PayloadAction<FailedCartItem[]>) => {
      state.failedItems = action.payload;
    },
    clearFailedCartItems: (state) => {
      state.failedItems = [];
    },
  },
});

export const { setFailedCartItems, clearFailedCartItems } =
  cartNoticeSlice.actions;

export default cartNoticeSlice.reducer;
