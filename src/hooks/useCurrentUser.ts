"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api/clientFetch";
import type { AuthUserLike } from "@/lib/auth/userDisplay";

export type CurrentUser = AuthUserLike & { id: string };

type MeResponse = { user: CurrentUser | null };

type State = {
  user: CurrentUser | null;
  loading: boolean;
};

export function useCurrentUser() {
  const [state, setState] = useState<State>({ user: null, loading: true });

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<MeResponse>("/api/auth/me");
      setState({ user: data.user, loading: false });
    } catch {
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh, isAuthenticated: Boolean(state.user) };
}
