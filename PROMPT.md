You are tasked with fixing security and functionality issues in an AI blog application's SSH-based emergency lockdown system. This system allows ONLY SSH-authenticated lockdown toggles from authorized devices - there is NO web UI for activating lockdown.

## ARCHITECTURE CLARIFICATION

**SSH-Only Lockdown Design:**
- Lockdown can ONLY be toggled via: `npm run lockdown:toggle on/off`
- Requires SSH private key signature authentication
- Admin UI shows lockdown STATUS only (read-only)
- NO master-key-based UI activation

**Flow:**
1. Admin registers their SSH public key once (with master key)
2. To toggle lockdown: Run CLI script with SSH private key
3. Admin UI displays current lockdown status but cannot activate

---

## CRITICAL FIXES (SSH-Only Focus)

### Fix #1: Remove Admin UI Lockdown Activation
**Files:** 
- `src/app/admin/security/page.tsx`
- `src/app/api/security/emergency-lockdown/route.ts` (DELETE THIS FILE)

**Changes Required:**
1. **In `src/app/admin/security/page.tsx`:**
   - Remove the "Emergency Lockdown" button completely
   - Keep only the lockdown status banner (read-only)
   - Add informational text:
   ```tsx
   <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
     <h3 className="font-semibold text-yellow-900 mb-2">
       🔐 SSH-Only Lockdown
     </h3>
     <p className="text-sm text-yellow-800 mb-2">
       Emergency lockdown can only be toggled via SSH authentication from authorized devices.
     </p>
     <code className="block bg-yellow-100 p-2 rounded text-xs">
       npm run lockdown:toggle on  # Activate lockdown<br/>
       npm run lockdown:toggle off # Deactivate lockdown
     </code>
   </div>
Remove all master key prompt logic
Remove the POST request to /api/security/emergency-lockdown
Delete entire file: src/app/api/security/emergency-lockdown/route.ts
This route is not needed for SSH-only design
Master key validation was only for UI-based activation
Fix #2: No Authentication for Device Registration (STILL CRITICAL)
File: scripts/register-device.ts
Problem: Master key is prompted but never validated.
Fix: (Same as before - this is still needed for initial device registration)

Fix #3: Single Device Limitation (STILL CRITICAL)
File: convex/security.ts
Problem: Only first device works; multiple SSH keys won't work.
Fix: (Same as before - support device lookup by fingerprint)

Fix #4: Race Condition in Lockdown Toggle (STILL HIGH PRIORITY)
File: src/app/api/security/lockdown-toggle/route.ts
Fix: (Same as before - atomic toggle operation)

Fix #5: No Cleanup for Expired Challenges (STILL HIGH PRIORITY)
Fix: (Same as before - cron job to cleanup)

Fix #6: Middleware Performance Issue (STILL HIGH PRIORITY)
Fix: (Same as before - add caching)

Fix #7: No Rate Limiting on Challenge Generation (STILL HIGH PRIORITY)
Fix: (Same as before - rate limit challenge endpoint)

Fix #8: Missing Environment Variable Validation (STILL HIGH PRIORITY)
Fix: (Same as before - validate env vars in scripts)

MEDIUM PRIORITY FIXES (SSH-Focused)
Fix #9: No Device Management (STILL NEEDED)
Add functions to list/remove authorized SSH devices.

Fix #10: Admin UI Lockdown Status Enhancement
File: src/app/admin/security/page.tsx
Add:

Read-only lockdown status display
List of authorized devices (name, fingerprint, added date)
Instructions for using CLI commands
No activation button
Example UI:

<div className="space-y-4">
  {/* Status Banner */}
  {lockdownStatus.active && (
    <div className="bg-red-50 border border-red-200 rounded p-4">
      <h3 className="font-semibold text-red-900">🚨 Lockdown Active</h3>
      <p>Reason: {lockdownStatus.reason}</p>
      <p>Activated by: {lockdownStatus.activatedBy}</p>
      <p className="text-sm text-red-700 mt-2">
        To deactivate: <code>npm run lockdown:toggle off</code>
      </p>
    </div>
  )}

  {/* SSH-Only Info */}
  <div className="bg-blue-50 border border-blue-200 rounded p-4">
    <h3 className="font-semibold text-blue-900 mb-2">SSH-Only Control</h3>
    <p className="text-sm text-blue-800">
      Lockdown can only be toggled from authorized devices using SSH authentication.
    </p>
  </div>

  {/* Authorized Devices */}
  <div className="bg-white border rounded p-4">
    <h3 className="font-semibold mb-2">Authorized Devices</h3>
    {/* List devices from convex query */}
  </div>
</div>
Fix #11: Remove Dead Code
Delete unused activateEmergencyLockdown function (already deleted with route removal).

Fix #12: Missing Audit Trail (STILL NEEDED)
Log device registration as security event.

Fix #13-22: (Same as before)
NEW ISSUE: Missing Master Key Functions
Problem: api.admin.getMasterKey is called in device registration but doesn't exist.
Fix: Create convex/admin.ts:

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getMasterKey = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("adminMasterKey").first();
  }
});

export const setMasterKey = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("adminMasterKey").first();
    if (existing) {
      throw new Error("Master key already set");
    }
    return await ctx.db.insert("adminMasterKey", {
      key: args.key,
      createdAt: Date.now()
    });
  }
});
This is still needed for device registration authentication.

UPDATED VERIFICATION CHECKLIST
After implementing fixes:

 Admin UI does NOT have lockdown activation button
 Admin UI shows read-only lockdown status
 Admin UI shows SSH CLI instructions
 /api/security/emergency-lockdown route is deleted
 Device registration validates master key
 Multiple SSH devices can be registered
 npm run lockdown:toggle on activates lockdown
 npm run lockdown:toggle off deactivates lockdown
 Challenges expire and cleanup automatically
 Middleware caches lockdown status
 Rate limiting prevents challenge abuse
 All security events are logged
KEY ARCHITECTURAL POINTS
NO browser-based lockdown activation - only SSH CLI
Master key - only used for initial device registration
SSH private key - required for all lockdown toggle operations
Admin UI - status display only, not control panel
Single point of control - your laptop with SSH key
This design ensures that even if an attacker compromises the web application, they cannot activate or deactivate lockdown without physical access to your laptop's SSH private key.
