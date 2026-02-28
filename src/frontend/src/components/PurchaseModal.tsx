import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Loader2, ShoppingCart, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Rank, ShoppingItem } from "../backend";
import { Duration } from "../backend";
import { useCreateCheckoutSession } from "../hooks/useQueries";

interface PurchaseModalProps {
  rank: Rank | null;
  duration: Duration;
  onClose: () => void;
}

const RANK_COLORS: Record<string, string> = {
  SEAMON: "oklch(0.68 0.19 42)",
  "SEAMON+": "oklch(0.68 0.22 142)",
  MONARCH: "oklch(0.68 0.22 310)",
  CAPTAIN: "oklch(0.62 0.2 264)",
  "CAPTAIN+": "oklch(0.62 0.22 25)",
  "CUSTOM RANK": "oklch(0.78 0.16 85)",
};

export default function PurchaseModal({
  rank,
  duration,
  onClose,
}: PurchaseModalProps) {
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const createCheckout = useCreateCheckoutSession();

  if (!rank) return null;

  const rankColor = RANK_COLORS[rank.name] || "oklch(0.78 0.16 85)";
  const price =
    duration === Duration.SevenDay
      ? Number(rank.sevenDayPrice)
      : Number(rank.seasonalPrice);
  const durationLabel = duration === Duration.SevenDay ? "7 Days" : "Seasonal";
  const priceInCents = BigInt(price * 100);

  const handlePurchase = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameError("Please enter your Minecraft username.");
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 16) {
      setUsernameError("Username must be 3–16 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameError("Only letters, numbers, and underscores allowed.");
      return;
    }
    setUsernameError("");

    const origin = window.location.origin;
    const successUrl = `${origin}/?payment=success`;
    const cancelUrl = `${origin}/?payment=cancelled`;

    const items: ShoppingItem[] = [
      {
        productName: `AZORO — ${rank.name} Rank (${durationLabel})`,
        currency: "usd",
        quantity: 1n,
        priceInCents,
        productDescription: `${durationLabel} access to the ${rank.name} rank on AZORO Minecraft server for player: ${trimmed}`,
      },
    ];

    try {
      const checkoutUrl = await createCheckout.mutateAsync({
        items,
        successUrl,
        cancelUrl,
      });
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("Stripe needs to be first configured") ||
        msg.includes("not configured")
      ) {
        toast.error(
          "Stripe payments are not set up yet. Please contact the store admin.",
        );
      } else {
        toast.error("Failed to create checkout. Please try again.");
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-md rounded-2xl overflow-hidden"
          style={{
            background: "oklch(0.1 0.015 280)",
            border: `2px solid ${rankColor}60`,
            boxShadow: `0 0 60px ${rankColor}30, 0 25px 50px rgba(0,0,0,0.6)`,
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: "oklch(0.15 0.02 280)" }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div
            className="px-6 pt-6 pb-4"
            style={{
              background: `linear-gradient(135deg, ${rankColor}15, transparent)`,
              borderBottom: `1px solid ${rankColor}30`,
            }}
          >
            <div className="flex items-center gap-3 mb-1">
              <ShoppingCart className="w-5 h-5" style={{ color: rankColor }} />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Purchase
              </span>
            </div>
            <h2
              className="font-display font-black text-2xl"
              style={{ color: rankColor }}
            >
              {rank.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm font-mono">
                {durationLabel}
              </span>
              <span className="text-muted-foreground">•</span>
              <span
                className="font-display font-bold text-lg"
                style={{ color: rankColor }}
              >
                ${price} USD
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="minecraft-username"
                className="text-sm font-mono uppercase tracking-widest text-muted-foreground"
              >
                <User className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                Minecraft Username
              </Label>
              <Input
                id="minecraft-username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePurchase();
                }}
                placeholder="YourUsername"
                autoComplete="off"
                className="font-mono text-base bg-secondary border-border focus:border-ring h-11"
                style={{
                  borderColor: usernameError
                    ? "oklch(0.62 0.22 25)"
                    : undefined,
                }}
                disabled={createCheckout.isPending}
              />
              {usernameError && (
                <p
                  className="text-xs font-mono"
                  style={{ color: "oklch(0.62 0.22 25)" }}
                >
                  {usernameError}
                </p>
              )}
            </div>

            <div
              className="rounded-lg p-3 text-xs font-mono text-muted-foreground space-y-1"
              style={{ background: "oklch(0.13 0.02 280)" }}
            >
              <div>✓ Rank will be applied to your in-game account</div>
              <div>✓ Payment secured via Stripe</div>
              {duration === Duration.Seasonal && (
                <div>✓ Auto-renewed if season resets within 1 month</div>
              )}
            </div>

            <Button
              onClick={handlePurchase}
              disabled={createCheckout.isPending}
              className="w-full font-display font-black text-sm tracking-widest uppercase py-6 rounded-xl transition-all duration-200"
              style={{
                background: rankColor,
                color: "oklch(0.08 0.01 280)",
                boxShadow: `0 0 20px ${rankColor}50`,
              }}
            >
              {createCheckout.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
