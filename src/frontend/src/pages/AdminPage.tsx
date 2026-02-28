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
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Package,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Duration, OrderStatusCode } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllOrders,
  useIsAdmin,
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

export default function AdminPage() {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const { actor } = useActor();

  const queryClient = useQueryClient();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimFailed, setClaimFailed] = useState(false);

  const { data: isStripeConfigured, isLoading: stripeConfigLoading } =
    useIsStripeConfigured();
  const [stripeKey, setStripeKey] = useState("");
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [isSavingStripe, setIsSavingStripe] = useState(false);

  const handleClaimAdmin = async () => {
    if (!actor) return;
    setIsClaiming(true);
    setClaimSuccess(false);
    setClaimFailed(false);
    try {
      const result = await actor.claimFirstAdmin();
      if (result) {
        setClaimSuccess(true);
        await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
      } else {
        setClaimFailed(true);
      }
    } catch {
      setClaimFailed(true);
    } finally {
      setIsClaiming(false);
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
            <p className="text-muted-foreground font-mono text-sm max-w-xs mb-6">
              Your account does not have admin privileges.
            </p>

            {/* Claim Admin section */}
            <div
              className="w-full max-w-sm rounded-2xl p-6 mb-6 text-center"
              style={{
                background: "oklch(0.1 0.015 280)",
                border: "1px solid oklch(0.78 0.16 85 / 0.25)",
                boxShadow: "0 0 30px oklch(0.78 0.16 85 / 0.06)",
              }}
            >
              <Shield
                className="w-8 h-8 mx-auto mb-3"
                style={{ color: "oklch(0.78 0.16 85)" }}
              />
              <p className="font-mono text-xs text-muted-foreground mb-5">
                If no admin has been claimed yet, you can become the first
                admin.
              </p>

              <Button
                onClick={handleClaimAdmin}
                disabled={isClaiming || claimSuccess}
                className="w-full font-display font-bold uppercase tracking-widest text-sm"
                style={{
                  background: "oklch(0.78 0.16 85)",
                  color: "oklch(0.08 0.01 280)",
                  boxShadow: isClaiming
                    ? "none"
                    : "0 0 16px oklch(0.78 0.16 85 / 0.3)",
                }}
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Claiming…
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Claim Admin
                  </>
                )}
              </Button>

              {claimSuccess && (
                <p
                  className="font-mono text-xs text-center mt-3"
                  style={{ color: "oklch(0.68 0.22 142)" }}
                >
                  You are now admin! Refreshing…
                </p>
              )}

              {claimFailed && !isClaiming && (
                <p
                  className="font-mono text-xs text-center mt-3"
                  style={{ color: "oklch(0.62 0.22 25)" }}
                >
                  Admin has already been claimed by another account.
                </p>
              )}
            </div>

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
