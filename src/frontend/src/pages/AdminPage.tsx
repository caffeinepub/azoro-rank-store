import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  Package,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { Duration, OrderStatusCode } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAllOrders, useIsAdmin } from "../hooks/useQueries";

const STATUS_STYLES: Record<OrderStatusCode, { label: string; color: string }> =
  {
    [OrderStatusCode.pending]: {
      label: "Pending",
      color: "oklch(0.78 0.16 85)",
    },
    [OrderStatusCode.paid]: {
      label: "Paid",
      color: "oklch(0.68 0.22 142)",
    },
    [OrderStatusCode.fulfilled]: {
      label: "Fulfilled",
      color: "oklch(0.62 0.2 264)",
    },
  };

export default function AdminPage() {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: orders, isLoading: ordersLoading } = useAllOrders();

  const goHome = () => {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3"
        style={{
          background: "oklch(0.09 0.015 280 / 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid oklch(0.18 0.03 280)",
        }}
      >
        <div className="container max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goHome}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Shield
                className="w-4 h-4"
                style={{ color: "oklch(0.78 0.16 85)" }}
              />
              <span
                className="font-display font-black text-lg tracking-wider"
                style={{ color: "oklch(0.78 0.16 85)" }}
              >
                AZORO Admin
              </span>
            </div>
          </div>

          {isLoggedIn && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground hidden sm:block">
                {identity?.getPrincipal().toString().slice(0, 12)}…
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={clear}
                className="text-xs font-mono uppercase tracking-widest"
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-12">
        {/* Not logged in */}
        {!isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: "oklch(0.78 0.16 85 / 0.1)",
                border: "1px solid oklch(0.78 0.16 85 / 0.3)",
              }}
            >
              <Lock
                className="w-8 h-8"
                style={{ color: "oklch(0.78 0.16 85)" }}
              />
            </div>
            <h2 className="font-display font-black text-3xl mb-2 text-foreground">
              Admin Access
            </h2>
            <p className="text-muted-foreground font-mono text-sm max-w-xs mb-8">
              Sign in with Internet Identity to access the admin dashboard.
            </p>
            <Button
              onClick={login}
              disabled={isLoggingIn}
              size="lg"
              className="font-display font-bold uppercase tracking-widest px-8 py-5"
              style={{
                background: "oklch(0.78 0.16 85)",
                color: "oklch(0.08 0.01 280)",
                boxShadow: "0 0 20px oklch(0.78 0.16 85 / 0.3)",
              }}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In…
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Logged in but loading admin status */}
        {isLoggedIn && adminLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Not admin */}
        {isLoggedIn && !adminLoading && !isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: "oklch(0.62 0.22 25 / 0.1)",
                border: "1px solid oklch(0.62 0.22 25 / 0.3)",
              }}
            >
              <Lock
                className="w-8 h-8"
                style={{ color: "oklch(0.62 0.22 25)" }}
              />
            </div>
            <h2 className="font-display font-black text-3xl mb-2 text-foreground">
              Access Denied
            </h2>
            <p className="text-muted-foreground font-mono text-sm max-w-xs mb-8">
              Your account does not have admin privileges.
            </p>
            <Button
              variant="outline"
              onClick={goHome}
              className="font-mono uppercase tracking-widest text-xs"
            >
              <ArrowLeft className="w-3 h-3 mr-1.5" />
              Back to Store
            </Button>
          </motion.div>
        )}

        {/* Admin dashboard */}
        {isLoggedIn && !adminLoading && isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Orders",
                  value: orders?.length ?? 0,
                  icon: Package,
                  color: "oklch(0.78 0.16 85)",
                },
                {
                  label: "Pending",
                  value:
                    orders?.filter((o) => o.status === OrderStatusCode.pending)
                      .length ?? 0,
                  icon: Clock,
                  color: "oklch(0.78 0.16 85)",
                },
                {
                  label: "Paid",
                  value:
                    orders?.filter((o) => o.status === OrderStatusCode.paid)
                      .length ?? 0,
                  icon: CheckCircle2,
                  color: "oklch(0.68 0.22 142)",
                },
                {
                  label: "Fulfilled",
                  value:
                    orders?.filter(
                      (o) => o.status === OrderStatusCode.fulfilled,
                    ).length ?? 0,
                  icon: Users,
                  color: "oklch(0.62 0.2 264)",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="rounded-xl p-4"
                  style={{
                    background: "oklch(0.1 0.015 280)",
                    border: `1px solid ${color}30`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" style={{ color }} />
                    <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      {label}
                    </span>
                  </div>
                  <div
                    className="font-display font-black text-3xl"
                    style={{ color }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Orders table */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "oklch(0.1 0.015 280)",
                border: "1px solid oklch(0.18 0.03 280)",
              }}
            >
              <div
                className="px-6 py-4 flex items-center gap-3"
                style={{ borderBottom: "1px solid oklch(0.18 0.03 280)" }}
              >
                <Package
                  className="w-4 h-4"
                  style={{ color: "oklch(0.78 0.16 85)" }}
                />
                <h3 className="font-display font-bold text-lg">All Orders</h3>
              </div>

              {ordersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !orders || orders.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground font-mono text-sm">
                  No orders yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow
                        style={{
                          borderBottom: "1px solid oklch(0.18 0.03 280)",
                        }}
                      >
                        {[
                          "ID",
                          "Username",
                          "Rank",
                          "Duration",
                          "Price",
                          "Status",
                          "Date",
                        ].map((h) => (
                          <TableHead
                            key={h}
                            className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
                          >
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => {
                        const statusStyle =
                          STATUS_STYLES[order.status] ||
                          STATUS_STYLES[OrderStatusCode.pending];
                        const durationLabel =
                          order.duration === Duration.SevenDay
                            ? "7 Days"
                            : "Seasonal";
                        const date = new Date(
                          Number(order.createdAt) / 1_000_000,
                        ).toLocaleDateString();
                        return (
                          <TableRow
                            key={order.id.toString()}
                            className="border-b"
                            style={{ borderColor: "oklch(0.15 0.02 280)" }}
                          >
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              #{order.id.toString()}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-sm text-foreground">
                              {order.minecraftUsername}
                            </TableCell>
                            <TableCell className="font-display font-bold text-sm">
                              {order.rankName}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {durationLabel}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              ${Number(order.priceUsd)}
                            </TableCell>
                            <TableCell>
                              <span
                                className="px-2 py-0.5 rounded font-mono text-xs font-bold"
                                style={{
                                  background: `${statusStyle.color}20`,
                                  color: statusStyle.color,
                                }}
                              >
                                {statusStyle.label}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {date}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
