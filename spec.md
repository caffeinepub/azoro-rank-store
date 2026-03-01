# Azoro Rank Store

## Current State
Full Minecraft rank & crate store with:
- Public store (ranks + crates) with Discord ticket purchase flow
- Admin panel at /admin with code-based login ("azoroontop")
- Order management: view all orders (rank + crate), mark fulfilled, delete
- Admin management: list admins, remove admin
- Login Activity Log: shows which principals logged in as admin and when

## Requested Changes (Diff)

### Add
- **Activity Log** section in admin panel that shows every admin action:
  - Order deleted (who deleted it, which order, username, rank name, price)
  - Order status changed (who changed it, from what status to what status)
  - Admin login (who logged in and when)
  - Admin removed (who was removed)
- New backend `getActivityLog()` query (admin only) returning `ActivityLogEntry[]`
- New `ActivityLogEntry` type: `{ principal, timestamp, action: ActivityAction }`
- New `ActivityAction` variant with: `#orderDeleted`, `#orderStatusChanged`, `#adminLogin`, `#adminRemoved`
- Backend records activity in: deleteOrder, updateOrderStatus, loginWithAdminCode, removeAdmin
- New `useActivityLog` query hook in useQueries.ts

### Modify
- Replace the current "Login Activity Log" section (which only shows logins) with a unified "Actions Log" section
- Actions Log shows all activity types (not just logins) with appropriate labels, colored by action type
- Each row shows: who did it (truncated principal), what action, relevant details, and timestamp

### Remove
- The standalone "Login Activity Log" section (replaced by the unified Actions Log)

## Implementation Plan
1. The backend already has ActivityLogEntry and ActivityAction types in main.mo, and activityLog list declared -- but the functions don't record to it yet and getActivityLog is missing. Backend needs regeneration.
2. Add `getActivityLog` to backend.d.ts interface
3. Add `ActivityLogEntry` and `ActivityAction` types to backend.d.ts
4. Add `useActivityLog` hook in useQueries.ts
5. Replace Login Activity Log section in AdminPage.tsx with a new "Actions Log" section that calls useActivityLog and renders action details per type
