import { useMutation, useQuery } from "@tanstack/react-query";
import type { Order, Rank, ShoppingItem, UserProfile } from "../backend";
import { useActor } from "./useActor";

export function useRanks() {
  const { actor, isFetching } = useActor();
  return useQuery<Rank[]>({
    queryKey: ["ranks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRanks();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isStripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOrdersByUsername(username: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["orders", username],
    queryFn: async () => {
      if (!actor || !username) return [];
      return actor.getOrdersByUsername(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useAllOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["allOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      items,
      successUrl,
      cancelUrl,
    }: {
      items: ShoppingItem[];
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createCheckoutSession(items, successUrl, cancelUrl);
    },
  });
}
