import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { FailedCartItem } from "@/types/cart";

interface CartNoticeState {
  /** Items the server refused on the last offline-cart sync. */
  failedItems: FailedCartItem[];
  /** Checkout asked for the direct bank transfer instructions. */
  bankTransferOpen: boolean;
}

const initialState: CartNoticeState = {
  failedItems: [],
  bankTransferOpen: false,
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
    openBankTransfer: (state) => {
      state.bankTransferOpen = true;
    },
    closeBankTransfer: (state) => {
      state.bankTransferOpen = false;
    },
  },
});

export const {
  setFailedCartItems,
  clearFailedCartItems,
  openBankTransfer,
  closeBankTransfer,
} = cartNoticeSlice.actions;

export default cartNoticeSlice.reducer;
