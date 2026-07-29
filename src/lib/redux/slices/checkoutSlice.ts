import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Address } from "@/types/ApiResponse";

export interface CheckoutState {
  selectedAddress: Address | null;
  orderNote: string;
  useWallet: boolean;
  promoCode: string;
  idempotencyKey: string;
}

const initialState: CheckoutState = {
  selectedAddress: null,
  orderNote: "",
  useWallet: false,
  promoCode: "",
  idempotencyKey: "",
};

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    setSelectedAddress: (state, action: PayloadAction<Address | null>) => {
      state.selectedAddress = action.payload;
    },
    setOrderNote: (state, action: PayloadAction<string>) => {
      state.orderNote = action.payload;
    },
    setUseWallet: (state, action: PayloadAction<boolean>) => {
      state.useWallet = action.payload;
    },
    setPromoCode: (state, action: PayloadAction<string>) => {
      state.promoCode = action.payload;
    },
    setIdempotencyKey: (state, action: PayloadAction<string>) => {
      state.idempotencyKey = action.payload;
    },
  },
});

export const {
  setSelectedAddress,
  setOrderNote,
  setUseWallet,
  setPromoCode,
  setIdempotencyKey,
} = checkoutSlice.actions;
export default checkoutSlice.reducer;
