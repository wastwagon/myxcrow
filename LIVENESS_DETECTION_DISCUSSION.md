# Liveness Detection & KYC Verification - Discussion Document

## 📚 What is Liveness Detection?

### Definition
**Liveness detection** is a biometric security technology that verifies a real, live person is present during identity verification, not a photo, video, mask, or other spoofing attempt.

### Why It's Important
- **Prevents Identity Fraud**: Stops attackers from using photos or videos of someone else
- **Regulatory Compliance**: Required by many financial regulations (KYC/AML)
- **Security Enhancement**: Adds an extra layer of verification beyond static document checks
- **Trust Building**: Increases confidence that the person registering is who they claim to be

---

## 🔍 How Liveness Detection Works

### Common Methods

#### 1. **Active Liveness (Challenge-Response)**
- **How it works**: System asks user to perform specific actions
- **Examples**: 
  - "Smile"
  - "Turn your head left"
  - "Blink your eyes"
  - "Say a random phrase"
- **Pros**: Very secure, hard to spoof
- **Cons**: Requires user interaction, can be slower

#### 2. **Passive Liveness (Automatic)**
- **How it works**: System analyzes video/photo automatically
- **Techniques**:
  - Face movement detection
  - Eye blink detection
  - 3D depth analysis
  - Texture analysis (detects printed photos)
- **Pros**: Faster, better user experience
- **Cons**: Can be less secure than active methods

#### 3. **3D Face Analysis**
- **How it works**: Uses depth sensors or multiple camera angles
- **Detects**: Flat photos vs. 3D faces
- **Pros**: Very accurate
- **Cons**: Requires special hardware (not available on all devices)

#### 4. **Biometric Matching**
- **How it works**: Compares liveness capture to ID document photo
- **Process**:
  1. Extract face from Ghana Card photo
  2. Extract face from liveness video/photo
  3. Compare using facial recognition algorithms
  4. Return similarity score (0-100%)
- **Pros**: Confirms person matches their ID
- **Cons**: Requires good quality images

---

## 🏗️ Proposed Implementation Architecture

### Registration Flow

```
1. User fills basic info (name, email, phone, etc.)
   ↓
2. User enters Ghana Card number
   ↓
3. User uploads Ghana Card (front & back)
   ↓
4. System extracts face from Ghana Card front photo
   ↓
5. User performs liveness check:
   - Takes selfie/video with instructions
   - System analyzes for liveness signals
   ↓
6. System compares liveness face to Ghana Card face
   ↓
7. User account created with status: KYC_PENDING
   ↓
8. User can access dashboard but CANNOT:
   - Create escrows
   - Fund wallet
   - Withdraw funds
   - Perform transactions
   ↓
9. Admin reviews:
   - Liveness check result
   - Ghana Card images
   - Face match score
   - Manual verification
   ↓
10. Admin approves/rejects
    ↓
11. If approved:
    - User status: KYC_VERIFIED
    - User can perform all operations
```

---

## 🛠️ Implementation Options

### Option 1: Third-Party Service (Recommended for MVP)

#### Services Available:
1. **FaceIO** (https://faceio.net)
   - Easy integration
   - Good documentation
   - Pay-per-verification pricing
   - Handles liveness + face matching

2. **Onfido** (https://onfido.com)
   - Enterprise-grade
   - Full KYC suite
   - More expensive
   - Very reliable

3. **Jumio** (https://www.jumio.com)
   - Strong in Africa
   - Good fraud detection
   - Compliance-focused

4. **AWS Rekognition**
   - Part of AWS ecosystem
   - Pay-as-you-go
   - Requires more setup
   - Good for custom solutions

#### Pros:
- ✅ Fast to implement
- ✅ Handles complex AI/ML
- ✅ Regular security updates
- ✅ Compliance-ready
- ✅ Good documentation

#### Cons:
- ❌ Ongoing costs (per verification)
- ❌ Data sent to third party
- ❌ Less control over process

---

### Option 2: Open Source Solution

#### Libraries:
1. **Face-api.js** (JavaScript)
   - Client-side processing
   - Free
   - Less secure (runs in browser)

2. **OpenCV + Dlib** (Python/C++)
   - Very customizable
   - Free
   - Requires ML expertise
   - More development time

#### Pros:
- ✅ No per-verification costs
- ✅ Full control
- ✅ Data stays on your servers

#### Cons:
- ❌ More development time
- ❌ Requires ML expertise
- ❌ Security updates are your responsibility
- ❌ May be less accurate

---

### Option 3: Hybrid Approach (Recommended for Production)

- **Liveness Check**: Use third-party service (FaceIO/Onfido)
- **Face Matching**: Use AWS Rekognition or similar
- **Storage**: Store all images in your MinIO/S3
- **Admin Review**: Custom admin interface

---

## 📋 Database Schema Changes Needed

### Current Schema:
```prisma
model KYCDetail {
  id          String   @id @default(uuid())
  userId      String   @unique
  documentType String?
  documentUrl  String?  // Currently just stores card number
  verifiedAt   DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Proposed Changes:
```prisma
model KYCDetail {
  id                String   @id @default(uuid())
  userId            String   @unique
  
  // Ghana Card Info
  ghanaCardNumber   String?
  cardFrontUrl      String?  // Front image URL
  cardBackUrl       String?  // Back image URL
  
  // Liveness Check
  livenessVideoUrl  String?  // Video/photo from liveness check
  livenessScore     Float?   // 0-100 confidence score
  livenessPassed    Boolean  @default(false)
  livenessMethod    String?  // "active" | "passive" | "3d"
  
  // Face Matching
  faceMatchScore    Float?   // 0-100 similarity score
  faceMatchPassed   Boolean  @default(false)
  
  // Admin Review
  reviewedBy        String?  // Admin user ID
  reviewedAt        DateTime?
  reviewNotes       String?
  adminApproved     Boolean  @default(false)
  
  // Metadata
  documentType      String?  @default("GHANA_CARD")
  verifiedAt        DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 🔐 Security Considerations

### 1. **Image Storage**
- ✅ Store in MinIO/S3 (encrypted at rest)
- ✅ Use presigned URLs for access
- ✅ Set expiration on URLs
- ✅ Only admins can access full images

### 2. **Data Privacy**
- ✅ Encrypt sensitive data
- ✅ Comply with GDPR/data protection laws
- ✅ Allow users to request data deletion
- ✅ Log all access to KYC data

### 3. **Liveness Check Security**
- ✅ Perform server-side validation
- ✅ Don't trust client-side results only
- ✅ Use HTTPS for all transfers
- ✅ Rate limit verification attempts

### 4. **Admin Access**
- ✅ Role-based access (only admins)
- ✅ Audit logs for all KYC reviews
- ✅ Two-factor authentication for admins
- ✅ IP whitelisting (optional)

---

## 💰 Cost Considerations

### Third-Party Services (Per Verification):
- **FaceIO**: ~$0.10 - $0.50 per check
- **Onfido**: ~$1.00 - $3.00 per check
- **AWS Rekognition**: ~$0.001 per image analyzed

### Self-Hosted:
- **Infrastructure**: Server costs for ML models
- **Development**: Initial setup time
- **Maintenance**: Ongoing updates

### Recommendation:
- Start with **FaceIO** or **AWS Rekognition** for MVP
- Consider self-hosted for scale (1000+ verifications/month)

---

## 🎯 User Experience Flow

### Registration Steps:

1. **Basic Information** (Current form)
   - Name, email, phone, password

2. **Ghana Card Entry**
   - Enter card number
   - Upload front image
   - Upload back image
   - Image validation (size, format, quality)

3. **Liveness Check**
   - Instructions: "Please look at the camera"
   - Challenge: "Smile" or "Turn head left"
   - Video capture (3-5 seconds)
   - Real-time feedback

4. **Processing**
   - "Verifying your identity..."
   - Extract face from card
   - Analyze liveness
   - Compare faces
   - Show results

5. **Account Created**
   - "Account created! Pending verification"
   - Redirect to dashboard
   - Show status banner: "Verification pending"

---

## 👨‍💼 Admin Review Interface

### Admin Dashboard Features:

1. **KYC Review Queue**
   - List of pending verifications
   - Sort by: date, risk score, priority
   - Filter by: status, date range

2. **User Verification View**
   - Side-by-side comparison:
     - Left: Ghana Card front (with extracted face highlighted)
     - Right: Liveness capture
   - Face match score display
   - Liveness check result
   - User information
   - Action buttons: Approve / Reject / Request More Info

3. **Review Actions**
   - **Approve**: User can now transact
   - **Reject**: User notified, can re-submit
   - **Request Info**: Ask for additional documents
   - **Flag for Review**: Mark for senior admin review

4. **Audit Trail**
   - Who reviewed
   - When reviewed
   - Decision made
   - Notes/comments

---

## 🚦 User Access Control

### Before Verification (KYC_PENDING):
- ✅ Can log in
- ✅ Can view dashboard
- ✅ Can view profile
- ❌ Cannot create escrows
- ❌ Cannot fund wallet
- ❌ Cannot withdraw
- ❌ Cannot perform transactions

### After Verification (KYC_VERIFIED):
- ✅ Full access to all features
- ✅ Can create escrows
- ✅ Can fund wallet
- ✅ Can withdraw
- ✅ Can perform all operations

### Implementation:
- Add middleware/guards to check `kycStatus === 'VERIFIED'`
- Show clear messages when actions are blocked
- Provide link to check verification status

---

## 📊 Metrics & Monitoring

### Track:
- Liveness check pass rate
- Face match scores distribution
- Average review time
- Rejection reasons
- Re-submission rate

### Alerts:
- High rejection rate
- Suspicious patterns
- Failed liveness checks
- Long review times

---

## ❓ Questions to Consider

1. **Liveness Method**: Active (challenge-response) or Passive (automatic)?
   - **Recommendation**: Start with passive for better UX, add active for high-risk cases

2. **Face Match Threshold**: What similarity score to accept?
   - **Recommendation**: 85%+ for auto-approval, 70-85% for manual review

3. **Auto-Approval**: Should high scores auto-approve?
   - **Recommendation**: Start with manual review, add auto-approval later

4. **Re-submission**: How many times can user retry?
   - **Recommendation**: 3 attempts, then require admin review

5. **Image Quality**: Minimum requirements?
   - **Recommendation**: 
     - Resolution: 800x600 minimum
     - File size: Max 5MB
     - Format: JPG, PNG
     - Quality check: Detect blur, lighting, angle

---

## 🎬 Next Steps

### Phase 1: Discussion & Planning ✅ (Current)
- Review this document
- Decide on approach
- Choose service/provider
- Finalize requirements

### Phase 2: Database & Backend
- Update Prisma schema
- Create KYC service
- Add file upload endpoints
- Integrate liveness service

### Phase 3: Frontend
- Update registration form
- Add file upload components
- Add liveness check UI
- Create admin review interface

### Phase 4: Testing
- Test liveness detection
- Test face matching
- Test admin workflow
- Security testing

### Phase 5: Deployment
- Deploy to staging
- User acceptance testing
- Deploy to production
- Monitor and iterate

---

## 💡 Recommendations

1. **Start Simple**: Use FaceIO or AWS Rekognition for MVP
2. **Manual Review First**: Don't auto-approve initially
3. **Clear Communication**: Tell users what to expect
4. **Good UX**: Make liveness check easy and fast
5. **Security First**: Encrypt everything, audit everything
6. **Iterate**: Start with basic, improve based on feedback

---

## 🤔 Your Input Needed

Please review and let me know:
1. Which liveness detection method you prefer?
2. Which service/provider to use?
3. Should we auto-approve high scores?
4. What face match threshold?
5. Any other requirements or concerns?

Once you confirm, I'll proceed with implementation! 🚀




