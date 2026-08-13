"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthModalMode = "login" | "register";

type AuthModalContextValue = {
  open: boolean;
  mode: AuthModalMode;
  openLogin: () => void;
  openRegister: () => void;
  setMode: (mode: AuthModalMode) => void;
  closeModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>("login");

  const openLogin = useCallback(() => {
    setMode("login");
    setOpen(true);
  }, []);

  const openRegister = useCallback(() => {
    setMode("register");
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, mode, openLogin, openRegister, setMode, closeModal }),
    [open, mode, openLogin, openRegister, closeModal],
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return ctx;
}
