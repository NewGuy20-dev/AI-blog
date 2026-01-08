# Emergency Lockdown System

## Overview
The emergency lockdown system allows admins to instantly lock down the entire application using a master key. The state is now properly stored in Convex DB and enforced globally.

## How It Works

### 1. Activation
- Admin navigates to `/admin/security`
- Clicks "🚨 Emergency Lockdown" button
- Enters master key when prompted
- Provides reason for lockdown
- System activates lockdown and stores state in DB

### 2. Database Storage
```typescript
// convex/schema.ts - emergencyLockdown table
{
  active: boolean,
  activatedAt: number,
  activatedBy: string,
  reason: string,
  deactivatedAt?: number
}
```

### 3. Enforcement
- Middleware checks lockdown status on every request
- If active, returns 503 "System in Emergency Lockdown"
- Admin dashboard shows red banner with lockdown details
- All non-admin tokens are blacklisted
- Security event logged with critical severity

### 4. Key Functions

**Convex Functions:**
- `security.setEmergencyLockdown` - Activates lockdown
- `security.getEmergencyLockdown` - Checks if lockdown is active
- `security.deactivateEmergencyLockdown` - Deactivates lockdown
- `security.blacklistAllNonAdminTokens` - Blocks all user sessions

**API Routes:**
- `POST /api/security/emergency-lockdown` - Trigger lockdown (requires master key)
- `GET /api/security/lockdown-status` - Check current status

**Middleware:**
- `checkEmergencyLockdown()` - Queries Convex for active lockdown
- Blocks all requests if lockdown is active

## Master Key
- Stored in `adminMasterKey` table
- 256-character cryptographic key
- Required for all critical admin actions
- Initialize with: `convex run admin:initializeMasterKey`

## Testing
1. Get master key from Convex dashboard or initialize it
2. Navigate to `/admin/security`
3. Click emergency lockdown button
4. Enter master key
5. Verify red banner appears
6. Try accessing any route - should get 503 error
7. Check Convex DB - `emergencyLockdown` table should have active record

## Deactivation
To deactivate lockdown, you'll need to:
1. Get the lockdown document ID from Convex
2. Call `security.deactivateEmergencyLockdown` with the ID
3. Or manually update the `active` field to `false` in Convex dashboard

## Discord Alerts
When lockdown is activated, a critical alert is sent to Discord webhook with:
- 🚨 EMERGENCY LOCKDOWN ACTIVATED header
- Timestamp
- Reason
- Actions taken
- @everyone mention
