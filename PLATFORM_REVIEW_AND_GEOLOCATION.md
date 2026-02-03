# MYXCROW Platform Review & Geolocation/Maps Assessment

**Date:** February 2026  
**Scope:** Full platform (web, mobile, API) — what’s missing; whether geo-location and maps are needed and where.

---

## 1. Platform Overview (What Exists)

### Core features (implemented)

| Area | Status | Notes |
|------|--------|--------|
| **Auth** | ✅ | JWT + refresh, roles (BUYER, SELLER, ADMIN, AUDITOR, SUPPORT), password reset, change password, biometric (mobile) |
| **KYC** | ✅ | Ghana Card + selfie, face matching, admin review, status flow |
| **Escrow** | ✅ | Create → Fund → Ship → Deliver → Release; milestones; auto-release; cancel/refund |
| **Wallet** | ✅ | Balance, Paystack top-up, withdrawals (admin approval), ledger, transaction history |
| **Disputes** | ✅ | Create, status flow, messages, evidence, admin resolution |
| **Evidence** | ✅ | Presigned upload (web/mobile), MinIO/S3, linked to escrow/dispute |
| **Messaging** | ✅ | Escrow messages (buyer–seller), dispute messages (with admin) |
| **Notifications** | ✅ | Email, SMS (Africa’s Talking/Twilio), push (mobile), password-change emails |
| **Support** | ✅ | Intercom (web), support page, Terms & Privacy (web + mobile links) |
| **Admin** | ✅ | Users, KYC review, withdrawals, wallet credit/debit, fees, reconciliation, settings |
| **Reputation** | ✅ | Escrow ratings (API + UI); RatingModal (web + mobile) |
| **Risk/Compliance** | ✅ | Risk scoring, sanctions screening, audit log |
| **Automation** | ✅ | Scheduler, rules engine, auto-release |
| **Shipment** | ⚠️ Partial | Schema: Shipment + ShipmentEvent (carrier, trackingNumber, deliveryAddress Json, location string). Only tracking number + carrier used in “Mark shipped”; no delivery address flow, no tracking-event UI |

### Tech stack

- **API:** NestJS, PostgreSQL, Prisma, Redis, BullMQ, MinIO/S3  
- **Web:** Next.js, React, TanStack Query, Tailwind  
- **Mobile:** Expo, React Native, Expo Router, TanStack Query  

---

## 2. Gaps and Missing Pieces

### 2.1 Product / UX gaps

| Gap | Priority | Description |
|-----|----------|-------------|
| **Delivery/shipping address** | **High** | No “ship to” address at escrow creation or when marking shipped. `Shipment.deliveryAddress` (Json) exists but is never set. Buyers/sellers have no structured address (region, city, street) on profile or escrow. |
| **Seller discovery** | **High** | Create escrow expects **seller email** (no seller search, directory, or “find a seller”). Fine for invite-only; limits growth if you want open marketplace. |
| **Shipment tracking UX** | **Medium** | `ShipmentEvent` (e.g. status, location string, timestamp) exists in DB but there’s no UI to add tracking events or show a timeline. Only “tracking number + carrier” at ship time; no “last location” or event list. |
| **Expected delivery date in UI** | **Low** | `expectedDeliveryDate` exists on escrow but create-escrow form doesn’t expose it on web/mobile. |
| **User profile address** | **Medium** | No address/region/city on User or UserProfile — no “default delivery address” or “business location” for trust/display. |

### 2.2 Technical / quality gaps

| Gap | Priority | Description |
|-----|----------|-------------|
| **Automated tests** | **High** | Effectively one spec file (escrow.service). No integration/E2E; weak safety net for launches. |
| **API documentation** | **Medium** | No Swagger/OpenAPI; harder for partners or frontend to discover/use API. |
| **Pagination in UI** | **Medium** | API supports limit/offset (e.g. 50). Web/mobile lists don’t expose “Load more” or page numbers; large lists will feel incomplete. |
| **Logging** | **Low** | Some `console.log` in API; should use NestJS Logger. |
| **2FA** | **Low** | Not implemented; optional for higher security later. |

### 2.3 Deferred (already documented)

- Mobile Money (MTN, Vodafone, AirtelTigo) — Paystack sufficient for MVP.  
- Marketplace API, direct bank integrations, local languages (Twi, Ga, Ewe).

---

## 3. Do You Need Geo-Location and Maps?

Short answer:  
- **Structured delivery address (no map): yes, needed.**  
- **Optional geo-tagging on evidence: recommended for disputes/proof of delivery.**  
- **Full maps service: not required for MVP;** add when you need “show on map” (evidence, meetup, or carrier tracking).

### 3.1 Where location/maps could apply

| Use case | Geo needed? | Maps needed? | When / instance |
|----------|--------------|--------------|------------------|
| **Delivery address** | Yes (address only) | Optional | **Escrow creation or “ship to”:** Region, city, street (Ghana). Map is optional (“pick on map” for accuracy). |
| **Shipment tracking** | Optional | Optional | **If** you get carrier events with location: show “last known location” or route. Today: tracking link is enough; map is nice-to-have. |
| **Proof of delivery / dispute evidence** | **Recommended** | Nice-to-have | **Evidence upload (e.g. delivery photo):** Optional lat/long (device location with consent). Reduces “I didn’t receive” disputes. **Instance:** Mobile: “Attach location to this photo?” → store in Evidence metadata; admin dispute view can show pin on map. |
| **Seller/buyer location (discovery)** | Optional | Optional | **Later:** “Sellers near you” or “in Accra”. Needs region/city or lat/long on profile. Map for “find local sellers” is post-MVP. |
| **Fraud / risk** | Optional | No | **Login/transaction from unusual place:** IP geolocation (you already have ipAddress in Session) is enough for MVP. Device GPS only for high-value flows later. |
| **In-person meetup** | Only if you add meetup | Optional | **If** you add “meet in person, release on the spot”: meetup place + optional map pin. Not in current scope. |

### 3.2 Recommended approach

1. **Address (no maps) — do first**  
   - Add **delivery/shipping address** to escrow (or to a “ship to” linked to escrow): e.g. region, city, street/landmark (GHS-style).  
   - Optionally add **user profile** address (default delivery or business location).  
   - No map required for MVP; optional “pick on map” later.

2. **Geo-tagging evidence — do when you can**  
   - **Instance:** When user uploads evidence (especially “delivery photo” on mobile), optionally capture device location (with consent).  
   - Store in Evidence (e.g. `metadata.lat`, `metadata.long`, `metadata.capturedAt`).  
   - **Admin dispute view:** Show “Evidence captured at: [address or pin on map]”.  
   - Reduces “not received” disputes and builds trust.

3. **Maps service — only when you need “show on map”**  
   - Not required for MVP.  
   - Add when you implement: evidence location in disputes, “pick delivery on map”, meetup location, or carrier-based tracking with locations.

### 3.3 Summary table

| Feature | Need for MVP? | Instance |
|--------|----------------|----------|
| **Structured delivery address (text)** | **Yes** | Escrow “ship to” and/or profile; no map. |
| **Map for delivery address** | No | Optional later (“pick on map”). |
| **Geo-tag on evidence (lat/long)** | **Recommended** | Proof of delivery / dispute evidence (with user consent). |
| **Map in dispute view (evidence location)** | No | Nice-to-have once you have geo-tagged evidence. |
| **Shipment tracking map** | No | Only if you have carrier location events; otherwise link is enough. |
| **Seller/buyer location for discovery** | No | Post-MVP. |
| **Dedicated maps service (e.g. Mapbox, Google Maps)** | No | Add when you need to render pins/routes (evidence, meetup, or tracking). |

---

## 4. Suggested next steps (priority)

### High impact, no geo/maps

1. **Delivery/shipping address**  
   - Add fields (e.g. region, city, address line) to escrow create or to a “delivery” object; show “Ship to” on escrow detail; optionally let seller confirm/copy to Shipment.deliveryAddress when marking shipped.

2. **Seller discovery (if product direction is “marketplace”)**  
   - Seller search/directory or “invite by link” so buyers don’t have to know email; otherwise keep as is.

3. **Automated tests**  
   - Unit tests for critical services (wallet, escrow, disputes); at least smoke/integration for main API flows.

### Medium impact (optional geo)

4. **Evidence geo-tagging**  
   - Mobile: optional “attach location” on evidence upload; store lat/long (+ consent) in Evidence metadata; show in admin dispute view (text or later map).

5. **Shipment tracking UX**  
   - UI to add/view ShipmentEvents (status, location string, time); optionally later: carrier webhook → events → “last location” or map.

### Lower priority

6. **API docs (Swagger/OpenAPI), pagination in UI, replace console.log, 2FA** as capacity allows.

---

## 5. Conclusion

- **Platform:** Core escrow, wallet, disputes, KYC, notifications, and admin are in place. Main gaps are **delivery address**, **seller discovery** (if you want it), **shipment tracking UX**, and **test coverage**.  
- **Geo:** You **do need structured delivery address** (no map for MVP). **Optional geo-tagging on evidence** is recommended for proof of delivery and disputes.  
- **Maps:** A **maps service is not required for MVP**; add when you need to show locations on a map (evidence, meetup, or carrier tracking).

---

**Document:** `PLATFORM_REVIEW_AND_GEOLOCATION.md`  
**Next:** Implement delivery address flow, then consider evidence geo-tagging and tests.
