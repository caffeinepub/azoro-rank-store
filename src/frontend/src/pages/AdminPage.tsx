import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Principal } from "@icp-sdk/core/principal";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Lock,
  Package,
  Shield,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Duration, OrderStatusCode } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { ActivityLogEntry } from "../hooks/useQueries";
import {
  useActivityLog,
  useAdminList,
  useAllOrders,
  useIsStripeConfigured,
} from "../hooks/useQueries";

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

const CRATE_NAMES = new Set([
  "Monthly Crate",
  "Epic Crate",
  "Party Crate",
  "Classic Crate",
]);

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const { data: adminList, isLoading: adminListLoading } = useAdminList();
  const { data: activityLog, isLoading: activityLogLoading } = useActivityLog();
  const { actor } = useActor();

  const queryClient = useQueryClient();

  // Code-based auth state
  const [adminCode, setAdminCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [codeError, setCodeError] = useState("");

  const [fulfillingOrderId, setFulfillingOrderId] = useState<bigint | null>(
    null,
  );
  const [deletingOrderId, setDeletingOrderId] = useState<bigint | null>(null);
  const [removingAdminPrincipal, setRemovingAdminPrincipal] = useState<
    string | null
  >(null);

  const { data: isStripeConfigured, isLoading: stripeConfigLoading } =
    useIsStripeConfigured();
  const [stripeKey, setStripeKey] = useState("");
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [isSavingStripe, setIsSavingStripe] = useState(false);

  const handleCodeLogin = async () => {
    const code = adminCode.trim();
    if (!code) {
      setCodeError("Please enter the admin code.");
      return;
    }
    setIsVerifying(true);
    setCodeError("");

    try {
      // Silently get an identity first if we don't have one
      if (!identity) {
        await login();
        // Give React time to update identity state
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Wait for actor to be available (it depends on identity)
      let attempts = 0;
      while (!actor && attempts < 20) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        attempts++;
      }

      if (!actor) {
        setCodeError("Failed to connect. Please try again.");
        setIsVerifying(false);
        return;
      }

      const success = await actor.loginWithAdminCode(code);
      if (success) {
        setIsCodeVerified(true);
        setAdminCode("");
        await queryClient.invalidateQueries({ queryKey: ["allOrders"] });
        await queryClient.invalidateQueries({
          queryKey: ["isStripeConfigured"],
        });
      } else {
        setCodeError("Wrong code. Try again.");
      }
    } catch (err) {
      console.error(err);
      setCodeError("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignOut = () => {
    clear();
    setIsCodeVerified(false);
    setAdminCode("");
    setCodeError("");
  };

  const handleFulfillOrder = async (orderId: bigint) => {
    if (!actor) return;
    setFulfillingOrderId(orderId);
    try {
      const success = await actor.updateOrderStatus(
        orderId,
        OrderStatusCode.fulfilled,
      );
      if (success) {
        toast.success("Order marked as fulfilled");
        await queryClient.invalidateQueries({ queryKey: ["allOrders"] });
      } else {
        toast.error("Failed to update order status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setFulfillingOrderId(null);
    }
  };

  const handleDeleteOrder = async (orderId: bigint) => {
    if (!actor) return;
    setDeletingOrderId(orderId);
    try {
      const success = await actor.deleteOrder(orderId);
      if (success) {
        toast.success("Order deleted");
        await queryClient.invalidateQueries({ queryKey: ["allOrders"] });
      } else {
        toast.error("Failed to delete order.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleRemoveAdmin = async (principal: Principal) => {
    if (!actor) return;
    const principalText = principal.toText();
    setRemovingAdminPrincipal(principalText);
    try {
      const success = await actor.removeAdmin(principal);
      if (success) {
        toast.success("Admin removed");
        await queryClient.invalidateQueries({ queryKey: ["adminList"] });
      } else {
        toast.error("Failed to remove admin");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove admin");
    } finally {
      setRemovingAdminPrincipal(null);
    }
  };

  const handleSaveStripe = async () => {
    const key = stripeKey.trim();
    if (!key) {
      toast.error("Please enter your Stripe secret key.");
      return;
    }
    if (!key.startsWith("sk_")) {
      toast.error("Stripe secret key must start with 'sk_'.");
      return;
    }
    if (!actor) return;
    setIsSavingStripe(true);
    try {
      await actor.setStripeConfiguration({
        secretKey: key,
        allowedCountries: [],
      });
      setStripeKey("");
      await queryClient.invalidateQueries({ queryKey: ["isStripeConfigured"] });
      toast.success("Stripe configured! Payments are now live.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save Stripe config. Please try again.");
    } finally {
      setIsSavingStripe(false);
    }
  };

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

          {isCodeVerified && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSignOut}
              className="text-xs font-mono uppercase tracking-widest"
            >
              Sign Out
            </Button>
          )}
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-12">
        {/* Code login screen */}
        {!isCodeVerified && (
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
                boxShadow: "0 0 30px oklch(0.78 0.16 85 / 0.08)",
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
              Enter the admin code to access the dashboard.
            </p>

            <div
              className="w-full max-w-sm rounded-2xl p-6"
              style={{
                background: "oklch(0.1 0.015 280)",
                border: "1px solid oklch(0.78 0.16 85 / 0.2)",
                boxShadow: "0 0 40px oklch(0.78 0.16 85 / 0.05)",
              }}
            >
              <div className="space-y-4">
                <div className="space-y-2 text-left">
                  <Label
                    htmlFor="admin-code"
                    className="text-xs font-mono uppercase tracking-widest text-muted-foreground"
                  >
                    Admin Code
                  </Label>
                  <Input
                    id="admin-code"
                    type="password"
                    value={adminCode}
                    onChange={(e) => {
                      setAdminCode(e.target.value);
                      if (codeError) setCodeError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isVerifying) handleCodeLogin();
                    }}
                    placeholder="Enter admin code"
                    className="font-mono text-sm bg-secondary border-border"
                    disabled={isVerifying || isLoggingIn}
                    autoFocus
                  />
                  {codeError && (
                    <p
                      className="font-mono text-xs"
                      style={{ color: "oklch(0.62 0.22 25)" }}
                    >
                      {codeError}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleCodeLogin}
                  disabled={isVerifying || isLoggingIn || !adminCode.trim()}
                  className="w-full font-display font-bold uppercase tracking-widest text-sm"
                  style={{
                    background: "oklch(0.78 0.16 85)",
                    color: "oklch(0.08 0.01 280)",
                    boxShadow:
                      isVerifying || isLoggingIn
                        ? "none"
                        : "0 0 20px oklch(0.78 0.16 85 / 0.3)",
                  }}
                >
                  {isVerifying || isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Login
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Admin dashboard */}
        {isCodeVerified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stats row */}
            {(() => {
              const rankOrders =
                orders?.filter((o) => !CRATE_NAMES.has(o.rankName)) ?? [];
              const crateOrders =
                orders?.filter((o) => CRATE_NAMES.has(o.rankName)) ?? [];
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Rank Orders",
                      value: rankOrders.length,
                      icon: Package,
                      color: "oklch(0.78 0.16 85)",
                    },
                    {
                      label: "Crate Orders",
                      value: crateOrders.length,
                      icon: Key,
                      color: "oklch(0.68 0.22 310)",
                    },
                    {
                      label: "Pending",
                      value:
                        orders?.filter(
                          (o) => o.status === OrderStatusCode.pending,
                        ).length ?? 0,
                      icon: Clock,
                      color: "oklch(0.78 0.16 85)",
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
              );
            })()}

            {/* Stripe Configuration */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "oklch(0.1 0.015 280)",
                border: isStripeConfigured
                  ? "1px solid oklch(0.68 0.22 142 / 0.4)"
                  : "1px solid oklch(0.62 0.22 25 / 0.4)",
              }}
            >
              <div
                className="px-6 py-4 flex items-center gap-3"
                style={{ borderBottom: "1px solid oklch(0.18 0.03 280)" }}
              >
                <CreditCard
                  className="w-4 h-4"
                  style={{
                    color: isStripeConfigured
                      ? "oklch(0.68 0.22 142)"
                      : "oklch(0.62 0.22 25)",
                  }}
                />
                <h3 className="font-display font-bold text-lg">
                  Stripe Payments
                </h3>
                <span
                  className="ml-auto px-2 py-0.5 rounded font-mono text-xs font-bold"
                  style={
                    stripeConfigLoading
                      ? {
                          background: "oklch(0.2 0.03 280)",
                          color: "oklch(0.6 0.01 280)",
                        }
                      : isStripeConfigured
                        ? {
                            background: "oklch(0.68 0.22 142 / 0.15)",
                            color: "oklch(0.68 0.22 142)",
                          }
                        : {
                            background: "oklch(0.62 0.22 25 / 0.15)",
                            color: "oklch(0.62 0.22 25)",
                          }
                  }
                >
                  {stripeConfigLoading
                    ? "Checking…"
                    : isStripeConfigured
                      ? "Active"
                      : "Not configured"}
                </span>
              </div>

              <div className="px-6 py-5">
                {isStripeConfigured ? (
                  <div className="space-y-4">
                    <p className="font-mono text-sm text-muted-foreground">
                      Stripe is active. Players can purchase ranks now. To
                      update your key, enter a new one below.
                    </p>
                    <div className="space-y-2">
                      <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        New Stripe Secret Key
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showStripeKey ? "text" : "password"}
                            value={stripeKey}
                            onChange={(e) => setStripeKey(e.target.value)}
                            placeholder="sk_live_..."
                            className="font-mono text-sm bg-secondary border-border pr-10"
                            disabled={isSavingStripe}
                          />
                          <button
                            type="button"
                            onClick={() => setShowStripeKey((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showStripeKey ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <Button
                          onClick={handleSaveStripe}
                          disabled={isSavingStripe || !stripeKey.trim()}
                          style={{
                            background: "oklch(0.68 0.22 142)",
                            color: "oklch(0.08 0.01 280)",
                          }}
                        >
                          {isSavingStripe ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Update"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="font-mono text-sm text-muted-foreground">
                      Enter your Stripe secret key to activate payments. Get it
                      from{" "}
                      <a
                        href="https://dashboard.stripe.com/apikeys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        style={{ color: "oklch(0.78 0.16 85)" }}
                      >
                        dashboard.stripe.com/apikeys
                      </a>
                      .
                    </p>
                    <div className="space-y-2">
                      <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        Stripe Secret Key
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showStripeKey ? "text" : "password"}
                            value={stripeKey}
                            onChange={(e) => setStripeKey(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveStripe();
                            }}
                            placeholder="sk_live_... or sk_test_..."
                            className="font-mono text-sm bg-secondary border-border pr-10"
                            disabled={isSavingStripe}
                          />
                          <button
                            type="button"
                            onClick={() => setShowStripeKey((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showStripeKey ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <Button
                          onClick={handleSaveStripe}
                          disabled={isSavingStripe || !stripeKey.trim()}
                          style={{
                            background: "oklch(0.78 0.16 85)",
                            color: "oklch(0.08 0.01 280)",
                            boxShadow: "0 0 16px oklch(0.78 0.16 85 / 0.3)",
                          }}
                        >
                          {isSavingStripe ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rank Orders table */}
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
                <h3 className="font-display font-bold text-lg">Rank Orders</h3>
              </div>

              {ordersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !orders ||
                orders.filter((o) => !CRATE_NAMES.has(o.rankName)).length ===
                  0 ? (
                <div className="text-center py-16 text-muted-foreground font-mono text-sm">
                  No rank orders yet.
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
                          "Actions",
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
                      {orders
                        .filter((o) => !CRATE_NAMES.has(o.rankName))
                        .map((order) => {
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
                                ₹{Number(order.priceUsd)}
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
                              <TableCell>
                                <div className="flex gap-2 flex-wrap">
                                  {order.status ===
                                  OrderStatusCode.fulfilled ? (
                                    <span
                                      className="flex items-center gap-1 font-mono text-xs"
                                      style={{ color: "oklch(0.62 0.2 264)" }}
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Done
                                    </span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      disabled={fulfillingOrderId === order.id}
                                      onClick={() =>
                                        handleFulfillOrder(order.id)
                                      }
                                      className="font-mono text-xs uppercase tracking-widest h-7 px-2"
                                      style={{
                                        background:
                                          "oklch(0.62 0.2 264 / 0.15)",
                                        color: "oklch(0.62 0.2 264)",
                                        border:
                                          "1px solid oklch(0.62 0.2 264 / 0.4)",
                                      }}
                                    >
                                      {fulfillingOrderId === order.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        "Mark Fulfilled"
                                      )}
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    disabled={deletingOrderId === order.id}
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="font-mono text-xs uppercase tracking-widest h-7 px-2"
                                    style={{
                                      background: "oklch(0.55 0.22 25 / 0.15)",
                                      color: "oklch(0.62 0.22 25)",
                                      border:
                                        "1px solid oklch(0.62 0.22 25 / 0.4)",
                                    }}
                                  >
                                    {deletingOrderId === order.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Delete
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* ── Admin Management ── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "oklch(0.1 0.015 280)",
                border: "1px solid oklch(0.68 0.22 310 / 0.3)",
              }}
            >
              <div
                className="px-6 py-4 flex items-center gap-3"
                style={{ borderBottom: "1px solid oklch(0.18 0.03 280)" }}
              >
                <Shield
                  className="w-4 h-4"
                  style={{ color: "oklch(0.68 0.22 310)" }}
                />
                <h3 className="font-display font-bold text-lg">
                  Admin Management
                </h3>
                <span
                  className="ml-auto px-2 py-0.5 rounded font-mono text-xs font-bold"
                  style={{
                    background: "oklch(0.68 0.22 310 / 0.15)",
                    color: "oklch(0.68 0.22 310)",
                  }}
                >
                  {adminList?.length ?? 0} admins
                </span>
              </div>

              {adminListLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !adminList || adminList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-mono text-sm">
                  No admins found.
                </div>
              ) : (
                <div className="divide-y divide-[oklch(0.15_0.02_280)]">
                  {adminList.map((principal) => {
                    const principalText = principal.toText();
                    const truncated =
                      principalText.length > 20
                        ? `${principalText.slice(0, 12)}...${principalText.slice(-6)}`
                        : principalText;
                    const isSelf =
                      principalText === identity?.getPrincipal().toText();
                    const isRemoving = removingAdminPrincipal === principalText;

                    return (
                      <div
                        key={principalText}
                        className="px-6 py-3 flex items-center justify-between gap-4"
                        style={{
                          borderBottom: "1px solid oklch(0.15 0.02 280)",
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              background: "oklch(0.68 0.22 310 / 0.12)",
                              border: "1px solid oklch(0.68 0.22 310 / 0.3)",
                            }}
                          >
                            <Shield
                              className="w-3.5 h-3.5"
                              style={{ color: "oklch(0.68 0.22 310)" }}
                            />
                          </div>
                          <span className="font-mono text-sm text-foreground truncate">
                            {truncated}
                          </span>
                          {isSelf && (
                            <span
                              className="px-2 py-0.5 rounded font-mono text-xs font-bold flex-shrink-0"
                              style={{
                                background: "oklch(0.68 0.22 142 / 0.15)",
                                color: "oklch(0.68 0.22 142)",
                              }}
                            >
                              You
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          disabled={isSelf || isRemoving}
                          onClick={() => handleRemoveAdmin(principal)}
                          className="font-mono text-xs uppercase tracking-widest h-7 px-3 flex-shrink-0"
                          style={
                            isSelf
                              ? {
                                  background: "oklch(0.15 0.02 280)",
                                  color: "oklch(0.4 0.01 280)",
                                  border: "1px solid oklch(0.2 0.02 280)",
                                  cursor: "not-allowed",
                                }
                              : {
                                  background: "oklch(0.55 0.22 25 / 0.15)",
                                  color: "oklch(0.62 0.22 25)",
                                  border: "1px solid oklch(0.62 0.22 25 / 0.4)",
                                }
                          }
                        >
                          {isRemoving ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <UserMinus className="w-3 h-3 mr-1" />
                              Remove
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Actions Log ── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "oklch(0.1 0.015 280)",
                border: "1px solid oklch(0.68 0.22 142 / 0.25)",
              }}
            >
              <div
                className="px-6 py-4 flex items-center gap-3"
                style={{ borderBottom: "1px solid oklch(0.18 0.03 280)" }}
              >
                <Activity
                  className="w-4 h-4"
                  style={{ color: "oklch(0.68 0.22 142)" }}
                />
                <h3 className="font-display font-bold text-lg">Actions Log</h3>
                <span
                  className="ml-auto px-2 py-0.5 rounded font-mono text-xs font-bold"
                  style={{
                    background: "oklch(0.68 0.22 142 / 0.15)",
                    color: "oklch(0.68 0.22 142)",
                  }}
                >
                  {activityLog ? Math.min(activityLog.length, 100) : 0} entries
                </span>
              </div>

              {activityLogLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !activityLog || activityLog.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-mono text-sm">
                  No activity recorded yet.
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
                        {["Who", "Action", "Details", "Date & Time"].map(
                          (h) => (
                            <TableHead
                              key={h}
                              className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
                            >
                              {h}
                            </TableHead>
                          ),
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...activityLog]
                        .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
                        .slice(0, 100)
                        .map((entry: ActivityLogEntry, idx: number) => {
                          const principalText = entry.principal.toText();
                          const truncated =
                            principalText.length > 20
                              ? `${principalText.slice(0, 10)}…${principalText.slice(-6)}`
                              : principalText;
                          const dateStr = new Date(
                            Number(entry.timestamp) / 1_000_000,
                          ).toLocaleString();
                          const key = `${principalText}-${entry.timestamp.toString()}-${idx}`;

                          // Render action label + details
                          let actionLabel: {
                            text: string;
                            color: string;
                            bg: string;
                          };
                          let details = "";

                          const action = entry.action;
                          if (action.__kind__ === "orderDeleted") {
                            const d = action.orderDeleted;
                            actionLabel = {
                              text: "Order Deleted",
                              color: "oklch(0.62 0.22 25)",
                              bg: "oklch(0.62 0.22 25 / 0.15)",
                            };
                            details = `Order #${d.orderId} — ${d.rankName} for ${d.minecraftUsername} (₹${Number(d.priceInr)})`;
                          } else if (action.__kind__ === "orderStatusChanged") {
                            const d = action.orderStatusChanged;
                            actionLabel = {
                              text: "Status Changed",
                              color: "oklch(0.78 0.16 85)",
                              bg: "oklch(0.78 0.16 85 / 0.15)",
                            };
                            details = `Order #${d.orderId} ${d.minecraftUsername} → ${d.newStatus}`;
                          } else if (action.__kind__ === "adminLogin") {
                            actionLabel = {
                              text: "Admin Login",
                              color: "oklch(0.68 0.22 142)",
                              bg: "oklch(0.68 0.22 142 / 0.15)",
                            };
                            details = "Logged into admin panel";
                          } else {
                            // adminRemoved
                            const d = action.adminRemoved;
                            const removedText = d.removedPrincipal.toText();
                            const removedTrunc =
                              removedText.length > 20
                                ? `${removedText.slice(0, 10)}…${removedText.slice(-6)}`
                                : removedText;
                            actionLabel = {
                              text: "Admin Removed",
                              color: "oklch(0.62 0.22 25)",
                              bg: "oklch(0.62 0.22 25 / 0.15)",
                            };
                            details = `Removed ${removedTrunc}`;
                          }

                          return (
                            <TableRow
                              key={key}
                              className="border-b"
                              style={{ borderColor: "oklch(0.15 0.02 280)" }}
                            >
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {truncated}
                              </TableCell>
                              <TableCell>
                                <span
                                  className="px-2 py-0.5 rounded font-mono text-xs font-bold whitespace-nowrap"
                                  style={{
                                    background: actionLabel.bg,
                                    color: actionLabel.color,
                                  }}
                                >
                                  {actionLabel.text}
                                </span>
                              </TableCell>
                              <TableCell className="font-mono text-xs text-foreground max-w-xs truncate">
                                {details}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                {dateStr}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Crate Orders table */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "oklch(0.1 0.015 280)",
                border: "1px solid oklch(0.68 0.22 310 / 0.25)",
              }}
            >
              <div
                className="px-6 py-4 flex items-center gap-3"
                style={{ borderBottom: "1px solid oklch(0.18 0.03 280)" }}
              >
                <Key
                  className="w-4 h-4"
                  style={{ color: "oklch(0.68 0.22 310)" }}
                />
                <h3 className="font-display font-bold text-lg">Crate Orders</h3>
                <span
                  className="ml-auto px-2 py-0.5 rounded font-mono text-xs font-bold"
                  style={{
                    background: "oklch(0.68 0.22 310 / 0.15)",
                    color: "oklch(0.68 0.22 310)",
                  }}
                >
                  {orders?.filter((o) => CRATE_NAMES.has(o.rankName)).length ??
                    0}{" "}
                  orders
                </span>
              </div>

              {ordersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !orders ||
                orders.filter((o) => CRATE_NAMES.has(o.rankName)).length ===
                  0 ? (
                <div className="text-center py-16 text-muted-foreground font-mono text-sm">
                  No crate orders yet.
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
                          "Crate",
                          "Price",
                          "Status",
                          "Date",
                          "Actions",
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
                      {orders
                        .filter((o) => CRATE_NAMES.has(o.rankName))
                        .map((order) => {
                          const statusStyle =
                            STATUS_STYLES[order.status] ||
                            STATUS_STYLES[OrderStatusCode.pending];
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
                              <TableCell
                                className="font-display font-bold text-sm"
                                style={{ color: "oklch(0.68 0.22 310)" }}
                              >
                                {order.rankName}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                ₹{Number(order.priceUsd)}
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
                              <TableCell>
                                <div className="flex gap-2 flex-wrap">
                                  {order.status ===
                                  OrderStatusCode.fulfilled ? (
                                    <span
                                      className="flex items-center gap-1 font-mono text-xs"
                                      style={{ color: "oklch(0.62 0.2 264)" }}
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Done
                                    </span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      disabled={fulfillingOrderId === order.id}
                                      onClick={() =>
                                        handleFulfillOrder(order.id)
                                      }
                                      className="font-mono text-xs uppercase tracking-widest h-7 px-2"
                                      style={{
                                        background:
                                          "oklch(0.68 0.22 310 / 0.15)",
                                        color: "oklch(0.68 0.22 310)",
                                        border:
                                          "1px solid oklch(0.68 0.22 310 / 0.4)",
                                      }}
                                    >
                                      {fulfillingOrderId === order.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        "Mark Fulfilled"
                                      )}
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    disabled={deletingOrderId === order.id}
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="font-mono text-xs uppercase tracking-widest h-7 px-2"
                                    style={{
                                      background: "oklch(0.55 0.22 25 / 0.15)",
                                      color: "oklch(0.62 0.22 25)",
                                      border:
                                        "1px solid oklch(0.62 0.22 25 / 0.4)",
                                    }}
                                  >
                                    {deletingOrderId === order.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Delete
                                      </>
                                    )}
                                  </Button>
                                </div>
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
