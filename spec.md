# Azoro Rank Store

## Current State
Full rank store with 6 rank tiers, 7D/Seasonal toggle, Stripe checkout via PurchaseModal, and admin panel. Players could enter their Minecraft username and be redirected to Stripe for payment.

## Requested Changes (Diff)

### Add
- Discord ticket button in PurchaseModal linking to https://discord.gg/zWATKsTFzx
- Instructions telling players to open a ticket in Discord to complete payment

### Modify
- PurchaseModal: replace the Stripe checkout flow with a Discord ticket flow. After entering username, the "Proceed to Payment" button should open https://discord.gg/zWATKsTFzx in a new tab. Show clear instructions that payment is done via Discord ticket.
- Remove Stripe-related info text ("Payment secured via Stripe") and replace with Discord ticket instructions.

### Remove
- Stripe checkout API call (useCreateCheckoutSession) from PurchaseModal
- Payment status banner logic tied to Stripe redirects (success/cancelled query params) can stay but is less relevant now

## Implementation Plan
1. Rewrite PurchaseModal to remove all Stripe/checkout logic
2. After username validation, show a summary card with rank, duration, price, and username
3. Button opens Discord link (https://discord.gg/zWATKsTFzx) in new tab
4. Add instruction text: "Open a ticket in our Discord server to complete your payment. Tell us your username and the rank you want."
