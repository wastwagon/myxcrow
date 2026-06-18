# Registration Status — MYXCROW v1.0.0

Last updated: June 2026

## ✅ Complete (automated via terminal)

| Item | Location |
|------|----------|
| Source code zip (~112 MB) | `pen-drive-*/02-source-code/MYXCROW-source-v1.0.0.zip` |
| Database schema (30 tables) | `pen-drive-*/03-database-schema/` |
| Node executables (~59 MB) | `pen-drive-*/01-executable/node-build/` |
| Docker compose + setup | `pen-drive-*/01-executable/setup-local.sh` |
| **Screen recording** | `pen-drive-*/04-screen-recording/MYXCROW-demo.mp4` (~2 MB) |
| Android APK + source | `pen-drive-*/06-webview-gold-project/` |
| iOS source | `MYXCROW-ios-source.zip` |
| Cover letter HTML | `COVER_LETTER.html` (print → PDF) |

## ❌ You still need to add

| Item | Action |
|------|--------|
| Ghana Cards | Copy to `company-documents/ghana-cards/` then run `finish-registration.sh` |
| Certificate of incorporation | Copy to `company-documents/certificate-of-incorporation/` |
| Cover letter PDF | Open `COVER_LETTER.html` → fill company details → Print → Save as PDF |
| Company name in README | Edit `pen-drive-*/README.txt` |
| Physical pen drives | Run `./scripts/copy-to-usb.sh` when drives are plugged in |
| GHS 185 fee | Pay at registration office |

## Copy to USB pen drives

```bash
cd /Users/OceanCyber/Downloads/myxcrow
./software-registration/scripts/copy-to-usb.sh
```

## Start demo app (for re-recording if needed)

```bash
./software-registration/scripts/start-app.sh
# Web: http://localhost:3017  API: http://localhost:4010
./software-registration/scripts/record-demo-playwright.sh
```

## Test logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@myxcrow.com | password123 |
| Buyer | buyer1@test.com | password123 |
| Seller | seller1@test.com | password123 |
