# Web vs Mobile Feature Matrix

**Date:** January 2026  
**Quick Reference:** Feature availability across platforms

**Architecture:** Both web and mobile use the **same database**, **same backend API**, and **same admin backend**. Only the frontend clients differ. See [SHARED_ARCHITECTURE.md](SHARED_ARCHITECTURE.md).

---

## 📊 FEATURE COMPARISON TABLE

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| **AUTHENTICATION** |
| Login/Register | ✅ | ✅ | Both |
| Biometric Auth | ❌ | ✅ | Mobile only (Face ID/Touch ID) |
| Token Refresh | ✅ | ✅ | Both |
| **DASHBOARD** |
| User Dashboard | ✅ | ✅ | Both (web more detailed) |
| Admin Dashboard | ✅ | ❌ | Web only |
| Stats Overview | ✅ | ✅ | Both |
| Quick Actions | ✅ | ✅ | Both |
| **ESCROW MANAGEMENT** |
| Create Escrow | ✅ | ✅ | Both |
| View Escrows List | ✅ | ✅ | Both |
| Escrow Details | ✅ | ✅ | Both |
| Fund Escrow | ✅ | ✅ | Both |
| Ship Escrow | ✅ | ✅ | Both |
| Deliver Escrow | ✅ | ✅ | Both |
| Release Funds | ✅ | ✅ | Both |
| Cancel Escrow | ✅ | ✅ | Both |
| **FILTERING & SEARCH** |
| Basic Filter (Status) | ✅ | ✅ | Both |
| Advanced Filter | ✅ | ❌ | Web only (amount, date, counterparty) |
| Search by ID | ✅ | ✅ | Both |
| Search by Email | ✅ | ❌ | Web only |
| Date Range Filter | ✅ | ❌ | Web only |
| Amount Range Filter | ✅ | ❌ | Web only |
| **EXPORT & REPORTING** |
| CSV Export | ✅ | ❌ | Web only |
| PDF Export | ❌ | ❌ | Not implemented |
| Print View | ❌ | ❌ | Not implemented |
| **WALLET** |
| View Balance | ✅ | ✅ | Both |
| Top Up | ✅ | ✅ | Both (Paystack) |
| Withdraw | ✅ | ✅ | Both |
| Transaction History | ✅ | ✅ | Both |
| **DISPUTES** |
| Create Dispute | ✅ | ✅ | Both |
| View Disputes | ✅ | ✅ | Both |
| Dispute Details | ✅ | ✅ | Both |
| **PROFILE & KYC** |
| View Profile | ✅ | ✅ | Both |
| Update Profile | ✅ | ✅ | Both |
| KYC Upload | ✅ | ✅ | Both |
| KYC Camera | ❌ | ✅ | Mobile only (better UX) |
| KYC File Picker | ✅ | ✅ | Both |
| **ADMIN FEATURES** |
| User Management | ✅ | ❌ | Web only |
| KYC Review | ✅ | ❌ | Web only |
| Fee Management | ✅ | ❌ | Web only |
| Wallet Credit/Debit | ✅ | ❌ | Web only |
| Withdrawal Approvals | ✅ | ❌ | Web only |
| Reconciliation | ✅ | ❌ | Web only |
| Platform Settings | ✅ | ❌ | Web only |
| **NOTIFICATIONS** |
| Email Notifications | ✅ | ✅ | Both (backend) |
| SMS Notifications | ✅ | ✅ | Both (backend) |
| Push Notifications | ❌ | ✅ | Mobile only |
| In-App Notifications | ✅ | ✅ | Both (Toast) |
| **MOBILE-SPECIFIC** |
| Offline Viewing | ❌ | ⚠️ | Partial (cached data) |
| Native Sharing | ❌ | ❌ | Not implemented |
| Widgets | ❌ | ❌ | Not implemented |
| Swipe Actions | ❌ | ❌ | Not implemented |
| **WEB-SPECIFIC** |
| Multi-column Layouts | ✅ | ❌ | Web only |
| Keyboard Shortcuts | ❌ | ❌ | Not implemented |
| Print Functionality | ❌ | ❌ | Not implemented |
| Rich Analytics | ✅ | ❌ | Web only (admin) |

---

## 🎯 CORE FEATURES (Must Match)

These features should work identically on both platforms:

1. ✅ **Escrow Creation** - Same fields, same validation
2. ✅ **Escrow Actions** - Fund, Ship, Deliver, Release
3. ✅ **Wallet Operations** - Top-up, Withdraw, History
4. ✅ **Dispute Management** - Create, View, Details
5. ✅ **Profile Management** - View, Update
6. ✅ **KYC Upload** - Same documents required

---

## 🔄 PLATFORM-SPECIFIC FEATURES (Should Differ)

### **Web-Only (Keep):**
- Admin dashboard
- Advanced filtering
- CSV export
- Detailed analytics
- Bulk operations

### **Mobile-Only (Keep):**
- Push notifications
- Biometric auth
- Camera for KYC
- Offline viewing
- Quick actions

---

## ✅ STATUS: CORRECT IMPLEMENTATION

**Current State:** ✅ **Optimal**
- Core features match ✅
- Platform-specific features optimized ✅
- No unnecessary duplication ✅
- Each platform excels at its strengths ✅

**Recommendation:** ✅ **Keep as-is**
- Don't try to match 100%
- Continue optimizing each platform separately
- Focus on core feature parity
- Let platform-specific features differ

---

**Last Updated:** January 2026
