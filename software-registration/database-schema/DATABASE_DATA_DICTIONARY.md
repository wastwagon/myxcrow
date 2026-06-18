# MYXCROW — Database Data Dictionary

**Database engine:** PostgreSQL 15  
**ORM:** Prisma 5  
**Schema file:** `schema.prisma`  
**Migrations:** 13 versioned SQL files in `migrations/`  
**Currency:** Ghana Cedis (GHS), amounts stored as integer **cents** (`*Cents` columns)

---

## Summary

| Category | Count |
|----------|-------|
| Tables | 30 |
| Enums | 13 |
| Core domains | Users & Auth, KYC, Wallets, Escrows, Payments, Shipments, Disputes, Ledger, Audit, Risk |

---

## Enums

| Enum | Values | Used for |
|------|--------|----------|
| `UserRole` | BUYER, SELLER, ADMIN, AUDITOR, SUPPORT | User access roles |
| `KYCStatus` | PENDING, IN_PROGRESS, VERIFIED, REJECTED, EXPIRED | Identity verification state |
| `EscrowStatus` | DRAFT, AWAITING_FUNDING, FUNDED, AWAITING_SHIPMENT, SHIPPED, IN_TRANSIT, DELIVERED, AWAITING_RELEASE, RELEASED, REFUNDED, CANCELLED, DISPUTED | Escrow lifecycle |
| `PaymentMethodType` | BANK_ACCOUNT, CARD, WALLET | Saved payment methods |
| `PaymentStatus` | PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED | Payment records |
| `DisputeStatus` | OPEN, NEGOTIATION, MEDIATION, ARBITRATION, RESOLVED, CLOSED | Dispute workflow |
| `DisputeReason` | NOT_RECEIVED, NOT_AS_DESCRIBED, DEFECTIVE, WRONG_ITEM, PARTIAL_DELIVERY, OTHER | Why dispute opened |
| `DisputeResolutionOutcome` | RELEASE_TO_SELLER, REFUND_TO_BUYER | Final dispute decision |
| `WalletFundingSource` | PAYSTACK_TOPUP, BANK_TRANSFER, PROMO, ADJUSTMENT, REFUND | How wallet was funded |
| `WalletFundingStatus` | PENDING, SUCCEEDED, FAILED, CANCELED | Top-up status |
| `WithdrawalMethod` | BANK_ACCOUNT, MOBILE_MONEY, MANUAL | Payout channel |
| `WithdrawalStatus` | REQUESTED, PROCESSING, SUCCEEDED, FAILED, CANCELED | Withdrawal status |

---

## Tables

### User & Authentication

#### `User`
Primary account table for all platform users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | String (unique) | Login email |
| emailVerified | Boolean | Email verification flag |
| passwordHash | String? | bcrypt hash |
| firstName, lastName | String? | Display name |
| phone | String? (unique) | Ghana format: 0XXXXXXXXX |
| roles | UserRole[] | Default [BUYER] |
| kycStatus | KYCStatus | KYC state |
| kycVerifiedAt | DateTime? | When KYC approved |
| isActive | Boolean | Account enabled |
| deletedAt | DateTime? | Soft delete timestamp |
| createdAt, updatedAt | DateTime | Audit timestamps |

#### `PasswordResetToken`
One-time tokens for password reset emails.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID FK → User | Owner |
| tokenHash | String (unique) | Hashed token |
| expiresAt | DateTime | Expiry |
| usedAt | DateTime? | When consumed |

#### `EmailVerificationToken`
Email address verification tokens.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID FK → User | Owner |
| tokenHash | String (unique) | Hashed token |
| expiresAt, usedAt | DateTime | Lifecycle |

#### `PhoneVerificationCode`
OTP codes for phone verification (SMS via Arkesel).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| phone | String | Target phone number |
| codeHash | String | Hashed OTP |
| expiresAt, usedAt | DateTime | Lifecycle |

#### `Session`
Active login sessions (JWT backing store).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID FK → User | Session owner |
| token | String | Session token |
| deviceId | String? | Linked device |
| ipAddress, userAgent | String? | Client metadata |
| expiresAt, lastUsedAt | DateTime | Session lifecycle |

#### `Device`
Trusted device fingerprints for security.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID FK → User | Owner |
| fingerprint | String | Device ID |
| name, type | String? | Human label |
| isTrusted | Boolean | Trusted flag |
| lastSeenAt | DateTime | Last activity |

#### `UserProfile`
Optional profile extension.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID FK → User (unique) | One profile per user |
| avatarUrl, bio | String? | Profile data |

---

### KYC (Know Your Customer)

#### `KYCDetail`
Ghana Card verification and Smile Identity integration.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID FK → User (unique) | One KYC record per user |
| ghanaCardNumber | String? | National ID number |
| cardFrontUrl, cardBackUrl | String? | MinIO/S3 image URLs |
| selfieUrl | String? | Liveness selfie |
| faceMatchScore | Float? | 0–1 similarity |
| faceMatchPassed, livenessVerified | Boolean | Verification results |
| smileJobId | String? (unique) | Smile Identity job |
| smileResultCode, smileResultText | String? | Provider response |
| reviewedBy, reviewedAt | String?, DateTime? | Admin review |
| reviewNotes, rejectionReason | String? | Admin notes |
| adminApproved | Boolean | Manual approval |
| documentType | String? | Default GHANA_CARD |
| verifiedAt | DateTime? | Final verification time |

---

### Wallets

#### `Wallet`
Per-user GHS wallet with available and pending balances.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID FK → User (unique) | One wallet per user |
| currency | String | Default GHS |
| availableCents | Int | Spendable balance |
| pendingCents | Int | Held/reserved funds |

#### `WalletFunding`
Wallet top-up records (Paystack, bank transfer, etc.).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| walletId | UUID FK → Wallet | Target wallet |
| sourceType | WalletFundingSource | Funding channel |
| externalRef | String? | Paystack reference |
| amountCents, feeCents | Int | Amounts in pesewas |
| status | WalletFundingStatus | Processing state |
| metadata | JSON? | Provider payload |
| holdUntil | DateTime? | Chargeback hold |

#### `Withdrawal`
Payout requests to bank or mobile money.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| walletId | UUID FK → Wallet | Source wallet |
| methodType | WithdrawalMethod | BANK_ACCOUNT, MOBILE_MONEY, MANUAL |
| methodDetails | JSON | Encrypted payout details |
| amountCents, feeCents | Int | Amounts |
| status | WithdrawalStatus | Workflow state |
| requestedBy | String | User ID |
| processedBy, processedAt | String?, DateTime? | Admin processing |
| failureReason | String? | If failed |

---

### Escrows

#### `EscrowAgreement`
Core escrow transaction between buyer and seller.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| buyerId, sellerId | UUID FK → User | Parties |
| buyerWalletId, sellerWalletId | UUID? FK → Wallet | Wallet funding (optional) |
| currency | String | Default GHS |
| amountCents | Int | Total escrow amount |
| feeCents, feePercentage, feePaidBy | Int, Float?, String? | Platform fee |
| netAmountCents | Int | Seller receives after fee |
| description | String? | Transaction description |
| status | EscrowStatus | Lifecycle state |
| fundingMethod | String? | wallet or direct |
| expectedDeliveryDate | DateTime? | Expected delivery |
| autoReleaseDays | Int? | Days after delivery before auto-release (0=immediate) |
| disputeWindowDays | Int? | Days buyer can dispute (default 14) |
| deliveryConfirmationMode | String? | code or pin |
| deliveryPinHash | String? | bcrypt PIN when mode=pin |
| deliveryRegion, deliveryCity, deliveryAddressLine, deliveryPhone | String? | Ship-to address |
| fundedAt, shippedAt, deliveredAt, releasedAt, refundedAt, cancelledAt | DateTime? | Milestone timestamps |

#### `EscrowMilestone`
Partial release milestones within an escrow.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| escrowId | UUID FK → EscrowAgreement | Parent escrow |
| name, description | String | Milestone label |
| amountCents | Int | Portion of total |
| status | String | pending, submitted, approved, released |
| targetDate | DateTime? | Expected completion |
| approvalWindowDays | Int | Buyer review window (default 5) |
| submittedAt, approvedAt | DateTime? | Workflow timestamps |
| approvalReminderSentAt | DateTime? | Reminder sent flag |
| completedAt, releasedAt | DateTime? | Legacy/completion |

---

### Payments

#### `PaymentMethod`
Saved user payment methods.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID FK → User | Owner |
| type | PaymentMethodType | BANK_ACCOUNT, CARD, WALLET |
| provider, providerId | String? | External provider |
| isDefault, isVerified | Boolean | Flags |
| metadata | JSON? | Provider data |

#### `BankAccount`
User bank accounts for withdrawals.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID FK → User | Owner |
| accountType | String | checking, savings |
| bankName, accountNumber, routingNumber | String? | Bank details |
| currency | String | Default GHS |
| isVerified, isDefault | Boolean | Flags |

#### `Payment`
Individual payment transactions (funding, payout, refund, fee).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| escrowId | UUID? FK → EscrowAgreement | Linked escrow |
| userId | String | Payer/payee |
| paymentMethodId | String? | Method used |
| type | String | funding, payout, refund, fee |
| amountCents | Int | Amount |
| status | PaymentStatus | Processing state |
| provider, providerId | String? | Paystack etc. |
| failureReason | String? | Error detail |
| metadata | JSON? | Provider payload |
| processedAt | DateTime? | Completion time |

---

### Shipments & Delivery

#### `Shipment`
Delivery tracking for an escrow.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| escrowId | UUID FK → EscrowAgreement | Parent escrow |
| carrier, trackingNumber | String? | Courier info |
| status | String | pending, in_transit, delivered, etc. |
| shippedAt, deliveredAt | DateTime? | Timestamps |
| deliveryAddress | JSON? | Address snapshot |
| deliveryCode | String? (unique) | 6-char buyer-only code |
| shortReference | String? (unique) | 6-char public lookup ref |

#### `ShipmentEvent`
Tracking event history.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| shipmentId | UUID FK → Shipment | Parent shipment |
| status | String | Event status |
| location | String? | Geo/location |
| timestamp | DateTime | Event time |
| metadata | JSON? | Extra data |

---

### Evidence

#### `Evidence`
Uploaded files (photos, documents) stored in MinIO/S3.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| escrowId | UUID? FK → EscrowAgreement | Linked escrow |
| disputeId | String? | Linked dispute |
| uploadedBy | String | User ID |
| type | String | photo, document, video |
| fileKey | String | Object storage key |
| fileName, fileSize, mimeType | String, Int, String? | File metadata |
| sha256 | String? | Integrity hash |
| description | String? | Caption |
| metadata | JSON? | Geo tags (lat, lng, capturedAt) |

---

### Disputes

#### `Dispute`
Escrow dispute case.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| escrowId | UUID FK → EscrowAgreement | Disputed escrow |
| initiatorId | UUID FK → User | Who opened dispute |
| reason | DisputeReason | Category |
| status | DisputeStatus | Workflow state |
| description | String? | Details |
| resolution | String? | Resolution notes |
| resolutionOutcome | DisputeResolutionOutcome? | RELEASE_TO_SELLER or REFUND_TO_BUYER |
| resolvedBy, resolvedAt | String?, DateTime? | Admin resolution |

#### `DisputeMessage`
Chat messages within a dispute.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| disputeId | UUID FK → Dispute | Parent dispute |
| senderId | String | Message author |
| content | String | Message body |
| isSystem | Boolean | System-generated |
| readAt | DateTime? | Read receipt |

---

### Messaging & Reputation

#### `EscrowMessage`
Buyer/seller messaging on an escrow.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| escrowId | UUID FK → EscrowAgreement | Parent escrow |
| userId | String | Sender |
| content | String | Message body |

#### `EscrowRating`
Post-transaction star ratings (1–5).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| escrowId | UUID FK → EscrowAgreement | Rated transaction |
| raterId, rateeId | UUID FK → User | Who rated whom |
| role | String | buyer or seller (ratee's role) |
| score | Int | 1–5 stars |
| comment | String? | Optional review |

**Unique constraint:** one rating per (escrow, rater, ratee) triple.

---

### Ledger (Double-Entry Accounting)

#### `LedgerJournal`
Journal header for a financial event.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| escrowId | UUID? FK → EscrowAgreement | Linked escrow |
| type | String? | escrow_funding, escrow_release, wallet_topup, etc. |
| description | String? | Human label |

#### `LedgerEntry`
Individual debit/credit lines.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| journalId | UUID FK → LedgerJournal | Parent journal |
| account | String | buyer_wallet, seller_wallet, escrow_hold, fees_revenue |
| currency | String | Default GHS |
| amountCents | Int | Positive=credit, negative=debit |
| metadata | JSON? | walletId, withdrawalId, etc. |

---

### Platform Configuration

#### `PlatformSettings`
Key-value platform configuration (fees, security, notifications).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| key | String (unique) | Setting name |
| value | JSON | Setting value |
| description | String? | Admin note |
| category | String | fees, security, notifications |
| isPublic | Boolean | Readable without auth |
| updatedBy | String? | Last editor user ID |

---

### Audit & Risk

#### `AuditLog`
Tamper-evident audit trail for sensitive actions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID? FK → User | Actor |
| action | String | create_escrow, release_funds, etc. |
| resource, resourceId | String, String? | Affected entity |
| details | JSON? | Extra context |
| ipAddress, userAgent | String? | Client info |
| beforeState, afterState | JSON? | State diff |
| createdAt | DateTime | Event time |

#### `RiskEvent`
Fraud and risk monitoring events.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | String? | Subject user |
| type | String | suspicious_activity, chargeback, etc. |
| severity | String | low, medium, high, critical |
| details | JSON? | Event payload |
| resolved, resolvedAt | Boolean, DateTime? | Resolution state |

---

## Entity Relationship Overview

```
User ──┬── Wallet ──┬── WalletFunding
       │            └── Withdrawal
       ├── KYCDetail
       ├── EscrowAgreement (as buyer/seller) ──┬── EscrowMilestone
       │                                      ├── Payment
       │                                      ├── Shipment ── ShipmentEvent
       │                                      ├── Evidence
       │                                      ├── Dispute ── DisputeMessage
       │                                      ├── EscrowMessage
       │                                      ├── EscrowRating
       │                                      └── LedgerJournal ── LedgerEntry
       └── AuditLog

PlatformSettings (standalone)
RiskEvent (standalone)
PhoneVerificationCode (standalone)
PasswordResetToken, EmailVerificationToken, Session, Device (auth)
```

---

## Migration history

| Migration | Date | Summary |
|-----------|------|---------|
| 20251126143158_init | Nov 2025 | Initial schema — all core tables |
| 20260124000000_add_dispute_resolution_outcome | Jan 2026 | Dispute resolution enum |
| 20260125000000_add_password_reset_tokens | Jan 2026 | Password reset table |
| 20260203000000_delivery_address_code_evidence_metadata | Feb 2026 | Delivery fields, evidence geo |
| 20260212000000_auto_release_default_zero | Feb 2026 | Auto-release default 0 |
| 20260213000000_phone_unique_and_required | Feb 2026 | Unique phone index |
| 20260213180000_email_verification | Feb 2026 | Email verification |
| 20260213200000_phone_verification_code | Feb 2026 | Phone OTP table |
| 20260214000000_add_composite_indexes | Feb 2026 | Performance indexes |
| 20260302000000_user_deleted_at | Mar 2026 | Soft delete on User |
| 20260319000000_delivery_confirmation_pin | Mar 2026 | PIN delivery mode |
| 20260319190000_milestone_target_date_and_approval_window | Mar 2026 | Milestone dates |
| 20260319200000_milestone_submit_approve | Mar 2026 | Milestone workflow |
| 20260319210000_milestone_approval_reminder | Mar 2026 | Approval reminders |

---

## Applying schema

```bash
cd services/api
pnpm prisma:deploy    # apply all migrations to PostgreSQL
pnpm prisma:generate  # regenerate Prisma client
```

Or use consolidated DDL in `full-schema.sql` on a fresh PostgreSQL 15 database (for schema review only — prefer migrations for production).
