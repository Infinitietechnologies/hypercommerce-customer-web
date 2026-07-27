// Auth sheet state. Kept outside React because the sheet has several triggers
// — the header renders one per breakpoint, the location gate has its own, and a
// protected page can request it via ?auth=required — and they must all drive a
// single sheet rather than each opening their own.
type AuthMode = "login" | "register" | "forgot";

type AuthSheetState = {
  isOpen: boolean;
  mode: AuthMode;
  /** Where to send the visitor once they are signed in. */
  next?: string;
};

let state: AuthSheetState = { isOpen: false, mode: "login" };

const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export const authSheetStore = {
  getState: (): AuthSheetState => state,

  open: (options: { mode?: AuthMode; next?: string } = {}) => {
    state = { isOpen: true, mode: options.mode ?? "login", next: options.next };
    emit();
  },

  close: () => {
    state = { ...state, isOpen: false };
    emit();
  },

  setMode: (mode: AuthMode) => {
    state = { ...state, mode };
    emit();
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
