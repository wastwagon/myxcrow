# 🚀 Phase 2: Smile ID Integration Guide

This guide outlines the technical steps to integrate Smile Identity for liveness detection and document verification in MYXCROW.

---

## 📋 Prerequisites

1. ✅ **Phase 1 Complete** (Self-hosted face matching removed)
2. ⏳ **Smile ID Account** (Registering...)
3. ⏳ **Partner ID** & **API Key** (From Smile ID Portal)
4. ⏳ **`smile_config.json`** (Download from Smile ID Portal)

---

## 🛠️ Step 1: Backend Integration (NestJS)

### 1. Install Dependencies
```bash
cd services/api
pnpm add @smile_identity/smile-identity-core
```

### 2. Add Environment Variables
Add these to your `services/api/.env` and Render Environment Variables:
```env
SMILE_ID_PARTNER_ID=your_partner_id
SMILE_ID_API_KEY=your_api_key
SMILE_ID_ENVIRONMENT=sandbox # or production
SMILE_ID_CALLBACK_URL=https://myxcrow-bp-api.onrender.com/api/kyc/smile-callback
```

### 3. Create Smile ID Service
Create `services/api/src/modules/kyc/smile-id.service.ts`:
- Initialize `WebApi` from the SDK.
- Create methods for:
  - `getWebToken()` (if using hosted web)
  - `verifyLiveness()`
  - `submitDocumentVerification()`
  - `handleWebhook()`

### 4. Update KYC Controller
- Add endpoint `POST /kyc/smile-callback` to receive webhook results.
- Update `POST /kyc/register` to handle Smile ID job submission.

---

## 📱 Step 2: Web App KYC

KYC runs via the **web app** (`apps/web`). The API (`services/api`) uses the Smile ID service; the web app calls API endpoints for KYC submission and status. No native mobile app SDK is required.

---

## 🔄 Step 3: Updated Verification Flow

1. **User Starts KYC** on the web app.
2. **Web app** (and API) handle capture and submission:
   - **SmartSelfie™** (with real-time liveness detection)
   - **Ghana Card** (Front & Back)
3. **SDK** automatically uploads images to Smile ID servers.
4. **Backend** receives a **Webhook** from Smile ID with:
   - Liveness result (Passed/Failed)
   - Face match result (Selfie vs ID)
   - Document verification result
5. **Backend Updates Status**:
   - If Passed: Status → `PENDING_ADMIN_REVIEW`
   - If Failed: Status → `REJECTED` (with reason)
6. **Admin Dashboard** displays Smile ID verification results for final approval.

---

## 📊 Next Tasks

- [ ] Install `@smile_identity/smile-identity-core` in API.
- [ ] Create `SmileIDService` in API.
- [ ] Implement Webhook handler in `KYCController`.
- [ ] Web app KYC flow uses API; no mobile SDK required.

---

**Ready to start?** Let me know when you have your API keys and `smile_config.json`!
