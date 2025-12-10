# MYXCROW - Frontend

Next.js frontend application for the MYXCROW platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm/yarn

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

The app will be available at `http://localhost:3003` (port 3003 to avoid conflicts)

## 📁 Project Structure

```
apps/web/
├── pages/              # Next.js pages (routing)
│   ├── _app.tsx       # App wrapper with providers
│   ├── index.tsx      # Home page
│   ├── login.tsx      # Login page
│   ├── register.tsx   # Registration page
│   ├── dashboard.tsx  # User dashboard
│   ├── profile.tsx    # User profile
│   ├── wallet.tsx     # Wallet management
│   ├── escrows/       # Escrow pages
│   ├── disputes/      # Dispute pages
│   └── admin/         # Admin pages
├── components/         # Reusable components
│   ├── Layout.tsx     # Main layout with navigation
│   ├── LoadingSkeleton.tsx
│   └── ErrorBoundary.tsx
├── lib/               # Utilities and helpers
│   ├── api-client.ts  # API client with interceptors
│   ├── auth.ts        # Authentication utilities
│   └── utils.ts       # Helper functions
└── styles/
    └── globals.css    # Global styles
```

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4001/api
NEXT_PUBLIC_MAILPIT_URL=http://localhost:8025
NEXT_PUBLIC_MINIO_CONSOLE=http://localhost:9001
NEXT_PUBLIC_ENV=local
```

### API Integration

The frontend connects to the backend API at `http://localhost:4001/api` by default.

All API calls are made through the `apiClient` in `lib/api-client.ts`, which:
- Automatically adds authentication tokens
- Handles 401 errors (redirects to login)
- Provides error handling

## 📱 Features

### ✅ Implemented

- **Authentication**: Login, register, session management
- **Dashboard**: Overview with wallet and escrow stats
- **Escrow Management**: Create, view, fund, ship, deliver, release
- **Evidence Upload**: File upload with presigned URLs
- **Dispute System**: Create disputes, messaging, resolution
- **Wallet**: View balance, transactions, request withdrawals
- **Admin Tools**: Credit/debit wallets, manage disputes
- **User Profile**: View account information

### 🎨 UI Features

- Responsive design (mobile-friendly)
- Loading states and skeletons
- Error handling and boundaries
- Toast notifications
- Form validation
- Protected routes
- Role-based navigation

## 🛠️ Development

### Available Scripts

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Type checking
pnpm type-check

# Linting
pnpm lint
```

### Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: react-hot-toast

## 🔐 Authentication

Authentication is handled via JWT tokens stored in localStorage:
- `accessToken`: Used for API requests
- `refreshToken`: For token refresh (if implemented)
- `user`: User object with profile info

Protected routes check authentication and redirect to `/login` if not authenticated.

## 📊 Data Fetching

We use React Query for all data fetching:
- Automatic caching
- Background refetching
- Optimistic updates
- Error handling

Example:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['escrows'],
  queryFn: async () => {
    const response = await apiClient.get('/escrows');
    return response.data;
  },
});
```

## 🎯 Key Pages

### User Pages
- `/` - Home with API health check
- `/login` - Login page
- `/register` - Registration
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/wallet` - Wallet management
- `/wallet/withdraw` - Request withdrawal

### Escrow Pages
- `/escrows` - List all escrows
- `/escrows/new` - Create new escrow
- `/escrows/[id]` - Escrow details
- `/escrows/[id]/evidence` - Evidence upload

### Dispute Pages
- `/disputes` - List disputes
- `/disputes/new` - Create dispute
- `/disputes/[id]` - Dispute details

### Admin Pages
- `/admin` - Admin dashboard
- `/admin/wallet/credit` - Credit wallet
- `/admin/wallet/debit` - Debit wallet

## 🐛 Troubleshooting

### API Connection Issues
- Check that backend API is running on port 4001
- Verify `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Check browser console for CORS errors

### Authentication Issues
- Clear localStorage and try logging in again
- Check that JWT tokens are being stored
- Verify API is returning correct token format

### Build Issues
- Delete `.next` folder and rebuild
- Clear `node_modules` and reinstall
- Check TypeScript errors: `pnpm type-check`

## 📝 Notes

- The app uses localStorage for session persistence
- All API calls include authentication headers automatically
- Forms use Zod for validation
- Toast notifications appear for all user actions
- Loading states are shown during async operations

## 🚀 Deployment

For production deployment:

1. Update environment variables
2. Build the app: `pnpm build`
3. Start production server: `pnpm start`

Or deploy to Vercel/Netlify with proper environment variables configured.

## 📄 License

Part of the MYXCROW platform project.

