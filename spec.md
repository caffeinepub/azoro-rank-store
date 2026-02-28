# Azoro Rank Store

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- A rank store website for the Azoro Minecraft server
- Six rank tiers with two duration options each (7 Days and Seasonal):
  - CUSTOM RANK: 7D = 250 coins | Seasonal = 600 coins
  - CAPTAIN+: 7D = 200 coins | Seasonal = 450 coins
  - CAPTAIN: 7D = 150 coins | Seasonal = 300 coins
  - MONARCH: 7D = 90 coins | Seasonal = 200 coins
  - SEAMON+: 7D = 35 coins | Seasonal = 100 coins
  - SEAMON: 7D = 15 coins | Seasonal = 70 coins
- Each rank has a name, description, color/tier indicator, and pricing
- Duration types: "7 Days" (temporary access) and "Seasonal" (lasts until season reset)
- Seasonal rank note: if season resets before 1 month of purchase, rank is automatically given in the next season
- Payment processed via Stripe checkout on the website
- Order/purchase tracking: store customer Minecraft username, rank selected, duration, payment status
- Admin view to see all orders

### Modify
- Nothing (new project)

### Remove
- Nothing (new project)

## Implementation Plan
1. Backend (Motoko):
   - Define rank catalog (name, tier, 7D price, seasonal price, color)
   - Order record: id, minecraft_username, rank_name, duration, price, status (pending/paid/fulfilled), timestamp
   - Create order function (returns Stripe session info)
   - Get orders by username
   - Admin: get all orders, update order status
   - Stripe webhook handler to mark orders as paid

2. Frontend:
   - Hero section with Azoro branding and tagline "Choose your power. Rule the season. Stand above the rest."
   - Rank cards grid showing all 6 ranks with tier badge, prices for both durations
   - Duration toggle (7D / Seasonal) on each card or globally
   - "Buy Now" button on each card opens a purchase modal asking for Minecraft username, then redirects to Stripe checkout
   - Order success/cancel pages
   - Footer note about seasonal rank policy
   - Optional: simple order lookup by Minecraft username
