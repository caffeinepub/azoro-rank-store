import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  LoginLogEntry,
  Order,
  OrderStatusCode,
  Rank,
  ShoppingItem,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

// Activity log types (defined locally since backend.d.ts is protected)
export type ActivityAction =
  | {
      __kind__: "orderDeleted";
      orderDeleted: {
        orderId: bigint;
        minecraftUsername: string;
        rankName: string;
        priceInr: bigint;
      };
    }
  | {
      __kind__: "orderStatusChanged";
      orderStatusChanged: {
        orderId: bigint;
        minecraftUsername: string;
        rankName: string;
        oldStatus: OrderStatusCode;
        newStatus: OrderStatusCode;
      };
    }
  | {
      __kind__: "adminLogin";
      adminLogin: Record<string, never>;
    }
  | {
      __kind__: "adminRemoved";
      adminRemoved: { removedPrincipal: Principal };
    };

export interface ActivityLogEntry {
  principal: Principal;
  timestamp: bigint;
  action: ActivityAction;
}

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

export function useLoginLog() {
  const { actor, isFetching } = useActor();
  return useQuery<LoginLogEntry[]>({
    queryKey: ["loginLog"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getLoginLog();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminList() {
  const { actor, isFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ["adminList"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAdminList();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useActivityLog() {
  const { actor, isFetching } = useActor();
  return useQuery<ActivityLogEntry[]>({
    queryKey: ["activityLog"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (actor as any).getActivityLog();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}
