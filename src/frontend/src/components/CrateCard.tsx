import { Button } from "@/components/ui/button";
import { Key, Minus, Plus, Tag } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export interface Crate {
  name: string;
  price: number;
  color: string;
  glowColor: string;
  blockFront: string;
  blockTop: string;
  blockRight: string;
  badge?: string;
}

export const CRATES: Crate[] = [
  {
    name: "Monthly Crate",
    price: 99,
    color: "oklch(0.62 0.22 25)",
    glowColor: "oklch(0.62 0.22 25 / 0.45)",
    blockFront: "oklch(0.62 0.22 25)",
    blockTop: "oklch(0.72 0.18 25)",
    blockRight: "oklch(0.45 0.20 25)",
    badge: "BEST VALUE",
  },
  {
    name: "Epic Crate",
    price: 79,
    color: "oklch(0.68 0.19 42)",
    glowColor: "oklch(0.68 0.19 42 / 0.45)",
    blockFront: "oklch(0.68 0.19 42)",
    blockTop: "oklch(0.78 0.15 42)",
    blockRight: "oklch(0.52 0.18 42)",
    badge: "POPULAR",
  },
  {
    name: "Party Crate",
    price: 49,
    color: "oklch(0.78 0.16 85)",
    glowColor: "oklch(0.78 0.16 85 / 0.45)",
    blockFront: "oklch(0.78 0.16 85)",
    blockTop: "oklch(0.88 0.12 85)",
    blockRight: "oklch(0.62 0.15 85)",
  },
  {
    name: "Classic Crate",
    price: 19,
    color: "oklch(0.68 0.22 310)",
    glowColor: "oklch(0.68 0.22 310 / 0.45)",
    blockFront: "oklch(0.68 0.22 310)",
    blockTop: "oklch(0.78 0.18 310)",
    blockRight: "oklch(0.52 0.20 310)",
  },
];

interface CrateCardProps {
  crate: Crate;
  onBuy: (crate: Crate, quantity: number) => void;
  index: number;
}

function MinecraftBlock({
  front,
  top,
  right,
  size = 56,
  glow,
  isHovered,
}: {
  front: string;
  top: string;
  right: string;
  size?: number;
  glow: string;
  isHovered: boolean;
}) {
  const s = size;
  const skewY = 0.35; // radians approximating 30deg isometric
  const topH = Math.round(s * 0.35);
  const rightW = Math.round(s * 0.3);

  return (
    <div
      style={{
        position: "relative",
        width: s + rightW,
        height: s + topH,
        filter: isHovered ? `drop-shadow(0 0 12px ${glow})` : "none",
        transition: "filter 0.3s ease",
      }}
    >
      {/* Top face */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: rightW,
          width: s,
          height: topH,
          background: top,
          transform: `skewX(${Math.atan(rightW / topH)}rad) scaleY(1)`,
          transformOrigin: "bottom left",
          imageRendering: "pixelated",
          borderTop: `1px solid ${top}`,
          zIndex: 3,
        }}
      />
      {/* Left/front face */}
      <div
        style={{
          position: "absolute",
          top: topH,
          left: rightW,
          width: s,
          height: s,
          background: `linear-gradient(135deg, ${front} 0%, ${front} 60%, ${right} 100%)`,
          imageRendering: "pixelated",
          zIndex: 2,
        }}
      />
      {/* Right face */}
      <div
        style={{
          position: "absolute",
          top: topH,
          left: 0,
          width: rightW,
          height: s,
          background: right,
          transform: `skewY(${skewY}rad)`,
          transformOrigin: "top right",
          imageRendering: "pixelated",
          zIndex: 1,
        }}
      />
      {/* Pixel detail lines on front face */}
      <div
        style={{
          position: "absolute",
          top: topH + Math.round(s * 0.3),
          left: rightW + Math.round(s * 0.1),
          width: Math.round(s * 0.8),
          height: 2,
          background: `${front}80`,
          zIndex: 4,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: topH + Math.round(s * 0.6),
          left: rightW + Math.round(s * 0.1),
          width: Math.round(s * 0.8),
          height: 2,
          background: `${front}80`,
          zIndex: 4,
        }}
      />
    </div>
  );
}

export default function CrateCard({ crate, onBuy, index }: CrateCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const isBundleDeal = quantity === 3;
  const originalTotal = crate.price * quantity;
  const discountedTotal = isBundleDeal
    ? Math.round(originalTotal * 0.75)
    : originalTotal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
    >
      <div
        className="relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.1 0.015 280) 0%, oklch(0.12 0.02 280) 100%)",
          border: isHovered
            ? `1px solid ${crate.color}`
            : "1px solid oklch(0.18 0.03 280)",
          boxShadow: isHovered
            ? `0 8px 40px ${crate.glowColor}, 0 0 0 1px ${crate.color}40`
            : "0 4px 20px oklch(0 0 0 / 0.4)",
          transition: "box-shadow 0.3s ease, border-color 0.3s ease",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Corner pixel decorations */}
        <div
          className="absolute top-0 left-0 w-3 h-3"
          style={{
            background: crate.color,
            clipPath: "polygon(0 0, 100% 0, 0 100%)",
            opacity: 0.6,
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-3 h-3"
          style={{
            background: crate.color,
            clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
            opacity: 0.6,
          }}
        />

        {/* Badge */}
        {crate.badge && !isBundleDeal && (
          <div
            className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded text-xs font-mono font-bold tracking-widest"
            style={{
              background: crate.color,
              color: "oklch(0.08 0.01 280)",
            }}
          >
            {crate.badge}
          </div>
        )}

        {/* Bundle deal badge - shown when qty=3 */}
        {isBundleDeal && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded text-xs font-mono font-bold tracking-widest flex items-center gap-1"
            style={{
              background: "oklch(0.68 0.22 142)",
              color: "oklch(0.08 0.01 280)",
              boxShadow: "0 0 12px oklch(0.68 0.22 142 / 0.7)",
            }}
          >
            <Tag className="w-2.5 h-2.5" />
            SAVE 25%
          </motion.div>
        )}

        <div className="p-5 flex flex-col gap-4">
          {/* Block icon */}
          <div className="flex justify-center pt-2">
            <motion.div
              animate={isHovered ? { y: [-2, 2, -2] } : { y: 0 }}
              transition={
                isHovered
                  ? { duration: 1.2, repeat: Number.POSITIVE_INFINITY }
                  : {}
              }
            >
              <MinecraftBlock
                front={crate.blockFront}
                top={crate.blockTop}
                right={crate.blockRight}
                size={52}
                glow={crate.glowColor}
                isHovered={isHovered}
              />
            </motion.div>
          </div>

          {/* Divider */}
          <div
            className="h-px w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${crate.color}60, transparent)`,
            }}
          />

          {/* Name & icon */}
          <div className="flex items-center gap-2">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: `${crate.color}22`,
                border: `1px solid ${crate.color}40`,
                boxShadow: isHovered ? `0 0 12px ${crate.color}50` : "none",
                transition: "box-shadow 0.3s ease",
              }}
            >
              <Key className="w-4 h-4" style={{ color: crate.color }} />
            </div>
            <h3
              className="font-display font-black text-base tracking-tight leading-tight"
              style={{
                color: crate.color,
                textShadow: isHovered ? `0 0 10px ${crate.color}` : "none",
                transition: "text-shadow 0.3s ease",
              }}
            >
              {crate.name}
            </h3>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-0.5">
            {isBundleDeal ? (
              <>
                <div className="flex items-end gap-1.5">
                  <span
                    className="font-display font-black text-3xl leading-none"
                    style={{ color: "oklch(0.68 0.22 142)" }}
                  >
                    ₹{discountedTotal}
                  </span>
                  <span className="mb-0.5 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    INR
                  </span>
                </div>
                <span className="text-xs font-mono line-through text-muted-foreground">
                  ₹{originalTotal} original
                </span>
              </>
            ) : (
              <div className="flex items-end gap-1.5">
                <span
                  className="font-display font-black text-3xl leading-none"
                  style={{ color: crate.color }}
                >
                  ₹{crate.price}
                </span>
                <span className="mb-0.5 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  INR
                </span>
              </div>
            )}
          </div>

          {/* Quantity selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Quantity
            </span>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setQuantity(qty)}
                  className="flex-1 py-1.5 rounded-lg text-sm font-mono font-bold transition-all duration-200"
                  style={{
                    background:
                      quantity === qty
                        ? qty === 3
                          ? "oklch(0.68 0.22 142)"
                          : crate.color
                        : `${crate.color}15`,
                    color:
                      quantity === qty ? "oklch(0.08 0.01 280)" : crate.color,
                    border:
                      quantity === qty
                        ? `1px solid ${qty === 3 ? "oklch(0.68 0.22 142)" : crate.color}`
                        : `1px solid ${crate.color}30`,
                    boxShadow:
                      quantity === qty && qty === 3
                        ? "0 0 10px oklch(0.68 0.22 142 / 0.5)"
                        : quantity === qty
                          ? `0 0 10px ${crate.color}40`
                          : "none",
                  }}
                >
                  {qty === 3 ? "3 🔥" : qty}
                </button>
              ))}
            </div>
            {isBundleDeal && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-mono text-center"
                style={{ color: "oklch(0.68 0.22 142)" }}
              >
                Bundle deal — you save ₹{originalTotal - discountedTotal}!
              </motion.p>
            )}
          </div>

          {/* Loot info */}
          <div
            className="text-xs font-mono rounded px-2 py-1.5 text-center"
            style={{
              background: `${crate.color}15`,
              border: `1px solid ${crate.color}30`,
              color: crate.color,
            }}
          >
            📦 {quantity === 1 ? "One-time" : `${quantity}x`} unlock{" "}
            {quantity > 1 ? "keys" : "key"}
          </div>

          {/* Buy button */}
          <Button
            onClick={() => onBuy(crate, quantity)}
            className="w-full font-display font-bold tracking-widest uppercase text-sm py-5 rounded-lg transition-all duration-200"
            style={{
              background: isHovered
                ? isBundleDeal
                  ? "oklch(0.68 0.22 142)"
                  : crate.color
                : isBundleDeal
                  ? "oklch(0.68 0.22 142 / 0.25)"
                  : `${crate.color}22`,
              color: isHovered
                ? "oklch(0.08 0.01 280)"
                : isBundleDeal
                  ? "oklch(0.68 0.22 142)"
                  : crate.color,
              border: isBundleDeal
                ? "1px solid oklch(0.68 0.22 142 / 0.6)"
                : `1px solid ${crate.color}60`,
              boxShadow:
                isHovered && isBundleDeal
                  ? "0 0 20px oklch(0.68 0.22 142 / 0.5)"
                  : isHovered
                    ? `0 0 20px ${crate.color}50`
                    : "none",
            }}
          >
            {isBundleDeal ? (
              <>
                <Tag className="w-3.5 h-3.5 mr-1.5" />
                Buy 3 Keys — ₹{discountedTotal}
              </>
            ) : (
              <>Buy {quantity > 1 ? `${quantity} Keys` : "Key"}</>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
