"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  changePassword,
  fetchMe,
  login,
  logout,
  logoutAll,
} from "@/lib/api/auth";
import type { ChangePasswordPayload, LoginPayload } from "@/types/auth";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useAuth() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    // A 401 is an answer, not a transient failure worth retrying.
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (admin) => {
      // Never let one admin see another session's cached data.
      queryClient.clear();
      queryClient.setQueryData(authKeys.me, admin);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(authKeys.me, null);
      router.replace("/admin/login");
    },
  });
}

export function useLogoutAll() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logoutAll,
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(authKeys.me, null);
      router.replace("/admin/login");
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
    onSuccess: (admin) => {
      queryClient.setQueryData(authKeys.me, admin);
    },
  });
}
