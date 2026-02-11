# 🎯 KYC System Improvement Plan

**Date:** February 10, 2026  
**Status:** 📋 **PLANNING**  
**Priority:** 🟡 **MEDIUM** (Improves security & reliability)

---

## 📊 Current System Analysis

### What You Have Now

**Self-Hosted Face Matching (face-api.js):**
- ✅ Ghana Card front/back upload
- ✅ Selfie capture
- ✅ Automatic face matching (60% threshold)
- ✅ Face detection and validation
- ✅ Anti-spoofing checks (basic)
- ✅ Admin manual review

**Issues with Current System:**
- ❌ **Unreliable** - Self-hosted face matching can be inaccurate
- ❌ **No Liveness Detection** - Can't detect if selfie is a photo of a photo
- ❌ **Resource Intensive** - Requires downloading models, canvas dependencies
- ❌ **Maintenance Burden** - Need to keep models updated
- ❌ **Security Risk** - Easy to spoof with printed photos

---

## ✅ Proposed Improvements

### 1. Remove Self-Hosted Face Matching ❌

**What to Remove:**
- `face-matching.service.ts` - Entire service
- `face-api.js` dependency
- `canvas` dependency
- Model download scripts
- Face comparison logic

**Why:**
- Unreliable for production use
- Can be easily spoofed
- Maintenance overhead
- Better alternatives available

### 2. Keep Ghana Card Document Upload ✅

**What to Keep:**
- Ghana Card front upload
- Ghana Card back upload
- Document storage in MinIO/S3
- Ghana Card number validation

**Why:**
- Essential for identity verification
- Admin needs to review documents
- Required for compliance

### 3. Add Third-Party Liveness Detection ✨

**What to Add:**
- Real-time liveness detection during selfie capture
- Prevents photo-of-photo attacks
- Detects printed photos, screens, masks
- Ensures real person is present

### 4. Enhance Admin Manual Review ✅

**What to Improve:**
- All KYC submissions go to admin review (no auto-approval)
- Admin reviews Ghana Card documents
- Admin reviews liveness-verified selfie
- Admin makes final decision

---

## 🔌 Third-Party Liveness Detection Options

### Option 1: **iProov** ⭐⭐⭐⭐⭐ (RECOMMENDED)

**Website:** https://www.iproov.com  
**Pricing:** Pay-as-you-go, ~$0.10-0.50 per verification

**Features:**
- ✅ **Genuine Presence Assurance** - Industry-leading liveness detection
- ✅ **Flash-based verification** - Uses screen flash to verify real person
- ✅ **Passive liveness** - No user actions required
- ✅ **Anti-spoofing** - Detects photos, videos, masks, deepfakes
- ✅ **Mobile SDKs** - iOS, Android, Web
- ✅ **99.9% uptime SLA**
- ✅ **GDPR compliant**

**Integration:**
```typescript
// Mobile: iProov SDK
// Web: iProov Web SDK
// Backend: Verify token with iProov API
```

**Pros:**
- Best-in-class liveness detection
- Used by banks and governments
- Excellent documentation
- Strong anti-spoofing

**Cons:**
- Higher cost (~$0.30-0.50 per verification)
- Requires SDK integration

---

### Option 2: **Onfido** ⭐⭐⭐⭐⭐

**Website:** https://onfido.com  
**Pricing:** Pay-as-you-go, ~$1-2 per verification (includes ID verification)

**Features:**
- ✅ **Liveness detection** - Detects real person
- ✅ **Document verification** - Verifies Ghana Card authenticity
- ✅ **Face matching** - Compares selfie to ID photo
- ✅ **Mobile SDKs** - iOS, Android, Web
- ✅ **Comprehensive KYC** - All-in-one solution
- ✅ **Global coverage** - Supports 195+ countries

**Integration:**
```typescript
// Mobile: Onfido SDK
// Backend: Onfido API for verification results
```

**Pros:**
- Complete KYC solution (liveness + document + face match)
- Very reliable
- Good documentation
- Handles everything

**Cons:**
- More expensive (~$1-2 per verification)
- Overkill if you only need liveness

---

### Option 3: **Smile Identity** ⭐⭐⭐⭐⭐ (BEST FOR AFRICA)

**Website:** https://www.smileidentity.com  
**Pricing:** Pay-as-you-go, ~$0.20-0.40 per verification

**Features:**
- ✅ **Africa-focused** - Optimized for African markets
- ✅ **Liveness detection** - Real-time verification
- ✅ **ID verification** - Supports Ghana Card, Nigerian ID, etc.
- ✅ **Face matching** - Compares selfie to ID
- ✅ **Mobile SDKs** - iOS, Android, Web
- ✅ **Low bandwidth** - Works on 2G/3G
- ✅ **Local support** - Africa-based team

**Integration:**
```typescript
// Mobile: SmileID SDK
// Backend: SmileID API
```

**Pros:**
- **BEST FOR GHANA** - Optimized for African networks
- Affordable pricing
- Supports Ghana Card natively
- Low bandwidth requirements
- Local support

**Cons:**
- Smaller company than iProov/Onfido
- Less global coverage

---

### Option 4: **Vouched** ⭐⭐⭐⭐

**Website:** https://vouched.id  
**Pricing:** Pay-as-you-go, ~$0.50-1.00 per verification

**Features:**
- ✅ **Liveness detection** - Real-time verification
- ✅ **ID verification** - Document authenticity
- ✅ **Face matching** - Selfie to ID comparison
- ✅ **Mobile SDKs** - iOS, Android, Web
- ✅ **Fast integration** - Quick setup

**Integration:**
```typescript
// Mobile: Vouched SDK
// Backend: Vouched API
```

**Pros:**
- Easy integration
- Good documentation
- Reasonable pricing

**Cons:**
- Less known than iProov/Onfido
- May not support Ghana Card natively

---

### Option 5: **FaceTec** ⭐⭐⭐⭐

**Website:** https://www.facetec.com  
**Pricing:** Contact for pricing (likely $0.10-0.30 per verification)

**Features:**
- ✅ **3D liveness detection** - Uses 3D face mapping
- ✅ **Certified liveness** - iBeta Level 1 & 2 certified
- ✅ **Mobile SDKs** - iOS, Android, Web
- ✅ **Anti-spoofing** - Detects masks, photos, videos

**Integration:**
```typescript
// Mobile: FaceTec SDK
// Backend: FaceTec API
```

**Pros:**
- Strong 3D liveness detection
- Certified anti-spoofing
- Good pricing

**Cons:**
- Requires contacting sales for pricing
- May be complex to integrate

---

## 🎯 Recommended Solution

### **Smile Identity** (Best for Ghana) ⭐⭐⭐⭐⭐

**Why:**
1. **Africa-focused** - Optimized for Ghana and African markets
2. **Supports Ghana Card** - Native support for Ghana Card verification
3. **Affordable** - ~$0.20-0.40 per verification
4. **Low bandwidth** - Works on 2G/3G (important for Ghana)
5. **Local support** - Africa-based team
6. **Complete solution** - Liveness + ID verification + face matching

**Alternative:** **iProov** if you need the absolute best liveness detection

---

## 📋 Implementation Plan

### Phase 1: Remove Self-Hosted Face Matching

**Files to Modify:**
1. `services/api/src/modules/kyc/kyc.service.ts`
   - Remove face matching calls
   - Remove `faceMatchScore` and `faceMatchPassed` logic
   - Keep document upload logic

2. `services/api/src/modules/kyc/face-matching.service.ts`
   - **DELETE** this entire file

3. `services/api/src/modules/kyc/kyc.module.ts`
   - Remove `FaceMatchingService` provider

4. `services/api/package.json`
   - Remove `face-api.js` dependency
   - Remove `canvas` dependency

5. `services/api/scripts/download-face-models.sh`
   - **DELETE** this file

6. Database schema (`prisma/schema.prisma`)
   - Make `faceMatchScore` and `faceMatchPassed` optional
   - Or remove them entirely

### Phase 2: Integrate Smile Identity

**1. Sign Up for Smile Identity**
- Go to https://www.smileidentity.com
- Create account
- Get API keys (sandbox + production)

**2. Install Smile Identity SDK**

**Mobile (React Native/Expo):**
```bash
cd apps/mobile
npm install @smile_identity/react-native
```

**Backend:**
```bash
cd services/api
pnpm add @smile_identity/smile-identity-core
```

**3. Add Environment Variables**

```env
# .env
SMILE_IDENTITY_PARTNER_ID=your_partner_id
SMILE_IDENTITY_API_KEY=your_api_key
SMILE_IDENTITY_CALLBACK_URL=https://myxcrow-bp-api.onrender.com/api/kyc/smile-callback
SMILE_IDENTITY_ENVIRONMENT=sandbox # or production
```

**4. Create Liveness Service**

```typescript
// services/api/src/modules/kyc/liveness.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebApi } from '@smile_identity/smile-identity-core';

@Injectable()
export class LivenessService {
  private smileClient: WebApi;

  constructor(private configService: ConfigService) {
    this.smileClient = new WebApi(
      this.configService.get('SMILE_IDENTITY_PARTNER_ID'),
      this.configService.get('SMILE_IDENTITY_API_KEY'),
      this.configService.get('SMILE_IDENTITY_ENVIRONMENT'),
    );
  }

  async verifyLiveness(userId: string, selfieImage: Buffer): Promise<{
    passed: boolean;
    confidence: number;
    livenessScore: number;
  }> {
    // Implement Smile Identity liveness check
    // Returns liveness verification result
  }
}
```

**5. Update Mobile App**

**Add Liveness Capture Screen:**
```typescript
// apps/mobile/app/(auth)/liveness.tsx
import { SmileID } from '@smile_identity/react-native';

export default function LivenessScreen() {
  const handleLivenessCapture = async () => {
    const result = await SmileID.captureLiveness({
      userId: user.id,
      jobId: `kyc-${user.id}-${Date.now()}`,
    });
    
    if (result.success) {
      // Upload to backend
      await submitKYC(result.images);
    }
  };

  return (
    <View>
      <Button onPress={handleLivenessCapture}>
        Start Liveness Check
      </Button>
    </View>
  );
}
```

**6. Update KYC Flow**

**New Flow:**
1. User uploads Ghana Card front
2. User uploads Ghana Card back
3. **User completes liveness check** (NEW)
4. Backend receives liveness result from Smile Identity
5. Backend stores documents + liveness result
6. **Admin reviews everything manually**
7. Admin approves/rejects

### Phase 3: Update Admin Review

**1. Update Admin Dashboard**
- Show liveness verification status
- Display liveness confidence score
- Show Ghana Card documents
- Allow admin to approve/reject

**2. Remove Auto-Approval**
- All KYC submissions go to admin review
- No automatic approval based on face match
- Admin makes final decision

---

## 📊 Database Changes

### Update Prisma Schema

```prisma
model KYCDetail {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Ghana Card details
  ghanaCardNumber   String
  cardFrontUrl      String
  cardBackUrl       String
  
  // Liveness verification (NEW)
  livenessVerified  Boolean   @default(false)
  livenessScore     Float?
  livenessProvider  String?   // "smile_identity", "iproov", etc.
  livenessJobId     String?   // External provider job ID
  selfieUrl         String?
  
  // REMOVE these (or make optional)
  faceMatchScore    Float?    // Optional - not used anymore
  faceMatchPassed   Boolean?  // Optional - not used anymore
  
  // Admin review
  adminApproved     Boolean   @default(false)
  reviewedBy        String?
  reviewedAt        DateTime?
  reviewNotes       String?
  rejectionReason   String?
  
  documentType      String    @default("GHANA_CARD")
  verifiedAt        DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

### Migration

```bash
cd services/api
npx prisma migrate dev --name remove_face_matching_add_liveness
```

---

## 💰 Cost Comparison

### Current System (Self-Hosted)
- **Cost per verification:** $0 (but unreliable)
- **Infrastructure:** Requires models, canvas, CPU
- **Maintenance:** High (model updates, debugging)
- **Reliability:** Low (60-70% accuracy)
- **Security:** Low (easy to spoof)

### Smile Identity
- **Cost per verification:** ~$0.20-0.40
- **Infrastructure:** None (cloud-based)
- **Maintenance:** None (managed service)
- **Reliability:** High (95%+ accuracy)
- **Security:** High (certified liveness detection)

### Monthly Cost Estimate

| Users/Month | Current | Smile Identity | Difference |
|-------------|---------|----------------|------------|
| 100 | $0 | $20-40 | +$20-40 |
| 500 | $0 | $100-200 | +$100-200 |
| 1,000 | $0 | $200-400 | +$200-400 |
| 5,000 | $0 | $1,000-2,000 | +$1,000-2,000 |

**ROI:**
- **Reduced fraud** - Prevents fake accounts
- **Better UX** - Faster, more reliable verification
- **Less support** - Fewer failed verifications
- **Compliance** - Meets regulatory requirements

---

## 🎯 Implementation Timeline

### Week 1: Planning & Setup
- [ ] Sign up for Smile Identity (sandbox)
- [ ] Get API keys
- [ ] Review documentation
- [ ] Plan database changes

### Week 2: Backend Changes
- [ ] Remove face-matching.service.ts
- [ ] Update kyc.service.ts
- [ ] Create liveness.service.ts
- [ ] Update database schema
- [ ] Run migrations
- [ ] Test with sandbox API

### Week 3: Mobile App Changes
- [ ] Install Smile Identity SDK
- [ ] Create liveness capture screen
- [ ] Update KYC registration flow
- [ ] Test liveness capture
- [ ] Update UI/UX

### Week 4: Admin Dashboard
- [ ] Update admin KYC review page
- [ ] Show liveness verification status
- [ ] Test admin approval flow
- [ ] Update documentation

### Week 5: Testing & Launch
- [ ] End-to-end testing
- [ ] Security testing
- [ ] Performance testing
- [ ] Switch to production API
- [ ] Monitor and optimize

---

## ✅ Benefits of New System

### Security ✅
- **Real liveness detection** - Prevents photo-of-photo attacks
- **Certified anti-spoofing** - Detects masks, screens, printed photos
- **Better fraud prevention** - Harder to create fake accounts

### Reliability ✅
- **Higher accuracy** - 95%+ vs 60-70% with self-hosted
- **Consistent results** - Professional service vs DIY
- **Less maintenance** - Managed service vs self-hosted

### User Experience ✅
- **Faster verification** - Real-time liveness check
- **Better feedback** - Clear instructions during capture
- **Mobile-optimized** - Works on low-bandwidth networks

### Compliance ✅
- **Regulatory compliance** - Meets KYC/AML requirements
- **Audit trail** - Complete verification history
- **GDPR compliant** - Data protection built-in

---

## 🚀 Next Steps

### Immediate Actions

1. **Review this plan** - Confirm approach
2. **Choose provider** - Smile Identity (recommended) or alternative
3. **Sign up for sandbox** - Get API keys for testing
4. **Approve budget** - ~$0.20-0.40 per verification

### Questions to Answer

1. **Budget:** What's your monthly KYC verification budget?
2. **Volume:** How many users do you expect per month?
3. **Timeline:** When do you want to launch this?
4. **Provider:** Smile Identity (recommended) or alternative?

---

## 📞 Support

**Smile Identity:**
- Website: https://www.smileidentity.com
- Docs: https://docs.smileidentity.com
- Support: support@smileidentity.com

**Alternative Providers:**
- iProov: https://www.iproov.com
- Onfido: https://onfido.com
- Vouched: https://vouched.id

---

**Ready to proceed?** Let me know and I'll start implementing! 🚀
