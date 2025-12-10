# KYC Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd services/api
pnpm install
```

This will install:
- `face-api.js` - Face detection and recognition
- `canvas` - Image processing (Node.js canvas implementation)
- `multer` - File upload handling

### 2. Download Face Recognition Models

The face matching service requires pre-trained models. Download them:

```bash
cd services/api
pnpm run download-face-models
```

This will:
- Create `services/api/models/` directory
- Download ~15MB of model files:
  - SSD MobileNet V1 (face detection)
  - Face Landmark 68 (facial landmarks)
  - Face Recognition (descriptor extraction)

**Note**: Models are stored locally and not committed to git (see `.gitignore`).

### 3. Database Migration

Update your database schema:

```bash
cd services/api
npx prisma migrate dev --name add_kyc_face_matching
npx prisma generate
```

This will:
- Add new fields to `KYCDetail` model
- Create indexes for performance
- Generate updated Prisma Client

### 4. Environment Variables

Ensure these are set in your `.env`:

```env
# MinIO/S3 Configuration (for file storage)
S3_ENDPOINT=minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=escrow-evidence

# JWT Secret (for authentication)
JWT_SECRET=your-secret-key-change-in-production
```

### 5. Start Services

```bash
# Start Docker services (PostgreSQL, MinIO, Redis)
docker-compose -f infra/docker/docker-compose.dev.yml up -d

# Start API server
cd services/api
pnpm run dev

# Start Web frontend (in another terminal)
cd apps/web
pnpm run dev
```

---

## Testing the Implementation

### 1. Test Registration

1. Navigate to `http://localhost:3000/register`
2. Fill in registration form:
   - Email, password, name, phone
   - Ghana Card number (format: GHA-123456789-1)
3. Upload files:
   - **Ghana Card Front**: Clear photo of front of card
   - **Ghana Card Back**: Clear photo of back of card
   - **Selfie**: Photo matching the person on the card
4. Submit registration
5. System will:
   - Perform face matching (takes 2-5 seconds)
   - Show success if match ≥ 60%
   - Show error if match < 60%

### 2. Test Admin Review

1. Login as admin
2. Navigate to `http://localhost:3000/admin/kyc-review`
3. View pending verifications
4. Click on a verification to review:
   - See face match score
   - Compare Ghana Card vs selfie
   - View user information
5. Take action:
   - **Approve**: User can now transact
   - **Reject**: User must resubmit

### 3. Test Transaction Blocking

1. Login as unverified user
2. Try to create an escrow → Should be blocked
3. Try to fund an escrow → Should be blocked
4. Try to request withdrawal → Should be blocked
5. After admin approval:
   - All transactions should work

---

## Troubleshooting

### Models Not Found Error

**Error**: `Face recognition models not found`

**Solution**:
```bash
cd services/api
pnpm run download-face-models
```

### Face Matching Fails

**Possible causes**:
- Poor image quality (too dark, blurry)
- Face not clearly visible
- Significant angle difference
- Person looks very different from card photo

**Solution**: Admin can manually review and approve if face match fails but images are valid.

### File Upload Fails

**Error**: `Failed to upload to MinIO`

**Check**:
- MinIO is running: `docker ps | grep minio`
- MinIO credentials are correct in `.env`
- Bucket exists: `escrow-evidence`

### Canvas/Image Processing Errors

**Error**: `Cannot find module 'canvas'`

**Solution**:
```bash
cd services/api
pnpm install canvas
```

**Note**: `canvas` requires native dependencies. If installation fails:
- On macOS: `brew install pkg-config cairo pango libpng jpeg giflib librsvg`
- On Ubuntu: `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`

---

## Production Considerations

### 1. Model Storage

- Models are ~15MB total
- Consider storing in cloud storage (S3) for faster deployment
- Or include in Docker image (add to Dockerfile)

### 2. Performance

- Face matching takes 2-5 seconds per comparison
- Consider queueing for high-volume scenarios
- Cache model loading (already implemented)

### 3. Security

- Encrypt Ghana Card numbers in database
- Use HTTPS for file uploads
- Implement rate limiting on KYC endpoints
- Add audit logging for all KYC actions

### 4. Accuracy

- Current threshold: 60% similarity
- May need adjustment based on real-world data
- Consider A/B testing different thresholds
- Admin review is essential for edge cases

### 5. Alternative Solutions

For higher accuracy, consider:
- **Third-party services**: AWS Rekognition, Azure Face API, Google Cloud Vision
- **Dedicated KYC providers**: Onfido, Jumio, Veriff
- **Hybrid approach**: Use face matching for initial screening, third-party for verification

---

## API Endpoints Reference

### Public
- `POST /auth/register` - Register with KYC files (multipart/form-data)

### Admin Only
- `GET /kyc/pending?limit=50&offset=0` - List pending verifications
- `GET /kyc/user/:userId` - Get user KYC details
- `PUT /kyc/approve/:userId` - Approve KYC (body: `{ notes?: string }`)
- `PUT /kyc/reject/:userId` - Reject KYC (body: `{ reason: string }`)
- `GET /kyc/download/:objectName` - Get presigned download URL

---

## File Structure

```
services/api/
├── models/                          # Face recognition models (not in git)
│   ├── ssd_mobilenetv1_model-*
│   ├── face_landmark_68_model-*
│   └── face_recognition_model-*
├── src/modules/kyc/
│   ├── face-matching.service.ts    # Face matching logic
│   ├── kyc.service.ts               # KYC processing
│   ├── kyc.controller.ts            # API endpoints
│   └── kyc.module.ts                # NestJS module
├── src/modules/auth/
│   └── guards/
│       └── kyc-verified.guard.ts    # Transaction blocking guard
└── scripts/
    └── download-face-models.sh      # Model download script
```

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review `KYC_IMPLEMENTATION_SUMMARY.md` for detailed documentation
3. Check server logs for detailed error messages




