> **Verification policy (Aug 2026):** MYXCROW uses SMS OTP at registration only. No ID/document KYC. See [docs/PHONE_VERIFICATION.md](docs/PHONE_VERIFICATION.md).

# MVP Simplification - phone verification Requirements Removed

**Date:** February 11, 2026  
**Status:** ✅ Complete

## Overview

Simplified the registration process to remove all phone verification and face matching requirements for the MVP. Users can now register with just basic information. Smile ID (removed) integration will be added later when the API is ready.

## Changes Made

### 1. Frontend (`apps/web/pages/register.tsx`)
- ✅ **Removed Step 2** (Identity Verification) - now single-step registration
- ✅ **Removed document upload (removed) fields** (front and back)
- ✅ **Removed selfie capture** requirement
- ✅ **Removed Ghana Card number field** completely
- ✅ **Simplified schema** - only requires: email, password, firstName, lastName, phone, role
- ✅ **Changed to JSON submission** instead of FormData/multipart
- ✅ **Removed face matching score** display logic
- ✅ **Cleaner, simpler UI** - single form, no multi-step wizard

### 2. Backend DTO (`services/api/src/modules/auth/dto/register.dto.ts`)
- ✅ **Removed `ghanaCardNumber` field** completely
- ✅ Users register with just: email, password, firstName, lastName, phone, role

### 3. Backend Service (`services/api/src/modules/auth/auth.service.ts`)
- ✅ **Removed Ghana Card number handling**
- ✅ Removed the else-if block that stored card number only
- ✅ phone verification processing no longer expects Ghana Card number
- ✅ Made file uploads **optional**
- ✅ Only processes phone verification files if they are provided
- ✅ Updated error message to clarify files are optional
- ✅ Registration works with or without files

### 4. Backend Service (`services/api/src/modules/auth/auth.service.ts`)
- ℹ️ **No changes needed** - already handles optional files correctly
- ℹ️ Sets `kycStatus` to `PENDING` by default
- ℹ️ Only processes phone verification if files are provided

## What Still Works

✅ **Optional phone verification**: If you want to test with phone verification files, you can still upload them  
✅ **Existing users**: All existing users with phone verification data remain unchanged  
✅ **Admin phone verification review**: The admin phone verification review page still works for users who submitted phone verification  
✅ **Database schema**: No database changes needed

## What's Disabled/Removed

❌ **document upload (removed)s** in registration form  
❌ **Selfie capture** in registration form  
❌ **Face matching** during registration  
❌ **Multi-step registration** wizard  
❌ **Ghana Card number requirement**

## Future Integration: Smile ID (removed)

When you're ready to integrate Smile ID (removed):

1. **Apply for Smile ID (removed) API** credentials
2. **Update phone verification service** to use Smile ID (removed) instead of self-hosted matching
3. **Add phone verification page** where users can complete verification after registration
4. **Update admin review** to show Smile ID (removed) verification results

## Files to Review Later

These files contain old face matching logic that can be cleaned up when Smile ID (removed) is integrated:

- `services/api/src/modules/phone verification/phone verification.service.ts` - Contains old face matching logic
- `apps/web/components/SelfieCapture.tsx` - Selfie component (can be reused for Smile ID (removed))
- `apps/web/pages/phone verification.tsx` - phone verification page (update for Smile ID (removed))
- `apps/web/pages/admin/phone verification-review.tsx` - Admin review (update for Smile ID (removed))

## Testing

To test the new simplified registration:

1. Go to `/register`
2. Fill in:
   - First Name
   - Last Name
   - Email
   - Phone (Ghana format: +233XXXXXXXXX or 0XXXXXXXXX)
   - Account Type (Buyer/Seller)
   - Password (min 8 characters)
3. Click "Create Account"
4. Should redirect to dashboard immediately

## Notes

- Users created without phone verification will have `kycStatus: PENDING`
- You can add a phone verification flow later as a separate step
- The platform is now fully functional for MVP testing without phone verification barriers
- When Smile ID (removed) is ready, you can make phone verification mandatory for certain actions (e.g., creating escrows over a certain amount)

## Deployment

Changes have been committed:
```bash
git commit -m "feat: simplify registration - remove phone verification/face matching requirements for MVP"
```

Push to deploy:
```bash
git push origin main
```

Render will automatically rebuild and deploy both services.
