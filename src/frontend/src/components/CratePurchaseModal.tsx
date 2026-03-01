import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  ExternalLink,
  Key,
  Loader2,
  Tag,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { SiDiscord } from "react-icons/si";
import { Duration } from "../backend";
import { useActor } from "../hooks/useActor";
import type { Crate } from "./CrateCard";

interface CratePurchaseModalProps {
  crate: Crate | null;
  quantity: number;
  onClose: () => void;
}

const DISCORD_INVITE = "https://discord.gg/zWATKsTFzx";

export default function CratePurchaseModal({
  crate,
  quantity,
  onClose,
}: CratePurchaseModalProps) {
  const { actor } = useActor();
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [step, setStep] = useState<"username" | "discord">("username");
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [saveOrderError, setSaveOrderError] = useState("");

  if (!crate) return null;

  const crateColor = crate.color;
  const isBundleDeal = quantity === 3;
  const originalTotal = crate.price * quantity;
  const finalTotal = isBundleDeal
    ? Math.round(originalTotal * 0.75)
    : originalTotal;
  const savings = originalTotal - finalTotal;

  const handleContinue = async () => {
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
      setUsernameError(
        "Minecraft usernames can only contain letters, numbers, and underscores.",
      );
      return;
    }
    setUsernameError("");
    setSaveOrderError("");

    if (actor) {
      setIsSavingOrder(true);
      try {
        await actor.createOrder(
          trimmed,
          quantity > 1 ? `${crate.name} x${quantity}` : crate.name,
          Duration.SevenDay,
          BigInt(finalTotal),
        );
      } catch (err) {
        console.error("Failed to save crate order:", err);
        setSaveOrderError(
          "Order couldn't be saved, but you can still open a ticket.",
        );
      } finally {
        setIsSavingOrder(false);
      }
    }

    setStep("discord");
  };

  const handleClose = () => {
    setStep("username");
    setUsername("");
    setUsernameError("");
    setSaveOrderError("");
    onClose();
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
          if (e.target === e.currentTarget) handleClose();
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
            border: `2px solid ${crateColor}60`,
            boxShadow: `0 0 60px ${crateColor}30, 0 25px 50px rgba(0,0,0,0.6)`,
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
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
              background: `linear-gradient(135deg, ${crateColor}15, transparent)`,
              borderBottom: `1px solid ${crateColor}30`,
            }}
          >
            <div className="flex items-center gap-3 mb-1">
              <Key className="w-5 h-5" style={{ color: crateColor }} />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Purchase Key{quantity > 1 ? "s" : ""}
              </span>
            </div>
            <h2
              className="font-display font-black text-2xl"
              style={{ color: crateColor }}
            >
              {crate.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm font-mono">
                {quantity > 1 ? `${quantity}× keys` : "One-time unlock"}
              </span>
              {quantity > 1 && <span className="text-muted-foreground">•</span>}
              {isBundleDeal ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm line-through text-muted-foreground">
                    ₹{originalTotal}
                  </span>
                  <span
                    className="font-display font-bold text-lg"
                    style={{ color: "oklch(0.68 0.22 142)" }}
                  >
                    ₹{finalTotal} INR
                  </span>
                  <span
                    className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: "oklch(0.68 0.22 142 / 0.2)",
                      color: "oklch(0.68 0.22 142)",
                      border: "1px solid oklch(0.68 0.22 142 / 0.4)",
                    }}
                  >
                    25% OFF
                  </span>
                </div>
              ) : (
                <span
                  className="font-display font-bold text-lg"
                  style={{ color: crateColor }}
                >
                  ₹{finalTotal} INR
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <AnimatePresence mode="wait">
            {step === "username" ? (
              <motion.div
                key="username-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-5 space-y-5"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="crate-minecraft-username"
                    className="text-sm font-mono uppercase tracking-widest text-muted-foreground"
                  >
                    <User className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                    Minecraft Username
                  </Label>
                  <Input
                    id="crate-minecraft-username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleContinue();
                    }}
                    placeholder="YourUsername"
                    autoComplete="off"
                    className="font-mono text-base bg-secondary border-border focus:border-ring h-11"
                    style={{
                      borderColor: usernameError
                        ? "oklch(0.62 0.22 25)"
                        : undefined,
                    }}
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

                {/* Bundle deal highlight */}
                {isBundleDeal && (
                  <div
                    className="rounded-lg p-3 flex items-center gap-2 text-xs font-mono"
                    style={{
                      background: "oklch(0.68 0.22 142 / 0.12)",
                      border: "1px solid oklch(0.68 0.22 142 / 0.4)",
                      color: "oklch(0.68 0.22 142)",
                    }}
                  >
                    <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      <span className="font-bold">Bundle deal applied!</span> 3
                      keys for ₹{finalTotal} (you save ₹{savings})
                    </span>
                  </div>
                )}

                <div
                  className="rounded-lg p-3 text-xs font-mono text-muted-foreground space-y-1"
                  style={{ background: "oklch(0.13 0.02 280)" }}
                >
                  <div>
                    ✓ Key{quantity > 1 ? "s" : ""} delivered to your in-game
                    account
                  </div>
                  <div>✓ Payment handled via Discord ticket</div>
                  <div>
                    ✓ Use key{quantity > 1 ? "s" : ""} to open your crate
                    {quantity > 1 ? "s" : ""} in-game
                  </div>
                </div>

                <Button
                  onClick={handleContinue}
                  disabled={isSavingOrder}
                  className="w-full font-display font-black text-sm tracking-widest uppercase py-6 rounded-xl transition-all duration-200"
                  style={{
                    background: isBundleDeal
                      ? "oklch(0.68 0.22 142)"
                      : crateColor,
                    color: "oklch(0.08 0.01 280)",
                    boxShadow: isSavingOrder
                      ? "none"
                      : isBundleDeal
                        ? "0 0 20px oklch(0.68 0.22 142 / 0.5)"
                        : `0 0 20px ${crateColor}50`,
                  }}
                >
                  {isSavingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Continue
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="discord-step"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-5 space-y-5"
              >
                {/* Order summary */}
                <div
                  className="rounded-xl p-4 space-y-2"
                  style={{
                    background: isBundleDeal
                      ? "oklch(0.68 0.22 142 / 0.08)"
                      : `${crateColor}10`,
                    border: isBundleDeal
                      ? "1px solid oklch(0.68 0.22 142 / 0.35)"
                      : `1px solid ${crateColor}30`,
                  }}
                >
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                    Order Summary
                  </p>

                  {/* Bundle deal label */}
                  {isBundleDeal && (
                    <div
                      className="flex items-center gap-1.5 mb-2 text-xs font-mono font-bold"
                      style={{ color: "oklch(0.68 0.22 142)" }}
                    >
                      <Tag className="w-3 h-3" />
                      3-Key Bundle — 25% Off Applied
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-muted-foreground">
                      Crate
                    </span>
                    <span
                      className="font-display font-black text-sm"
                      style={{ color: crateColor }}
                    >
                      {crate.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-muted-foreground">
                      Quantity
                    </span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {quantity}×
                    </span>
                  </div>
                  {isBundleDeal && (
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-muted-foreground">
                        Original
                      </span>
                      <span className="font-mono text-sm line-through text-muted-foreground">
                        ₹{originalTotal}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-muted-foreground">
                      {isBundleDeal ? "After Discount" : "Price"}
                    </span>
                    <span
                      className="font-display font-bold text-base"
                      style={{
                        color: isBundleDeal
                          ? "oklch(0.68 0.22 142)"
                          : crateColor,
                      }}
                    >
                      ₹{finalTotal} INR
                      {isBundleDeal && (
                        <span className="ml-1.5 text-xs font-mono">(−25%)</span>
                      )}
                    </span>
                  </div>
                  <div
                    className="pt-2 mt-2"
                    style={{
                      borderTop: `1px solid ${isBundleDeal ? "oklch(0.68 0.22 142 / 0.2)" : `${crateColor}20`}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-muted-foreground">
                        Username
                      </span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {username.trim()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save order warning */}
                {saveOrderError && (
                  <p
                    className="text-xs font-mono text-center"
                    style={{ color: "oklch(0.78 0.16 85)" }}
                  >
                    ⚠ {saveOrderError}
                  </p>
                )}

                {/* Instructions */}
                <div
                  className="rounded-lg p-4 text-sm font-mono text-muted-foreground space-y-2"
                  style={{ background: "oklch(0.13 0.02 280)" }}
                >
                  <p className="text-foreground font-bold text-xs uppercase tracking-widest mb-2">
                    How to complete your purchase:
                  </p>
                  <div className="flex gap-2">
                    <span style={{ color: crateColor }}>1.</span>
                    <span>
                      Click the Discord button below to join our server.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span style={{ color: crateColor }}>2.</span>
                    <span>
                      Go to the{" "}
                      <span className="text-foreground font-bold">#shop</span>{" "}
                      channel and create a ticket there{" "}
                      <span className="italic">
                        (not in the ticket channel)
                      </span>
                      .
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span style={{ color: crateColor }}>3.</span>
                    <span>
                      Tell us your username{" "}
                      <span className="text-foreground font-bold">
                        {username.trim()}
                      </span>
                      , {quantity > 1 ? `${quantity}× ` : ""}
                      <span style={{ color: crateColor }} className="font-bold">
                        {crate.name}
                      </span>{" "}
                      {isBundleDeal ? (
                        <>
                          (₹{finalTotal} —{" "}
                          <span style={{ color: "oklch(0.68 0.22 142)" }}>
                            bundle deal
                          </span>
                          ).
                        </>
                      ) : (
                        <>(₹{finalTotal}).</>
                      )}
                    </span>
                  </div>
                </div>

                {/* Discord CTA */}
                <a
                  href={DISCORD_INVITE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-5 rounded-xl font-display font-black text-sm tracking-widest uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "#5865F2",
                    color: "#ffffff",
                    boxShadow:
                      "0 0 30px #5865F260, 0 4px 20px rgba(88,101,242,0.4)",
                    textDecoration: "none",
                  }}
                >
                  <SiDiscord className="w-5 h-5" />
                  Open Discord Ticket
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>

                <p className="text-center text-xs font-mono text-muted-foreground">
                  Payment is handled manually via Discord ticket.
                </p>

                {/* Back link */}
                <button
                  type="button"
                  onClick={() => setStep("username")}
                  className="w-full text-xs font-mono text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  ← Edit username
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
