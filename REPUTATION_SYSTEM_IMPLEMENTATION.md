# Reputation System Implementation - Complete

**Date**: $(date)  
**Status**: ✅ Complete

---

## ✅ Features Implemented

### 1. Rating System
- **Create ratings** after escrow completion (RELEASED or REFUNDED status)
- **1-5 star rating** with optional comments
- **One rating per escrow** per user pair (prevents duplicate ratings)
- **Validation**: Only participants can rate, only completed escrows can be rated

### 2. Weighted Reputation Scoring
- **Amount-weighted**: Larger escrows contribute more to reputation
  - Formula: `sqrt(amountCents / 1000)` - larger amounts weighted more
- **Recency-weighted**: Recent ratings contribute more
  - Formula: `1 + (30 - daysAgo) / 30` for ratings within 30 days
  - Older ratings weighted at 0.5
- **Overall rating**: Weighted average of all ratings
- **Breakdown categories**:
  - As Buyer: Average rating when user was the buyer
  - As Seller: Average rating when user was the seller
  - Recent: Ratings from last 30 days
  - High Value: Ratings from escrows > 1000 GHS

### 3. Public Profiles
- **Public profile pages** at `/profile/[userId]` (no auth required)
- **Verified badges**: Awarded when:
  - KYC status is VERIFIED
  - Overall rating >= 4.0
  - Total ratings >= 5
  - Completion rate >= 80%
- **Profile displays**:
  - User name and email
  - KYC status
  - Member since date
  - Overall rating with star display
  - Reputation breakdown by category
  - Statistics (completion rate, total ratings)
  - Recent ratings with comments

### 4. Anti-Gaming Rules
- **Reciprocal high rating detection**: Flags when both users rate each other 5 stars
- **Rate limiting**: Maximum 10 ratings per 24 hours per user
- **Suspicious pattern detection**: Flags users who always rate the same score
- **New account monitoring**: Flags new accounts (< 1 day old) giving high ratings
- **Logging**: All suspicious patterns logged for review

---

## 📊 Database Schema

### EscrowRating Model
```prisma
model EscrowRating {
  id        String   @id @default(uuid())
  escrowId  String
  raterId   String   // User who gave the rating
  rateeId   String   // User being rated
  role      String   // 'buyer' or 'seller' (role of the ratee)
  score     Int      // 1-5 stars
  comment   String?
  createdAt DateTime @default(now())

  escrow EscrowAgreement @relation(...)
  rater  User            @relation("RatingsGiven", ...)
  ratee  User            @relation("RatingsReceived", ...)

  @@unique([escrowId, raterId, rateeId])
  @@index([rateeId])
  @@index([raterId])
  @@index([escrowId])
  @@index([createdAt])
}
```

### User Model Relations
- `ratingsGiven`: Ratings this user has given
- `ratingsReceived`: Ratings this user has received

### EscrowAgreement Model Relations
- `ratings`: All ratings for this escrow

---

## 🔌 API Endpoints

### Public Endpoints (No Auth Required)
- `GET /reputation/profile/:userId` - Get public profile
- `GET /reputation/score/:userId` - Get reputation score
- `GET /reputation/ratings/:userId?limit=20` - Get user ratings

### Authenticated Endpoints
- `POST /reputation/rate` - Create a rating
  - Body: `{ escrowId, rateeId, role, score, comment? }`
  - Requires: User must be participant in escrow

---

## 🎨 Frontend Components

### Public Profile Page
- **Route**: `/profile/[userId]`
- **Features**:
  - Profile header with verified badge
  - Overall rating display with stars
  - Reputation breakdown cards
  - Statistics cards
  - Recent ratings list

### Rating Modal
- **Component**: `RatingModal.tsx`
- **Features**:
  - Star rating selector (1-5)
  - Optional comment textarea
  - Submit/cancel buttons
  - Error handling

### Escrow Detail Page Integration
- **Rating button** appears when:
  - Escrow status is RELEASED or REFUNDED
  - User is a participant (buyer or seller)
- **Button text**: "Rate Seller" or "Rate Buyer"
- **Opens RatingModal** with pre-filled ratee information

---

## 📋 Migration Required

Run Prisma migration to add the `EscrowRating` model:

```bash
npx prisma migrate dev --name add_reputation_system
```

This will:
1. Create `EscrowRating` table
2. Add relations to `User` and `EscrowAgreement` tables
3. Create indexes for performance

---

## 🚀 Usage Examples

### Creating a Rating
```typescript
POST /reputation/rate
{
  "escrowId": "escrow-123",
  "rateeId": "user-456",
  "role": "seller",
  "score": 5,
  "comment": "Great seller, fast delivery!"
}
```

### Getting Public Profile
```typescript
GET /reputation/profile/user-456
// Returns: profile with reputation score, breakdown, recent ratings
```

### Getting Reputation Score
```typescript
GET /reputation/score/user-456
// Returns: {
//   overallRating: 4.5,
//   totalRatings: 12,
//   completionRate: 95.5,
//   verifiedBadge: true,
//   breakdown: { ... }
// }
```

---

## 🔒 Security & Validation

1. **Authorization**: Only escrow participants can rate
2. **Status validation**: Only completed escrows (RELEASED/REFUNDED) can be rated
3. **Duplicate prevention**: Unique constraint on (escrowId, raterId, rateeId)
4. **Score validation**: Score must be between 1-5
5. **Anti-gaming**: Multiple checks to prevent manipulation

---

## 📈 Future Enhancements

1. **Rating editing**: Allow users to edit their ratings within 24 hours
2. **Rating responses**: Allow ratee to respond to ratings
3. **Rating helpfulness**: Allow users to mark ratings as helpful
4. **Reputation history**: Track reputation score over time
5. **Reputation badges**: Additional badges (Top Seller, Trusted Buyer, etc.)
6. **Rating analytics**: Admin dashboard for rating trends
7. **Automated reputation actions**: Use reputation score in risk scoring

---

## ✅ Implementation Complete

All features have been implemented and are ready for:
1. Database migration
2. Testing
3. Deployment

**Files Created:**
- `services/api/src/modules/reputation/reputation.service.ts`
- `services/api/src/modules/reputation/reputation.controller.ts`
- `services/api/src/modules/reputation/reputation.module.ts`
- `apps/web/pages/profile/[userId].tsx`
- `apps/web/components/RatingModal.tsx`

**Schema Updates:**
- Added `EscrowRating` model
- Added relations to `User` and `EscrowAgreement`

**Integration:**
- Added rating button to escrow detail page
- Added ReputationModule to AppModule




