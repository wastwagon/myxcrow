# MVP Simplification - KYC Requirements Removed

**Date:** February 11, 2026  
**Status:** ✅ Complete

## Overview

Simplified the registration process to remove all KYC and face matching requirements for the MVP. Users can now register with just basic information. Smile ID integration will be added later when the API is ready.

## Changes Made

### 1. Frontend (`apps/web/pages/register.tsx`)
- ✅ **Removed Step 2** (Identity Verification) - now single-step registration
- ✅ **Removed Ghana Card upload fields** (front and back)
- ✅ **Removed selfie capture** requirement
- ✅ **Removed Ghana Card number field** from the form
- ✅ **Simplified schema** - only requires: email, password, firstName, lastName, phone, role
- ✅ **Changed to JSON submission** instead of FormData/multipart
- ✅ **Removed face matching score** display logic
- ✅ **Cleaner, simpler UI** - single form, no multi-step wizard

### 2. Backend DTO (`services/api/src/modules/auth/dto/register.dto.ts`)
- ✅ Made `ghanaCardNumber` **optional** with `@IsOptional()` decorator
- ✅ Users can register without providing Ghana Card number

### 3. Backend Controller (`services/api/src/modules/auth/auth.controller.ts`)
- ✅ Made file uploads **optional**
- ✅ Only processes KYC files if they are provided
- ✅ Updated error message to clarify files are optional
- ✅ Registration works with or without files

### 4. Backend Service (`services/api/src/modules/auth/auth.service.ts`)
- ℹ️ **No changes needed** - already handles optional files correctly
- ℹ️ Sets `kycStatus` to `PENDING` by default
- ℹ️ Only processes KYC if files are provided

## What Still Works

✅ **Optional KYC**: If you want to test with KYC files, you can still upload them  
✅ **Existing users**: All existing users with KYC data remain unchanged  
✅ **Admin KYC review**: The admin KYC review page still works for users who submitted KYC  
✅ **Database schema**: No database changes needed

## What's Disabled/Removed

❌ **Ghana Card uploads** in registration form  
❌ **Selfie capture** in registration form  
❌ **Face matching** during registration  
❌ **Multi-step registration** wizard  
❌ **Ghana Card number requirement**

## Future Integration: Smile ID

When you're ready to integrate Smile ID:

1. **Apply for Smile ID API** credentials
2. **Update KYC service** to use Smile ID instead of self-hosted matching
3. **Add KYC page** where users can complete verification after registration
4. **Update admin review** to show Smile ID verification results

## Files to Review Later

These files contain old face matching logic that can be cleaned up when Smile ID is integrated:

- `services/api/src/modules/kyc/kyc.service.ts` - Contains old face matching logic
- `apps/web/components/SelfieCapture.tsx` - Selfie component (can be reused for Smile ID)
- `apps/web/pages/kyc.tsx` - KYC page (update for Smile ID)
- `apps/web/pages/admin/kyc-review.tsx` - Admin review (update for Smile ID)

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

- Users created without KYC will have `kycStatus: PENDING`
- You can add a KYC verification flow later as a separate step
- The platform is now fully functional for MVP testing without KYC barriers
- When Smile ID is ready, you can make KYC mandatory for certain actions (e.g., creating escrows over a certain amount)

## Deployment

Changes have been committed:
```bash
git commit -m "feat: simplify registration - remove KYC/face matching requirements for MVP"
```

Push to deploy:
```bash
git push origin main
```

Render will automatically rebuild and deploy both services.
