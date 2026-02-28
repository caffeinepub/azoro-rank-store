import { Button } from "@/components/ui/button";
import {
  Crown,
  type LucideProps,
  Shield,
  Sparkles,
  Star,
  Sword,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Rank } from "../backend";
import { Duration } from "../backend";

interface RankCardProps {
  rank: Rank;
  duration: Duration;
  onBuy: (rank: Rank, duration: Duration) => void;
  index: number;
}

const RANK_STYLES: Record<
  string,
  {
    cardClass: string;
    colorHex: string;
    colorStyle: string;
    glowColor: string;
    icon: React.ComponentType<LucideProps>;
    isPremium?: boolean;
    badge?: string;
  }
> = {
  SEAMON: {
    cardClass: "rank-card-seamon",
    colorHex: "#f97316",
    colorStyle: "oklch(0.68 0.19 42)",
    glowColor: "oklch(0.68 0.19 42 / 0.4)",
    icon: Zap,
  },
  "SEAMON+": {
    cardClass: "rank-card-seamonplus",
    colorHex: "#22c55e",
    colorStyle: "oklch(0.68 0.22 142)",
    glowColor: "oklch(0.68 0.22 142 / 0.4)",
    icon: Shield,
  },
  MONARCH: {
    cardClass: "rank-card-monarch",
    colorHex: "#a855f7",
    colorStyle: "oklch(0.68 0.22 310)",
    glowColor: "oklch(0.68 0.22 310 / 0.4)",
    icon: Crown,
  },
  CAPTAIN: {
    cardClass: "rank-card-captain",
    colorHex: "#3b82f6",
    colorStyle: "oklch(0.62 0.2 264)",
    glowColor: "oklch(0.62 0.2 264 / 0.4)",
    icon: Sword,
  },
  "CAPTAIN+": {
    cardClass: "rank-card-captainplus",
    colorHex: "#ef4444",
    colorStyle: "oklch(0.62 0.22 25)",
    glowColor: "oklch(0.62 0.22 25 / 0.4)",
    icon: Star,
    isPremium: true,
    badge: "POPULAR",
  },
  "CUSTOM RANK": {
    cardClass: "rank-card-custom",
    colorHex: "#eab308",
    colorStyle: "oklch(0.78 0.16 85)",
    glowColor: "oklch(0.78 0.16 85 / 0.5)",
    icon: Sparkles,
    isPremium: true,
    badge: "ULTIMATE",
  },
};

function getRankStyle(name: string) {
  return RANK_STYLES[name] || RANK_STYLES.SEAMON;
}

export default function RankCard({
  rank,
  duration,
  onBuy,
  index,
}: RankCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const style = getRankStyle(rank.name);
  const Icon = style.icon;

  const price =
    duration === Duration.SevenDay
      ? Number(rank.sevenDayPrice)
      : Number(rank.seasonalPrice);

  const durationLabel = duration === Duration.SevenDay ? "7 Days" : "Seasonal";

  const isPremium = style.isPremium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className={`relative ${isPremium ? "md:col-span-1" : ""}`}
    >
      <div
        className={`
          relative flex flex-col rounded-xl border bg-card overflow-hidden cursor-pointer
          card-hover-glow ${style.cardClass}
          ${isPremium ? "border-2" : "border"}
        `}
        style={{
          background: isPremium
            ? "linear-gradient(135deg, oklch(0.1 0.015 280) 0%, oklch(0.13 0.03 280) 100%)"
            : "oklch(0.1 0.015 280)",
          boxShadow: isHovered
            ? `0 8px 40px ${style.glowColor}, 0 0 0 1px ${style.colorStyle}`
            : "0 4px 20px oklch(0 0 0 / 0.4)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Premium shimmer overlay */}
        {isPremium && isHovered && (
          <div className="pointer-events-none absolute inset-0 animate-shimmer z-10 rounded-xl" />
        )}

        {/* Badge */}
        {style.badge && (
          <div
            className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded text-xs font-mono font-bold tracking-widest"
            style={{
              background: style.colorStyle,
              color: "oklch(0.08 0.01 280)",
            }}
          >
            {style.badge}
          </div>
        )}

        {/* Pixel corner decorations */}
        <div
          className="absolute top-0 left-0 w-3 h-3"
          style={{
            background: style.colorStyle,
            clipPath: "polygon(0 0, 100% 0, 0 100%)",
            opacity: 0.6,
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-3 h-3"
          style={{
            background: style.colorStyle,
            clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
            opacity: 0.6,
          }}
        />

        <div className="p-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: `${style.colorStyle}22`,
                border: `1px solid ${style.colorStyle}40`,
                boxShadow: isHovered
                  ? `0 0 16px ${style.colorStyle}50`
                  : "none",
                transition: "box-shadow 0.3s ease",
              }}
            >
              <Icon className="w-5 h-5" style={{ color: style.colorStyle }} />
            </div>
            <div>
              <div className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-0.5">
                Tier {Number(rank.tier)}
              </div>
              <h3
                className="font-display font-black text-xl tracking-tight leading-none"
                style={{
                  color: style.colorStyle,
                  textShadow: isHovered
                    ? `0 0 12px ${style.colorStyle}`
                    : "none",
                  transition: "text-shadow 0.3s ease",
                }}
              >
                {rank.name}
              </h3>
            </div>
          </div>

          {/* Divider */}
          <div
            className="h-px w-full"
            style={{
              background: `linear-gradient(90deg, ${style.colorStyle}60, transparent)`,
            }}
          />

          {/* Price */}
          <div className="flex items-end gap-2">
            <span
              className="font-display font-black text-4xl leading-none"
              style={{ color: style.colorStyle }}
            >
              {price}
            </span>
            <div className="mb-1">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                coins
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                {durationLabel}
              </div>
            </div>
          </div>

          {/* Duration info */}
          <div
            className="text-xs font-mono rounded px-2 py-1.5 text-center"
            style={{
              background: `${style.colorStyle}15`,
              border: `1px solid ${style.colorStyle}30`,
              color: style.colorStyle,
            }}
          >
            {duration === Duration.SevenDay
              ? "⏱ 7 Days Access"
              : "🏆 Lasts Until Season Reset"}
          </div>

          {/* Buy button */}
          <Button
            onClick={() => onBuy(rank, duration)}
            className="w-full font-display font-bold tracking-widest uppercase text-sm py-5 rounded-lg transition-all duration-200"
            style={{
              background: isHovered
                ? style.colorStyle
                : `${style.colorStyle}22`,
              color: isHovered ? "oklch(0.08 0.01 280)" : style.colorStyle,
              border: `1px solid ${style.colorStyle}60`,
              boxShadow: isHovered ? `0 0 20px ${style.colorStyle}50` : "none",
            }}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
