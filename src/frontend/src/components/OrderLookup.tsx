import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Clock,
  Loader2,
  type LucideProps,
  Package,
  Search,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Duration, OrderStatusCode } from "../backend";
import { useOrdersByUsername } from "../hooks/useQueries";

const STATUS_CONFIG: Record<
  OrderStatusCode,
  { label: string; color: string; icon: React.ComponentType<LucideProps> }
> = {
  [OrderStatusCode.pending]: {
    label: "Pending",
    color: "oklch(0.78 0.16 85)",
    icon: Clock,
  },
  [OrderStatusCode.paid]: {
    label: "Paid",
    color: "oklch(0.68 0.22 142)",
    icon: CheckCircle2,
  },
  [OrderStatusCode.fulfilled]: {
    label: "Fulfilled",
    color: "oklch(0.62 0.2 264)",
    icon: CheckCircle2,
  },
};

export default function OrderLookup() {
  const [inputValue, setInputValue] = useState("");
  const [searchUsername, setSearchUsername] = useState("");

  const {
    data: orders,
    isLoading,
    isFetching,
  } = useOrdersByUsername(searchUsername);

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (trimmed) setSearchUsername(trimmed);
  };

  return (
    <section
      id="order-lookup"
      className="relative py-20 px-4"
      style={{
        background: "oklch(0.08 0.012 280)",
        borderTop: "1px solid oklch(0.18 0.03 280)",
      }}
    >
      <div className="container max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Package
              className="w-5 h-5"
              style={{ color: "oklch(0.78 0.16 85)" }}
            />
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Order Center
            </span>
          </div>
          <h2 className="font-display font-black text-3xl text-foreground">
            Check Your Order
          </h2>
          <p className="text-muted-foreground mt-2 text-sm font-mono">
            Enter your Minecraft username to view order status
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: "oklch(0.1 0.015 280)",
            border: "1px solid oklch(0.2 0.03 280)",
          }}
        >
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="YourMinecraftUsername"
              className="font-mono h-11 bg-secondary border-border"
            />
            <Button
              onClick={handleSearch}
              disabled={!inputValue.trim() || isLoading || isFetching}
              className="h-11 px-5 font-display font-bold uppercase tracking-widest text-xs"
              style={{
                background: "oklch(0.78 0.16 85)",
                color: "oklch(0.08 0.01 280)",
              }}
            >
              {isLoading || isFetching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {searchUsername && orders && orders.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <XCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground font-mono text-sm">
                No orders found for{" "}
                <span className="text-foreground font-bold">
                  {searchUsername}
                </span>
              </p>
            </div>
          )}

          {orders && orders.length > 0 && (
            <div className="space-y-3">
              {orders.map((order) => {
                const status =
                  STATUS_CONFIG[order.status] ||
                  STATUS_CONFIG[OrderStatusCode.pending];
                const StatusIcon = status.icon;
                const durationLabel =
                  order.duration === Duration.SevenDay ? "7 Days" : "Seasonal";

                return (
                  <div
                    key={order.id.toString()}
                    className="rounded-xl p-4 flex items-center gap-4"
                    style={{
                      background: "oklch(0.13 0.02 280)",
                      border: `1px solid ${status.color}30`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${status.color}20` }}
                    >
                      <StatusIcon
                        className="w-5 h-5"
                        style={{ color: status.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-sm truncate">
                        {order.rankName}
                        <span className="font-mono font-normal text-xs text-muted-foreground ml-2">
                          {durationLabel}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground mt-0.5">
                        Order #{order.id.toString()} •{" "}
                        {new Date(
                          Number(order.createdAt) / 1_000_000,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div
                        className="text-xs font-mono font-bold px-2 py-1 rounded-full"
                        style={{
                          background: `${status.color}20`,
                          color: status.color,
                        }}
                      >
                        {status.label}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground mt-1">
                        ${Number(order.priceUsd)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
