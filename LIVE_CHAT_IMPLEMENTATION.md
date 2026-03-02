# Live Chat Support Implementation Guide

**Date:** January 2026  
**Status:** Phase 3 - Implementation  
**Service:** Intercom (Recommended)

> **Note:** The native mobile app has been removed. Live chat is used on the web app only.

---

## 📋 Overview

Live chat support provides real-time customer assistance directly within the MYXCROW platform, improving user experience and reducing support response times.

---

## 🎯 Implementation Options

### Option 1: Intercom (Recommended) ✅
- **Pros:**
  - Easy integration
  - Great mobile SDK
  - Built-in chatbot
  - Rich features (file sharing, video, etc.)
  - Good pricing for startups

### Option 2: Zendesk Chat
- **Pros:**
  - Enterprise-grade
  - Advanced analytics
  - Integration with Zendesk support

### Option 3: Custom Solution
- **Pros:**
  - Full control
  - No external dependencies
- **Cons:**
  - More development time
  - Need to build infrastructure

**Recommendation:** Start with Intercom for MVP, can migrate later if needed.

---

## 🔧 Implementation Steps

### Step 1: Intercom Setup

1. **Create Intercom Account**
   - Go to https://www.intercom.com
   - Sign up for account
   - Choose plan (Start with "Essential" for MVP)

2. **Get API Keys**
   - App ID
   - API Key (for backend)
   - Access Token

3. **Configure Workspace**
   - Set up team members
   - Configure business hours
   - Set up auto-responses

---

## 📱 Web Integration

### Installation

```bash
cd apps/web
pnpm add react-use-intercom
```

### Implementation

```typescript
// apps/web/components/IntercomChat.tsx
import { IntercomProvider, useIntercom } from 'react-use-intercom';
import { useEffect } from 'react';
import { getUser } from '@/lib/auth';

export function IntercomChatProvider({ children }) {
  const INTERCOM_APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID;

  return (
    <IntercomProvider appId={INTERCOM_APP_ID}>
      {children}
    </IntercomProvider>
  );
}

export function IntercomChatWidget() {
  const { boot, shutdown } = useIntercom();
  const user = getUser();

  useEffect(() => {
    if (user) {
      boot({
        userId: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      });
    } else {
      shutdown();
    }
  }, [user, boot, shutdown]);

  return null; // Widget renders automatically
}
```

### Add to Layout

```typescript
// apps/web/pages/_app.tsx
import { IntercomChatProvider, IntercomChatWidget } from '@/components/IntercomChat';

export default function App({ Component, pageProps }) {
  return (
    <IntercomChatProvider>
      <Component {...pageProps} />
      <IntercomChatWidget />
    </IntercomChatProvider>
  );
}
```

---

## 📱 Mobile (browser)

Live chat runs on the **web app** only. Use the web app in a mobile browser for the same experience; no native app integration.

---

## 🤖 Chatbot Configuration

### Common Queries Setup

1. **Welcome Message**
   - "Hi! How can we help you today?"

2. **FAQ Responses**
   - "How do I create an escrow?"
   - "How do I fund my wallet?"
   - "What are the fees?"
   - "How do I verify my KYC?"

3. **Escalation Rules**
   - Escalate to human if query contains: "dispute", "refund", "problem"
   - Auto-respond to: "fees", "kyc", "wallet"

---

## 🔐 Environment Variables

### Web (.env.local)
```bash
NEXT_PUBLIC_INTERCOM_APP_ID=your-app-id
```

### Backend (.env)
```bash
INTERCOM_ACCESS_TOKEN=your-access-token
```

---

## 📊 Features

### Implemented:
- ✅ Web chat widget
- ✅ Mobile chat widget
- ✅ User identification
- ✅ Chat history
- ✅ File sharing
- ✅ Auto-responses

### Future Enhancements:
- [ ] WhatsApp Business integration
- [ ] Video chat
- [ ] Screen sharing
- [ ] Advanced analytics

---

## 🚀 Next Steps

1. **Set up Intercom account**
2. **Get API credentials**
3. **Install SDKs**
4. **Integrate widgets**
5. **Configure chatbot**
6. **Test on web**
7. **Train support team**

---

**Last Updated:** January 2026
