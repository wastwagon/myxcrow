# 🔧 Quick Start: Remove Face Matching System

**Status:** Ready to implement  
**Time:** ~30 minutes  
**Difficulty:** Medium

---

## 🎯 What We're Doing

**Removing:**
- ❌ Self-hosted face matching (face-api.js)
- ❌ Automatic face comparison
- ❌ Face match score/pass logic

**Keeping:**
- ✅ Ghana Card document upload
- ✅ Selfie upload
- ✅ Admin manual review
- ✅ Document storage (MinIO/S3)

**Result:** All KYC submissions go directly to admin for manual review

---

## 📋 Step-by-Step Implementation

### Step 1: Update KYC Service (Remove Face Matching)

**File:** `services/api/src/modules/kyc/kyc.service.ts`

**Changes:**
1. Remove `FaceMatchingService` injection
2. Remove face matching calls
3. Remove validation calls
4. Keep document upload logic
5. Set all submissions to PENDING status

```typescript
// BEFORE (lines 106-165):
async processKYCRegistration(data: {...}): Promise<{ faceMatchScore: number; faceMatchPassed: boolean }> {
  // Validate images
  await this.faceMatchingService.validateImage(data.cardFrontBuffer, 'Ghana Card front');
  await this.faceMatchingService.validateImage(data.selfieBuffer, 'Selfie');

  // Perform face matching
  const matchResult = await this.faceMatchingService.compareFaces(data.cardFrontBuffer, data.selfieBuffer);
  
  // ... upload files ...
  
  // Create KYC record with face match results
  await this.prisma.kYCDetail.upsert({
    // ...
    faceMatchScore: matchResult.score,
    faceMatchPassed: matchResult.passed,
  });
  
  // Update user status based on face match
  await this.prisma.user.update({
    data: {
      kycStatus: matchResult.passed ? KYCStatus.IN_PROGRESS : KYCStatus.PENDING,
    },
  });
  
  return {
    faceMatchScore: matchResult.score,
    faceMatchPassed: matchResult.passed,
  };
}

// AFTER:
async processKYCRegistration(data: {...}): Promise<{ success: boolean; message: string }> {
  // Upload files to MinIO (no validation)
  const cardFrontUrl = await this.uploadFile(data.cardFrontBuffer, 'card-front.jpg', data.userId, 'card-front');
  const cardBackUrl = await this.uploadFile(data.cardBackBuffer, 'card-back.jpg', data.userId, 'card-back');
  const selfieUrl = await this.uploadFile(data.selfieBuffer, 'selfie.jpg', data.userId, 'selfie');

  // Create or update KYC record (NO face matching)
  await this.prisma.kYCDetail.upsert({
    where: { userId: data.userId },
    create: {
      userId: data.userId,
      ghanaCardNumber: data.ghanaCardNumber,
      cardFrontUrl: cardFrontUrl,
      cardBackUrl: cardBackUrl,
      selfieUrl: selfieUrl,
      documentType: 'GHANA_CARD',
      // NO faceMatchScore or faceMatchPassed
    },
    update: {
      ghanaCardNumber: data.ghanaCardNumber,
      cardFrontUrl: cardFrontUrl,
      cardBackUrl: cardBackUrl,
      selfieUrl: selfieUrl,
      adminApproved: false, // Reset approval on re-submission
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      rejectionReason: null,
    },
  });

  // Update user status to PENDING (always requires admin review)
  await this.prisma.user.update({
    where: { id: data.userId },
    data: {
      kycStatus: KYCStatus.PENDING, // Always PENDING, never auto-approved
    },
  });

  return {
    success: true,
    message: 'KYC documents submitted successfully. Admin will review your submission.',
  };
}
```

### Step 2: Remove FaceMatchingService Dependency

**File:** `services/api/src/modules/kyc/kyc.service.ts`

```typescript
// REMOVE this import:
import { FaceMatchingService } from './face-matching.service';

// REMOVE from constructor:
constructor(
  private prisma: PrismaService,
  // private faceMatchingService: FaceMatchingService, // REMOVE THIS LINE
  private configService: ConfigService,
) {
  // ...
}
```

### Step 3: Update KYC Module

**File:** `services/api/src/modules/kyc/kyc.module.ts`

```typescript
// BEFORE:
import { FaceMatchingService } from './face-matching.service';

@Module({
  providers: [KYCService, FaceMatchingService], // REMOVE FaceMatchingService
  // ...
})

// AFTER:
@Module({
  providers: [KYCService], // Only KYCService
  // ...
})
```

### Step 4: Delete Face Matching Service

**Delete this file:**
```bash
rm services/api/src/modules/kyc/face-matching.service.ts
```

### Step 5: Remove Dependencies

**File:** `services/api/package.json`

```json
// REMOVE these dependencies:
{
  "dependencies": {
    // "face-api.js": "^0.22.2", // REMOVE
    // "canvas": "^2.11.2",       // REMOVE (if not used elsewhere)
  }
}
```

**Run:**
```bash
cd services/api
pnpm remove face-api.js canvas
```

### Step 6: Delete Model Download Script

**Delete this file:**
```bash
rm services/api/scripts/download-face-models.sh
```

### Step 7: Update Admin KYC List Query

**File:** `services/api/src/modules/kyc/kyc.service.ts`

**Change `listPendingVerifications` method:**

```typescript
// BEFORE (line 229-266):
async listPendingVerifications(limit: number = 50, offset: number = 0) {
  const [kycDetails, total] = await Promise.all([
    this.prisma.kYCDetail.findMany({
      where: {
        adminApproved: false,
        faceMatchPassed: true, // Only show those that passed automatic check
      },
      // ...
    }),
    this.prisma.kYCDetail.count({
      where: {
        adminApproved: false,
        faceMatchPassed: true,
      },
    }),
  ]);
  // ...
}

// AFTER:
async listPendingVerifications(limit: number = 50, offset: number = 0) {
  const [kycDetails, total] = await Promise.all([
    this.prisma.kYCDetail.findMany({
      where: {
        adminApproved: false, // Show ALL pending (no face match filter)
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            kycStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    this.prisma.kYCDetail.count({
      where: {
        adminApproved: false, // Count ALL pending
      },
    }),
  ]);

  return {
    kycDetails,
    total,
    limit,
    offset,
  };
}
```

### Step 8: Update Database Schema (Optional)

**File:** `services/api/prisma/schema.prisma`

**Make face match fields optional:**

```prisma
model KYCDetail {
  // ... other fields ...
  
  // Make these optional (or remove entirely)
  faceMatchScore    Float?    // Optional - not used anymore
  faceMatchPassed   Boolean?  // Optional - not used anymore
  
  // ... rest of fields ...
}
```

**Run migration:**
```bash
cd services/api
npx prisma migrate dev --name make_face_match_optional
```

---

## ✅ Testing

### Test KYC Submission

1. **Register new user** with Ghana Card + selfie
2. **Check database** - KYC record created with PENDING status
3. **Check admin dashboard** - Submission appears in pending list
4. **Admin reviews** - Can approve/reject manually

### Expected Behavior

**Before:**
- User submits KYC → Face matching runs → Auto-approved if score > 60% → Admin reviews

**After:**
- User submits KYC → Documents uploaded → PENDING status → Admin reviews → Manual approval

---

## 🚀 Deployment

### Local Testing

```bash
cd services/api
pnpm install  # Remove deleted dependencies
pnpm build    # Rebuild
pnpm start:dev # Test locally
```

### Production Deployment

```bash
git add .
git commit -m "refactor: remove self-hosted face matching, require admin review for all KYC"
git push origin main
```

Render will auto-deploy.

---

## 📊 What Changed

| Feature | Before | After |
|---------|--------|-------|
| **Face Matching** | ✅ Automatic (face-api.js) | ❌ Removed |
| **Liveness Detection** | ❌ None | ⏳ Coming (Smile Identity) |
| **Auto-Approval** | ✅ If face match > 60% | ❌ Never |
| **Admin Review** | ✅ For passed submissions | ✅ For ALL submissions |
| **KYC Status** | PENDING or IN_PROGRESS | Always PENDING |
| **Dependencies** | face-api.js, canvas | None |

---

## ⚠️ Important Notes

1. **All existing KYC submissions** will still work (face match fields are optional)
2. **New submissions** will skip face matching entirely
3. **Admin must review ALL submissions** manually
4. **No automatic approvals** anymore
5. **Liveness detection** will be added in Phase 2 (Smile Identity)

---

## 🎯 Next Phase: Add Liveness Detection

After this is deployed and tested, we'll add Smile Identity for:
- ✅ Real liveness detection
- ✅ Anti-spoofing
- ✅ Better security
- ✅ Better UX

See `KYC_IMPROVEMENT_PLAN.md` for details.

---

**Ready to implement?** Let me know and I'll make these changes! 🚀
