# Self-Hosted Face Verification System

**Date:** January 2026  
**Status:** ✅ Active - Self-Hosted Implementation  
**Technology:** face-api.js (Self-Hosted)

---

## 📋 Overview

MYXCROW uses a **self-hosted face verification system** that:
- ✅ Compares selfie photos with Ghana Card photos
- ✅ Validates image quality and detects faces
- ✅ Performs anti-spoofing checks
- ✅ Runs entirely on your server (no external APIs)
- ✅ No third-party dependencies or costs

---

## 🔧 Technical Implementation

### Core Components

#### 1. **Face Matching Service**
**Location:** `services/api/src/modules/kyc/face-matching.service.ts`

**Features:**
- Face detection using face-api.js
- Face descriptor extraction
- Similarity score calculation (0-1 scale)
- 60% similarity threshold required
- Image quality validation
- Basic anti-spoofing checks

**Key Methods:**
```typescript
// Compare selfie with ID card photo
compareFaces(cardImageBuffer, selfieImageBuffer): Promise<{
  score: number;        // 0-1 similarity score
  passed: boolean;     // true if score >= 0.6
  threshold: number;   // 0.6 (60%)
}>

// Validate image quality
validateImage(imageBuffer, fieldName): Promise<void>
```

#### 2. **KYC Service**
**Location:** `services/api/src/modules/kyc/kyc.service.ts`

**Flow:**
1. Validates Ghana Card front image
2. Validates selfie image
3. Compares faces (selfie vs ID card)
4. Uploads documents to MinIO
5. Stores results in database
6. Updates user KYC status

#### 3. **Selfie Capture Component**
**Location:** `apps/web/components/SelfieCapture.tsx`

**Features:**
- Live camera capture (preferred)
- File upload (with warning)
- Real-time preview
- Camera permission handling

---

## 🛡️ Security Features

### 1. **Face Matching**
- Compares selfie with ID card photo
- Uses face-api.js neural networks
- Euclidean distance calculation
- 60% similarity threshold

### 2. **Image Quality Validation**
- Minimum resolution: 400x400px (ID), 480x480px (selfie)
- Maximum file size: 5MB
- Minimum file size: 50KB (prevents low-quality uploads)
- Face detection required

### 3. **Anti-Spoofing Checks**
- **Face Size Check:** Face must be at least 5% of image area
- **Face Position Check:** Face should be reasonably centered
- **Resolution Check:** Higher resolution required for selfies
- **File Size Check:** Very small files rejected

### 4. **Camera Capture Encouragement**
- Frontend warns users if uploading instead of using camera
- Camera capture preferred for better verification
- Metadata tracking (if available)

---

## 📊 Verification Process

### Registration Flow

```
1. User uploads Ghana Card (front & back)
   ↓
2. User captures/uploads selfie
   ↓
3. Backend validates images:
   - Resolution check
   - File size check
   - Face detection
   ↓
4. Face matching:
   - Extract face descriptors
   - Calculate similarity score
   - Compare with threshold (60%)
   ↓
5. If passed:
   - Upload to MinIO
   - Store in database
   - Set KYC status to IN_PROGRESS
   ↓
6. If failed:
   - Reject registration
   - Show error message
   - User can retry
```

### Verification Results

**Database Fields:**
- `faceMatchScore`: Float (0-1 similarity score)
- `faceMatchPassed`: Boolean (true if score >= 0.6)

**User Experience:**
- Success: Shows face match score percentage
- Failure: Clear error message with requirements
- Retry: User can attempt again with better photos

---

## 🔧 Setup & Configuration

### 1. **Install Dependencies**

Already included in `services/api/package.json`:
```json
{
  "face-api.js": "^0.22.2",
  "canvas": "^2.11.2"
}
```

### 2. **Download Face Recognition Models**

Run the download script:
```bash
cd services/api
pnpm run download-face-models
```

Or manually:
```bash
cd services/api
bash scripts/download-face-models.sh
```

**Models Downloaded:**
- `ssd_mobilenetv1_model-weights_manifest.json`
- `ssd_mobilenetv1_model-shard1`
- `ssd_mobilenetv1_model-shard2`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

**Location:** `services/api/models/`

### 3. **Environment Variables**

No special environment variables needed. The system uses:
- Existing MinIO/S3 configuration for document storage
- Existing database configuration

### 4. **Docker Setup**

Models are downloaded at runtime or during build. Ensure models directory is available:

```dockerfile
# In Dockerfile, models should be downloaded or mounted
# Models are excluded from .dockerignore for production
```

---

## 📈 Performance

### Processing Time
- **Face Detection:** ~500ms - 1s per image
- **Face Matching:** ~1-2s total
- **Total Verification:** ~2-3s per registration

### Resource Usage
- **Memory:** ~200-300MB (models loaded in memory)
- **CPU:** Moderate (neural network inference)
- **Storage:** ~50MB (model files)

### Optimization
- Models loaded once on service start
- Cached in memory for subsequent requests
- Async processing to avoid blocking

---

## 🎯 Verification Threshold

### Current Threshold: **60% Similarity**

**Rationale:**
- Balances security with user experience
- Accounts for:
  - Different lighting conditions
  - Age differences (ID photo vs current)
  - Camera quality variations
  - Facial expression differences

**Scoring:**
- **0.0 - 0.59:** Failed (different person or poor quality)
- **0.60 - 0.74:** Passed (good match)
- **0.75 - 0.89:** Passed (very good match)
- **0.90 - 1.0:** Passed (excellent match)

**Adjustment:**
Threshold can be adjusted in `face-matching.service.ts`:
```typescript
const threshold = 0.6; // Adjust as needed
```

---

## 🔍 Admin Review

### KYC Review Interface
**Location:** `apps/web/pages/admin/kyc-review.tsx`

**Features:**
- View all pending KYC verifications
- See face match scores
- Review documents (ID card, selfie)
- Approve or reject with notes
- Filter by status

**Review Criteria:**
- Face match score displayed
- Visual comparison of documents
- Admin can override automatic verification
- Rejection reasons tracked

---

## 🚨 Error Handling

### Common Errors

1. **"No face detected"**
   - **Cause:** Face not clearly visible
   - **Solution:** Better lighting, remove glasses/mask, ensure face is centered

2. **"Resolution too low"**
   - **Cause:** Image too small
   - **Solution:** Use higher quality camera, ensure good resolution

3. **"Face verification failed"**
   - **Cause:** Similarity score < 60%
   - **Solution:** Better lighting, similar angle to ID photo, clear face

4. **"Face matching service not available"**
   - **Cause:** Models not downloaded or dependencies missing
   - **Solution:** Run `pnpm run download-face-models`

---

## 📱 Mobile App Integration

### Current Status
- Mobile app registration structure ready
- Camera integration available (Expo Camera)
- File upload support
- Needs: Enhanced camera capture with better UX

### Future Enhancements
- Real-time face detection feedback
- Better camera guidance
- Improved error messages

---

## 🔐 Security Considerations

### Strengths
- ✅ Self-hosted (no data leaves your server)
- ✅ No third-party API dependencies
- ✅ Full control over verification logic
- ✅ No external costs
- ✅ Privacy compliant

### Limitations
- ⚠️ Static image comparison (not true liveness)
- ⚠️ Can be spoofed with high-quality photos
- ⚠️ No active challenge-response

### Recommendations
1. **Encourage camera use** (already implemented)
2. **Admin review** for borderline cases
3. **Monitor fraud patterns** and adjust threshold
4. **Consider adding** basic liveness checks (blink detection, etc.)

---

## 📊 Monitoring & Analytics

### Metrics to Track
- Face match success rate
- Average similarity scores
- Rejection reasons
- Retry attempts
- Admin override rate

### Logging
- Face match scores logged
- Failed attempts tracked
- Suspicious patterns flagged

---

## 🛠️ Maintenance

### Regular Tasks
1. **Monitor performance:** Check processing times
2. **Review threshold:** Adjust if needed based on data
3. **Update models:** Check for face-api.js updates
4. **Test accuracy:** Validate with test cases

### Model Updates
- Models are downloaded from face-api.js repository
- Check for updates periodically
- Test before deploying new versions

---

## 📚 Documentation References

- **Face-api.js:** https://github.com/justadudewhohacks/face-api.js
- **Canvas:** https://github.com/Automattic/node-canvas
- **KYC Module:** `services/api/src/modules/kyc/`
- **Registration Flow:** `apps/web/pages/register.tsx`

---

## ✅ Current Status

- ✅ Face matching implemented
- ✅ Image validation working
- ✅ Anti-spoofing checks active
- ✅ Admin review interface ready
- ✅ Mobile app structure ready
- ✅ Documentation complete

---

## 🎯 Summary

Your self-hosted face verification system is **fully functional** and provides:
- Secure face matching
- Quality validation
- Basic anti-spoofing
- Complete privacy (self-hosted)
- No external dependencies

The system is ready for production use. Consider adding more advanced liveness detection in the future if needed, but the current implementation provides solid security for MVP launch.

---

**Last Updated:** January 2026
