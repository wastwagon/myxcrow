# Software registration — database schema

## Canonical source

The **live** Prisma schema and migrations are maintained here:

```
services/api/prisma/schema.prisma
services/api/prisma/migrations/
```

Always treat that path as the source of truth for the running application.

## This folder

`software-registration/database-schema/schema.prisma` is a **registration snapshot** copied from the canonical schema for offline review and compliance bundles. It may lag briefly after schema changes.

`software-registration/pen-drive-1/` and `software-registration/pen-drive-2/` are **historical USB delivery snapshots** and are not updated automatically.

## Sync snapshot

After schema changes in `services/api/prisma/`:

```bash
cp services/api/prisma/schema.prisma software-registration/database-schema/schema.prisma
```

## Recent model changes

| Change | Notes |
|--------|--------|
| `PayoutMethod` | Saved bank / mobile-money payout methods for withdrawals |
| `BankAccount` removed | Legacy unused table; replaced by `PayoutMethod` |
