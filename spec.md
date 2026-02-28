# Azoro Rank Store

## Current State
Full-stack Minecraft rank store. Backend has `claimFirstAdmin()` so the first logged-in user becomes admin. However, `AccessControl.isAdmin` internally calls `getUserRole` which traps with "User is not registered" for any principal not yet in the roles map. This causes `isCallerAdmin()` to throw instead of returning `false`, making the Claim Admin flow fail silently.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- `isAdmin` helper in access-control must safely return `false` for principals not yet registered (no trap)

### Remove
- Nothing

## Implementation Plan
1. Regenerate backend with `isAdmin` returning `false` safely for unknown principals (switch on `userRoles.get(caller)` instead of calling `getUserRole` which traps)
2. Keep all existing functions: claimFirstAdmin, createOrder, updateOrderStatus, getAllOrders, getOrdersByUsername, getRanks, isStripeConfigured, setStripeConfiguration, getCallerUserProfile, saveCallerUserProfile
