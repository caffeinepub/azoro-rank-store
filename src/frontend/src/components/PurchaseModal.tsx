import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ExternalLink, ShoppingCart, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { SiDiscord } from "react-icons/si";
import type { Rank } from "../backend";
import { Duration } from "../backend";

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

const DISCORD_INVITE = "https://discord.gg/zWATKsTFzx";

export default function PurchaseModal({
  rank,
  duration,
  onClose,
}: PurchaseModalProps) {
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [step, setStep] = useState<"username" | "discord">("username");

  if (!rank) return null;

  const rankColor = RANK_COLORS[rank.name] || "oklch(0.78 0.16 85)";
  const price =
    duration === Duration.SevenDay
      ? Number(rank.sevenDayPrice)
      : Number(rank.seasonalPrice);
  const durationLabel = duration === Duration.SevenDay ? "7 Days" : "Seasonal";

  const handleContinue = () => {
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
    setStep("discord");
  };

  const handleClose = () => {
    setStep("username");
    setUsername("");
    setUsernameError("");
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
            border: `2px solid ${rankColor}60`,
            boxShadow: `0 0 60px ${rankColor}30, 0 25px 50px rgba(0,0,0,0.6)`,
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

                <div
                  className="rounded-lg p-3 text-xs font-mono text-muted-foreground space-y-1"
                  style={{ background: "oklch(0.13 0.02 280)" }}
                >
                  <div>✓ Rank applied to your in-game account</div>
                  <div>✓ Payment handled via Discord ticket</div>
                  {duration === Duration.Seasonal && (
                    <div>✓ Auto-renewed if season resets within 1 month</div>
                  )}
                </div>

                <Button
                  onClick={handleContinue}
                  className="w-full font-display font-black text-sm tracking-widest uppercase py-6 rounded-xl transition-all duration-200"
                  style={{
                    background: rankColor,
                    color: "oklch(0.08 0.01 280)",
                    boxShadow: `0 0 20px ${rankColor}50`,
                  }}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continue
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
                    background: `${rankColor}10`,
                    border: `1px solid ${rankColor}30`,
                  }}
                >
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                    Order Summary
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-muted-foreground">
                      Rank
                    </span>
                    <span
                      className="font-display font-black text-sm"
                      style={{ color: rankColor }}
                    >
                      {rank.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-muted-foreground">
                      Duration
                    </span>
                    <span className="font-mono text-sm text-foreground">
                      {durationLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-muted-foreground">
                      Price
                    </span>
                    <span
                      className="font-display font-bold text-base"
                      style={{ color: rankColor }}
                    >
                      ${price} USD
                    </span>
                  </div>
                  <div
                    className="pt-2 mt-2"
                    style={{ borderTop: `1px solid ${rankColor}20` }}
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

                {/* Instructions */}
                <div
                  className="rounded-lg p-4 text-sm font-mono text-muted-foreground space-y-2"
                  style={{ background: "oklch(0.13 0.02 280)" }}
                >
                  <p className="text-foreground font-bold text-xs uppercase tracking-widest mb-2">
                    How to complete your purchase:
                  </p>
                  <div className="flex gap-2">
                    <span style={{ color: rankColor }}>1.</span>
                    <span>
                      Click the Discord button below to join our server.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span style={{ color: rankColor }}>2.</span>
                    <span>Open a ticket in the server.</span>
                  </div>
                  <div className="flex gap-2">
                    <span style={{ color: rankColor }}>3.</span>
                    <span>
                      Tell us your username{" "}
                      <span className="text-foreground font-bold">
                        {username.trim()}
                      </span>{" "}
                      and the rank{" "}
                      <span style={{ color: rankColor }} className="font-bold">
                        {rank.name}
                      </span>{" "}
                      ({durationLabel}).
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
