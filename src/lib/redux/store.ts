import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authSlice from "./slices/authSlice";
import cartSlice from "./slices/cartSlice";
import checkoutSlice from "./slices/checkoutSlice";
import offlineCartSlice from "./slices/offlineCartSlice";
import recentlyViewedSlice from "./slices/recentlyViewedSlice";

import searchSlice from "./slices/searchSlice";
import cartNoticeSlice from "./slices/cartNoticeSlice";
import { createTransform } from "redux-persist";
import { getCookie } from "@/lib/cookies";
import type { AuthState } from "./slices/authSlice";

/**
 * Neither the bearer token nor the user record reaches localStorage — both are
 * stripped on the way in and restored from the session cookies on rehydrate, so
 * a stored blob carries no credential and no PII.
 */
const stripAccessToken = createTransform<AuthState, AuthState>(
  (inboundState: AuthState) => ({
    ...inboundState,
    access_token: "",
    user: null,
  }),
  (outboundState: AuthState) => ({
    ...outboundState,
    access_token: (getCookie("access_token") as string) || "",
    user: outboundState.user ?? getCookie<AuthState["user"]>("user") ?? null,
  }),
  { whitelist: ["auth"] },
);

const persistConfig = {
  key: "root",
  storage,
  // `cart` is a server mirror — always re-fetched, never rehydrated from disk.
  // `search` stays out deliberately so stale labels are not restored.
  whitelist: ["auth", "offlineCart", "recentlyViewed"],
  transforms: [stripAccessToken],
};

const rootReducer = combineReducers({
  auth: authSlice,
  cart: cartSlice,
  cartNotice: cartNoticeSlice,
  checkout: checkoutSlice,
  offlineCart: offlineCartSlice,
  recentlyViewed: recentlyViewedSlice,
  search: searchSlice,
});

type AppState = ReturnType<typeof rootReducer>;

const persistedReducer = persistReducer<AppState>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
        ignoredPaths: ["register"],
      },
    }),
});

export const persistor = persistStore(store);

export type AppStore = typeof store;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
