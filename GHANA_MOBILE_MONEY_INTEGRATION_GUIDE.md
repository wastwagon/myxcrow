# Ghana Mobile Money Integration Guide

**For:** MYXCROW Platform  
**Market:** Ghana  
**Providers:** MTN Mobile Money, Vodafone Cash, AirtelTigo Money

---

## 📱 GHANA MOBILE MONEY LANDSCAPE

### Market Share (2025)
- **MTN Mobile Money:** ~60% market share
- **Vodafone Cash:** ~25% market share
- **AirtelTigo Money:** ~10% market share
- **Others:** ~5% market share

### Why Mobile Money is Critical
- 80%+ of Ghanaians use mobile money
- Preferred payment method for online transactions
- Essential for market penetration
- Competitive necessity

---

## 🔧 TECHNICAL IMPLEMENTATION

### 1. MTN Mobile Money Integration

#### API Documentation:
- **Official API:** https://momodeveloper.mtn.com/
- **Sandbox:** Available for testing
- **Production:** Requires business registration

#### Integration Steps:

**Step 1: Register for MTN MoMo API**
1. Visit https://momodeveloper.mtn.com/
2. Create developer account
3. Register your application
4. Get API key and subscription key

**Step 2: Implement Payment Service**
```typescript
// services/api/src/modules/payments/mtn-momo.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MTNMobileMoneyService {
  private readonly baseUrl = 'https://sandbox.momodeveloper.mtn.com'; // or production URL
  private readonly apiKey: string;
  private readonly subscriptionKey: string;
  private readonly environment: string;

  constructor() {
    this.apiKey = process.env.MTN_MOMO_API_KEY;
    this.subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY;
    this.environment = process.env.MTN_MOMO_ENVIRONMENT || 'sandbox';
  }

  async initiatePayment(
    amount: number,
    phoneNumber: string,
    reference: string,
  ): Promise<MTNPaymentResponse> {
    // Format phone number (remove +233, add 0)
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    
    const response = await axios.post(
      `${this.baseUrl}/collection/v1_0/requesttopay`,
      {
        amount: amount.toString(),
        currency: 'GHS',
        externalId: reference,
        payer: {
          partyIdType: 'MSISDN',
          partyId: formattedPhone,
        },
        payerMessage: `Payment for escrow transaction ${reference}`,
        payeeNote: `MYXCROW escrow payment`,
      },
      {
        headers: {
          'X-Target-Environment': this.environment,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'X-Reference-Id': reference,
        },
      },
    );

    return response.data;
  }

  async verifyPayment(transactionId: string): Promise<MTNPaymentStatus> {
    const response = await axios.get(
      `${this.baseUrl}/collection/v1_0/requesttopay/${transactionId}`,
      {
        headers: {
          'X-Target-Environment': this.environment,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Authorization': `Bearer ${await this.getAccessToken()}`,
        },
      },
    );

    return response.data;
  }

  private async getAccessToken(): Promise<string> {
    // Implement OAuth token retrieval
    // Cache token (expires in 1 hour)
  }

  private formatPhoneNumber(phone: string): string {
    // Format: +233XXXXXXXXX -> 0XXXXXXXXX
    return phone.replace(/^\+233/, '0');
  }
}
```

**Step 3: Handle Webhooks**
```typescript
// services/api/src/modules/payments/mtn-momo-webhook.controller.ts
@Controller('webhooks/mtn-momo')
export class MTNMoMoWebhookController {
  @Post('payment-status')
  async handlePaymentStatus(@Body() payload: MTNWebhookPayload) {
    // Verify webhook signature
    // Update payment status in database
    // Notify user
    // Update escrow status if needed
  }
}
```

---

### 2. Vodafone Cash Integration

#### API Documentation:
- **Official API:** Contact Vodafone Ghana Business Solutions
- **Integration:** Requires business partnership

#### Implementation:
```typescript
// services/api/src/modules/payments/vodafone-cash.service.ts
@Injectable()
export class VodafoneCashService {
  // Similar structure to MTN MoMo
  // Vodafone-specific API endpoints
}
```

**Note:** Vodafone Cash API may require direct partnership. Contact:
- Vodafone Ghana Business Solutions
- Email: business@vodafone.com.gh
- Phone: +233 302 200 200

---

### 3. AirtelTigo Money Integration

#### API Documentation:
- **Official API:** Contact AirtelTigo Business
- **Integration:** Requires business partnership

#### Implementation:
```typescript
// services/api/src/modules/payments/airteltigo-money.service.ts
@Injectable()
export class AirtelTigoMoneyService {
  // Similar structure to MTN MoMo
  // AirtelTigo-specific API endpoints
}
```

**Note:** AirtelTigo API may require direct partnership. Contact:
- AirtelTigo Business Solutions
- Website: https://www.airteltigo.com.gh/business

---

## 🏗️ ARCHITECTURE DESIGN

### Payment Abstraction Layer

```typescript
// services/api/src/modules/payments/mobile-money.interface.ts
export interface MobileMoneyProvider {
  initiatePayment(
    amount: number,
    phone: string,
    reference: string,
  ): Promise<PaymentResponse>;
  
  verifyPayment(transactionId: string): Promise<PaymentStatus>;
  
  handleWebhook(payload: any): Promise<void>;
  
  formatPhoneNumber(phone: string): string;
}

// services/api/src/modules/payments/mobile-money.service.ts
@Injectable()
export class MobileMoneyService {
  constructor(
    private mtnMoMo: MTNMobileMoneyService,
    private vodafoneCash: VodafoneCashService,
    private airteltigo: AirtelTigoMoneyService,
  ) {}

  async initiatePayment(
    provider: 'MTN' | 'VODAFONE' | 'AIRTELTIGO',
    amount: number,
    phone: string,
    reference: string,
  ) {
    switch (provider) {
      case 'MTN':
        return this.mtnMoMo.initiatePayment(amount, phone, reference);
      case 'VODAFONE':
        return this.vodafoneCash.initiatePayment(amount, phone, reference);
      case 'AIRTELTIGO':
        return this.airteltigo.initiatePayment(amount, phone, reference);
    }
  }
}
```

---

## 📊 DATABASE CHANGES

### Update PaymentMethodType Enum

```sql
-- Migration: add_mobile_money_payment_methods.sql
ALTER TYPE "PaymentMethodType" ADD VALUE 'MTN_MOBILE_MONEY';
ALTER TYPE "PaymentMethodType" ADD VALUE 'VODAFONE_CASH';
ALTER TYPE "PaymentMethodType" ADD VALUE 'AIRTELTIGO_MONEY';
```

### Add Mobile Money Transaction Table

```prisma
// services/api/prisma/schema.prisma
model MobileMoneyTransaction {
  id                String   @id @default(uuid())
  paymentId         String   @unique
  provider          String   // MTN, VODAFONE, AIRTELTIGO
  phoneNumber       String
  amountCents       Int
  currency          String   @default("GHS")
  reference         String   @unique
  externalReference String?  // Provider's transaction ID
  status            String   // PENDING, SUCCESS, FAILED
  providerResponse  Json?    // Full provider response
  webhookReceived   Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  payment Payment @relation(fields: [paymentId], references: [id])

  @@index([reference])
  @@index([externalReference])
  @@index([status])
}
```

---

## 🔔 WEBHOOK HANDLING

### MTN Mobile Money Webhook

```typescript
@Controller('webhooks')
export class PaymentWebhookController {
  @Post('mtn-momo')
  async handleMTNMoMoWebhook(
    @Body() payload: MTNWebhookPayload,
    @Headers('x-callback-signature') signature: string,
  ) {
    // Verify signature
    const isValid = this.verifySignature(payload, signature);
    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Update payment status
    await this.paymentService.updatePaymentStatus(
      payload.externalId,
      payload.status,
    );

    // Notify user
    await this.notificationService.sendPaymentNotification(
      payload.externalId,
      payload.status,
    );
  }
}
```

---

## 🔐 SECURITY CONSIDERATIONS

### 1. API Key Management
- Store keys in environment variables
- Use secrets management (AWS Secrets Manager, etc.)
- Rotate keys regularly
- Never commit keys to git

### 2. Webhook Verification
- Verify webhook signatures
- Validate payload structure
- Check for replay attacks
- Log all webhook events

### 3. Phone Number Validation
- Validate Ghana phone numbers
- Format consistently
- Handle international formats
- Verify phone ownership (optional)

---

## 📱 USER EXPERIENCE

### Payment Selection UI

```typescript
// apps/web/components/PaymentMethodSelector.tsx
export function PaymentMethodSelector() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <PaymentOption
        icon={<MTNIcon />}
        name="MTN Mobile Money"
        description="Pay with your MTN MoMo wallet"
        onClick={() => selectPaymentMethod('MTN_MOBILE_MONEY')}
      />
      <PaymentOption
        icon={<VodafoneIcon />}
        name="Vodafone Cash"
        description="Pay with your Vodafone Cash wallet"
        onClick={() => selectPaymentMethod('VODAFONE_CASH')}
      />
      <PaymentOption
        icon={<AirtelTigoIcon />}
        name="AirtelTigo Money"
        description="Pay with your AirtelTigo Money wallet"
        onClick={() => selectPaymentMethod('AIRTELTIGO_MONEY')}
      />
    </div>
  );
}
```

### Payment Flow

1. User selects mobile money provider
2. Enters phone number
3. Confirms payment
4. Receives USSD prompt on phone
5. Approves payment on phone
6. System verifies payment
7. Funds released to escrow

---

## 🧪 TESTING

### Test Scenarios

1. **Successful Payment**
   - Initiate payment
   - User approves on phone
   - Webhook received
   - Payment confirmed

2. **Failed Payment**
   - User rejects on phone
   - Payment fails
   - User notified
   - Funds not deducted

3. **Timeout**
   - User doesn't respond
   - Payment times out
   - User notified
   - Retry option

4. **Webhook Failure**
   - Payment successful but webhook fails
   - Polling fallback
   - Manual verification option

---

## 📋 ENVIRONMENT VARIABLES

```bash
# MTN Mobile Money
MTN_MOMO_API_KEY=your_api_key
MTN_MOMO_SUBSCRIPTION_KEY=your_subscription_key
MTN_MOMO_ENVIRONMENT=sandbox  # or production
MTN_MOMO_USER_ID=your_user_id
MTN_MOMO_API_SECRET=your_api_secret

# Vodafone Cash
VODAFONE_CASH_API_KEY=your_api_key
VODAFONE_CASH_API_SECRET=your_api_secret
VODAFONE_CASH_MERCHANT_ID=your_merchant_id

# AirtelTigo Money
AIRTELTIGO_API_KEY=your_api_key
AIRTELTIGO_API_SECRET=your_api_secret
AIRTELTIGO_MERCHANT_ID=your_merchant_id
```

---

## 💰 COST CONSIDERATIONS

### MTN Mobile Money Fees
- **API Access:** Usually free (check current pricing)
- **Transaction Fees:** Typically 0.5-1% per transaction
- **Minimum Transaction:** Usually GHS 1.00
- **Maximum Transaction:** Check current limits

### Vodafone Cash Fees
- **API Access:** Contact for pricing
- **Transaction Fees:** Typically 0.5-1% per transaction

### AirtelTigo Money Fees
- **API Access:** Contact for pricing
- **Transaction Fees:** Typically 0.5-1% per transaction

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] API keys obtained
- [ ] Sandbox testing completed
- [ ] Webhook endpoints configured
- [ ] Phone number validation tested
- [ ] Error handling tested
- [ ] Security review completed

### Production Deployment
- [ ] Production API keys configured
- [ ] Webhook URLs updated
- [ ] Monitoring set up
- [ ] Logging configured
- [ ] Alerting set up
- [ ] Documentation updated

### Post-Deployment
- [ ] Monitor transaction success rate
- [ ] Monitor webhook delivery
- [ ] Track error rates
- [ ] User feedback collection
- [ ] Performance optimization

---

## 📞 CONTACT INFORMATION

### MTN Mobile Money
- **Developer Portal:** https://momodeveloper.mtn.com/
- **Support:** developer@mtn.com
- **Documentation:** https://momodeveloper.mtn.com/docs

### Vodafone Cash
- **Business Solutions:** business@vodafone.com.gh
- **Phone:** +233 302 200 200
- **Website:** https://www.vodafone.com.gh/business

### AirtelTigo Money
- **Business Solutions:** Contact via website
- **Website:** https://www.airteltigo.com.gh/business

---

## ✅ SUCCESS CRITERIA

### Technical
- ✅ 95%+ payment success rate
- ✅ < 5 second payment initiation
- ✅ 99%+ webhook delivery rate
- ✅ < 1% error rate

### Business
- ✅ 80%+ of transactions use mobile money
- ✅ 3-5x increase in user base
- ✅ 5-10x increase in transaction volume
- ✅ Market leadership in Ghana

---

**Last Updated:** January 2026
