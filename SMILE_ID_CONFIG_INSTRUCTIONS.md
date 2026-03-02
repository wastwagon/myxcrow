# ⚙️ Smile ID Configuration Instructions

Now that the backend is ready, here is how to configure it for testing.

---

## 1. Environment Variables
Add these to your `services/api/.env` file:

```env
# Smile ID Credentials
SMILE_ID_PARTNER_ID=your_partner_id
SMILE_ID_API_KEY=your_api_key
SMILE_ID_ENVIRONMENT=sandbox
SMILE_ID_CALLBACK_URL=https://your-domain.ngrok-free.app/api/kyc/callback
```

> 💡 **Tip:** Use `ngrok` for local testing so Smile ID can send webhooks to your local machine.

---

## 2. Prisma Migration
Apply the database changes:
```bash
cd services/api
npx prisma migrate dev --name add_smile_id_fields
```

---

## 3. Webhook Setup
In the Smile ID Portal:
1. Go to **Config** > **Callbacks**.
2. Add your callback URL: `https://your-domain.ngrok-free.app/api/kyc/callback`.
3. Set the product to **Document Verification**.

---

**Status:** Backend Integrated ⚙️ | KYC flows via web app use the API Smile ID service.
