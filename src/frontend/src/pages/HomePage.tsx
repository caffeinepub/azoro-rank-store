import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ExternalLink,
  Key,
  Shield,
  ShoppingCart,
  Sword,
  Tag,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { SiDiscord } from "react-icons/si";
import { Duration } from "../backend";
import type { Rank } from "../backend";
import CrateCard from "../components/CrateCard";
import type { Crate } from "../components/CrateCard";
import { CRATES } from "../components/CrateCard";
import CratePurchaseModal from "../components/CratePurchaseModal";
import OrderLookup from "../components/OrderLookup";
import ParticleField from "../components/ParticleField";
import PurchaseModal from "../components/PurchaseModal";
import RankCard from "../components/RankCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRanks } from "../hooks/useQueries";

// Fallback ranks for display when backend is loading/unavailable
const FALLBACK_RANKS: Rank[] = [
  {
    name: "SEAMON",
    color: "#f97316",
    tier: 1n,
    sevenDayPrice: 15n,
    seasonalPrice: 70n,
  },
  {
    name: "SEAMON+",
    color: "#22c55e",
    tier: 2n,
    sevenDayPrice: 35n,
    seasonalPrice: 100n,
  },
  {
    name: "MONARCH",
    color: "#a855f7",
    tier: 3n,
    sevenDayPrice: 90n,
    seasonalPrice: 200n,
  },
  {
    name: "CAPTAIN",
    color: "#3b82f6",
    tier: 4n,
    sevenDayPrice: 150n,
    seasonalPrice: 300n,
  },
  {
    name: "CAPTAIN+",
    color: "#ef4444",
    tier: 5n,
    sevenDayPrice: 200n,
    seasonalPrice: 450n,
  },
  {
    name: "CUSTOM RANK",
    color: "#eab308",
    tier: 6n,
    sevenDayPrice: 250n,
    seasonalPrice: 600n,
  },
];

export default function HomePage() {
  const [duration, setDuration] = useState<Duration>(Duration.SevenDay);
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
  const [selectedCrate, setSelectedCrate] = useState<Crate | null>(null);
  const [selectedCrateQuantity, setSelectedCrateQuantity] = useState(1);
  const shopRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<HTMLDivElement>(null);

  const { data: ranksData, isLoading: ranksLoading } = useRanks();
  const { identity, login, loginStatus } = useInternetIdentity();

  const ranks = ranksData && ranksData.length > 0 ? ranksData : FALLBACK_RANKS;
  const sortedRanks = [...ranks].sort(
    (a, b) => Number(a.tier) - Number(b.tier),
  );

  const scrollToShop = () => {
    shopRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToKeys = () => {
    keysRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBuy = (rank: Rank, dur: Duration) => {
    setSelectedRank(rank);
    setDuration(dur);
  };

  const handleBuyCrate = (crate: Crate, quantity: number) => {
    setSelectedCrate(crate);
    setSelectedCrateQuantity(quantity);
  };

  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-background font-body overflow-x-hidden">
      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3">
        <div
          className="container max-w-6xl mx-auto flex items-center justify-between rounded-xl px-4 py-2.5"
          style={{
            background: "oklch(0.09 0.015 280 / 0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid oklch(0.2 0.03 280)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "oklch(0.78 0.16 85)",
                boxShadow: "0 0 16px oklch(0.78 0.16 85 / 0.5)",
              }}
            >
              <Sword className="w-4 h-4 text-background" />
            </div>
            <span
              className="font-display font-black text-lg tracking-wider glow-text-sm"
              style={{ color: "oklch(0.78 0.16 85)" }}
            >
              AZORO
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              type="button"
              onClick={scrollToShop}
              className="text-sm font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Ranks
            </button>
            <button
              type="button"
              onClick={scrollToKeys}
              className="text-sm font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Key className="w-3 h-3" />
              Keys
            </button>
            <a
              href="#order-lookup"
              className="text-sm font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Orders
            </a>
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, "", "/admin");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="text-sm font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </a>
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {identity ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "oklch(0.68 0.22 142)" }}
                />
                <span className="text-xs font-mono text-muted-foreground">
                  {identity.getPrincipal().toString().slice(0, 8)}…
                </span>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={login}
                disabled={isLoggingIn}
                className="text-xs font-mono uppercase tracking-widest"
                style={{
                  background: "oklch(0.78 0.16 85 / 0.15)",
                  color: "oklch(0.78 0.16 85)",
                  border: "1px solid oklch(0.78 0.16 85 / 0.4)",
                }}
              >
                {isLoggingIn ? (
                  "Signing in…"
                ) : (
                  <>
                    <Shield className="w-3 h-3 mr-1.5" />
                    Sign In
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* BG Image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage:
              "url('/assets/generated/hero-bg.dim_1920x1080.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Dark overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.07 0.01 280 / 0.75) 0%, oklch(0.07 0.01 280 / 0.9) 60%, oklch(0.07 0.01 280) 100%)",
          }}
        />
        {/* Pixel grid */}
        <div className="absolute inset-0 z-0 pixel-grid opacity-40" />
        {/* Particles */}
        <ParticleField />

        {/* Content */}
        <div className="relative z-10 container max-w-5xl mx-auto px-4 text-center pt-20">
          {/* Server badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full font-mono text-xs uppercase tracking-widest"
            style={{
              background: "oklch(0.78 0.16 85 / 0.1)",
              border: "1px solid oklch(0.78 0.16 85 / 0.3)",
              color: "oklch(0.78 0.16 85)",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse-glow"
              style={{ background: "oklch(0.78 0.16 85)" }}
            />
            Minecraft Server • Rank Store
          </motion.div>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-display font-black leading-none tracking-tight mb-6"
            style={{ fontSize: "clamp(5rem, 16vw, 14rem)" }}
          >
            <span
              className="glow-gold"
              style={{ color: "oklch(0.78 0.16 85)" }}
            >
              AZORO
            </span>
          </motion.h1>

          {/* Discord Boost Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <a
              href="https://discord.gg/zWATKsTFzx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105 hover:brightness-110"
              style={{
                background: "oklch(0.42 0.19 265 / 0.25)",
                border: "1px solid oklch(0.58 0.22 265 / 0.55)",
                boxShadow:
                  "0 0 24px oklch(0.55 0.22 265 / 0.4), inset 0 1px 0 oklch(0.7 0.18 265 / 0.2)",
                textDecoration: "none",
              }}
            >
              <SiDiscord
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "#7289DA" }}
              />
              <span
                className="font-mono text-sm font-bold tracking-wide"
                style={{ color: "oklch(0.88 0.1 265)" }}
              >
                Boost our Discord server
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: "oklch(0.65 0.12 265)" }}
              >
                and get
              </span>
              <span
                className="font-display font-black text-sm tracking-widest"
                style={{
                  color: "oklch(0.82 0.18 310)",
                  textShadow: "0 0 10px oklch(0.68 0.22 310 / 0.7)",
                }}
              >
                BOOSTER RANK
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: "oklch(0.65 0.12 265)" }}
              >
                in AZOROMC — FREE
              </span>
            </a>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="font-display text-xl md:text-2xl font-semibold text-muted-foreground max-w-xl mx-auto mb-3 tracking-wide"
          >
            Choose your power.{" "}
            <span style={{ color: "oklch(0.68 0.22 310)" }}>
              Rule the season.
            </span>
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="font-display text-xl md:text-2xl font-semibold mb-10 tracking-wide"
            style={{ color: "oklch(0.78 0.16 85)" }}
          >
            Stand above the rest.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Button
              onClick={scrollToShop}
              size="lg"
              className="font-display font-black text-sm uppercase tracking-widest px-8 py-6 rounded-xl group"
              style={{
                background: "oklch(0.78 0.16 85)",
                color: "oklch(0.08 0.01 280)",
                boxShadow: "0 0 30px oklch(0.78 0.16 85 / 0.4)",
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2 group-hover:animate-bounce" />
              Shop Ranks
            </Button>
            <Button
              onClick={scrollToKeys}
              size="lg"
              className="font-display font-bold text-sm uppercase tracking-widest px-8 py-6 rounded-xl group"
              style={{
                background: "oklch(0.68 0.22 310 / 0.15)",
                border: "1px solid oklch(0.68 0.22 310 / 0.5)",
                color: "oklch(0.78 0.18 310)",
                boxShadow: "0 0 20px oklch(0.68 0.22 310 / 0.2)",
              }}
            >
              <Key className="w-4 h-4 mr-2 group-hover:animate-bounce" />
              Shop Keys
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document
                  .getElementById("order-lookup")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="font-display font-bold text-sm uppercase tracking-widest px-8 py-6 rounded-xl"
              style={{
                background: "transparent",
                border: "1px solid oklch(0.3 0.04 280)",
                color: "oklch(0.85 0.01 90)",
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Check Orders
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <button
            type="button"
            onClick={scrollToShop}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-xs font-mono uppercase tracking-widest">
              Scroll
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </button>
        </motion.div>
      </section>

      {/* ── RANK STORE SECTION ── */}
      <section ref={shopRef} id="shop" className="relative py-24 px-4">
        {/* BG */}
        <div className="absolute inset-0 pixel-grid opacity-20" />

        <div className="container max-w-6xl mx-auto relative">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div
              className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full font-mono text-xs uppercase tracking-widest"
              style={{
                background: "oklch(0.78 0.16 85 / 0.1)",
                border: "1px solid oklch(0.78 0.16 85 / 0.3)",
                color: "oklch(0.78 0.16 85)",
              }}
            >
              <ShoppingCart className="w-3 h-3" />
              Rank Store
            </div>
            <h2 className="font-display font-black text-4xl md:text-5xl text-foreground mb-3">
              Choose Your{" "}
              <span style={{ color: "oklch(0.78 0.16 85)" }}>Rank</span>
            </h2>
            <p className="text-muted-foreground font-mono text-sm max-w-md mx-auto">
              Select a rank to dominate the server. Higher tiers come with
              exclusive perks and privileges.
            </p>
          </motion.div>

          {/* Duration toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex justify-center mb-12"
          >
            <div className="duration-toggle">
              <button
                type="button"
                onClick={() => setDuration(Duration.SevenDay)}
                className={`duration-toggle-item ${
                  duration === Duration.SevenDay
                    ? "duration-toggle-active"
                    : "duration-toggle-inactive"
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setDuration(Duration.Seasonal)}
                className={`duration-toggle-item ${
                  duration === Duration.Seasonal
                    ? "duration-toggle-active"
                    : "duration-toggle-inactive"
                }`}
              >
                Seasonal
              </button>
            </div>
          </motion.div>

          {/* Rank cards grid */}
          {ranksLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map(
                (id) => (
                  <div
                    key={id}
                    className="h-64 rounded-xl animate-pulse"
                    style={{ background: "oklch(0.12 0.02 280)" }}
                  />
                ),
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedRanks.map((rank, i) => (
                <RankCard
                  key={rank.name}
                  rank={rank}
                  duration={duration}
                  onBuy={handleBuy}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── KEY STORE SECTION ── */}
      <section ref={keysRef} id="keys" className="relative py-24 px-4">
        {/* BG */}
        <div className="absolute inset-0 pixel-grid opacity-20" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent, oklch(0.08 0.015 280 / 0.4), transparent)",
          }}
        />

        <div className="container max-w-6xl mx-auto relative">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div
              className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full font-mono text-xs uppercase tracking-widest"
              style={{
                background: "oklch(0.68 0.22 310 / 0.1)",
                border: "1px solid oklch(0.68 0.22 310 / 0.3)",
                color: "oklch(0.68 0.22 310)",
              }}
            >
              <Key className="w-3 h-3" />
              Key Store
            </div>
            <h2 className="font-display font-black text-4xl md:text-5xl text-foreground mb-3">
              Unlock{" "}
              <span style={{ color: "oklch(0.68 0.22 310)" }}>
                Crate Rewards
              </span>
            </h2>
            <p className="text-muted-foreground font-mono text-sm max-w-md mx-auto">
              Buy keys to open exclusive crates. Rare loot, unique items, and
              special rewards await inside.
            </p>
          </motion.div>

          {/* Bundle offer banner */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-8"
          >
            <div
              className="relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.68 0.22 310 / 0.12) 0%, oklch(0.55 0.22 290 / 0.12) 100%)",
                border: "1px solid oklch(0.68 0.22 310 / 0.45)",
                boxShadow:
                  "0 0 30px oklch(0.68 0.22 310 / 0.18), inset 0 1px 0 oklch(0.78 0.18 310 / 0.15)",
              }}
            >
              {/* Animated glow pulse */}
              <div
                className="absolute inset-0 rounded-2xl animate-pulse"
                style={{
                  background:
                    "radial-gradient(ellipse at center, oklch(0.68 0.22 310 / 0.07) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              <Tag
                className="w-5 h-5 flex-shrink-0"
                style={{ color: "oklch(0.78 0.18 310)" }}
              />
              <div className="flex flex-wrap items-center justify-center gap-2 text-center">
                <span
                  className="font-display font-black text-base sm:text-lg tracking-wide"
                  style={{ color: "oklch(0.88 0.12 310)" }}
                >
                  Buy any 3 Keys
                </span>
                <span
                  className="font-mono text-sm"
                  style={{ color: "oklch(0.65 0.1 310)" }}
                >
                  and get
                </span>
                <span
                  className="font-display font-black text-xl sm:text-2xl tracking-tight"
                  style={{
                    color: "oklch(0.68 0.22 142)",
                    textShadow: "0 0 16px oklch(0.68 0.22 142 / 0.7)",
                  }}
                >
                  25% OFF
                </span>
                <span
                  className="font-mono text-sm"
                  style={{ color: "oklch(0.65 0.1 310)" }}
                >
                  your total
                </span>
              </div>

              <div
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold tracking-widest flex-shrink-0"
                style={{
                  background: "oklch(0.68 0.22 142 / 0.2)",
                  border: "1px solid oklch(0.68 0.22 142 / 0.5)",
                  color: "oklch(0.68 0.22 142)",
                }}
              >
                Select 3 below
              </div>
            </div>
          </motion.div>

          {/* Crate cards grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {CRATES.map((crate, i) => (
              <CrateCard
                key={crate.name}
                crate={crate}
                onBuy={handleBuyCrate}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── ORDER LOOKUP ── */}
      <OrderLookup />

      {/* ── FOOTER ── */}
      <footer
        className="relative py-10 px-4"
        style={{
          background: "oklch(0.07 0.01 280)",
          borderTop: "1px solid oklch(0.15 0.02 280)",
        }}
      >
        <div className="container max-w-4xl mx-auto">
          {/* Seasonal note */}
          <div
            className="mb-8 rounded-xl px-5 py-4 text-sm font-mono text-muted-foreground"
            style={{
              background: "oklch(0.1 0.015 280)",
              border: "1px solid oklch(0.2 0.03 280)",
              lineHeight: "1.6",
            }}
          >
            <span style={{ color: "oklch(0.78 0.16 85)" }}>📌 Note:</span> If
            the season resets before 1 month of your seasonal rank purchase, you
            will automatically receive the rank again in the next season.
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "oklch(0.78 0.16 85)" }}
              >
                <Sword className="w-3.5 h-3.5 text-background" />
              </div>
              <span
                className="font-display font-black text-base tracking-widest"
                style={{ color: "oklch(0.78 0.16 85)" }}
              >
                AZORO
              </span>
            </div>

            <p className="text-xs font-mono text-muted-foreground text-center">
              © {new Date().getFullYear()}. Built with{" "}
              <span style={{ color: "oklch(0.62 0.22 25)" }}>♥</span> using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
                style={{ color: "oklch(0.78 0.16 85)" }}
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* ── PURCHASE MODAL ── */}
      {selectedRank && (
        <PurchaseModal
          rank={selectedRank}
          duration={duration}
          onClose={() => setSelectedRank(null)}
        />
      )}

      {/* ── CRATE PURCHASE MODAL ── */}
      {selectedCrate && (
        <CratePurchaseModal
          crate={selectedCrate}
          quantity={selectedCrateQuantity}
          onClose={() => {
            setSelectedCrate(null);
            setSelectedCrateQuantity(1);
          }}
        />
      )}
    </div>
  );
}
