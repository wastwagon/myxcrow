# Company Documents — Placeholder

Add the following documents here before copying to pen drives.

**Do not commit real Ghana Card images or incorporation certificates to git.**

---

## Required documents

### 1. Ghana Cards (all developers)

Create folder: `ghana-cards/`

For each developer on the application:
- `developer-1-name-front.jpg` (or .pdf)
- `developer-1-name-back.jpg`
- `developer-2-name-front.jpg`
- `developer-2-name-back.jpg`
- ... repeat for all developers

Requirements:
- Clear, readable scan or photo
- Must be valid Ghana Card (not expired)
- Name must match application form

### 2. Certificate of Incorporation

Create folder: `certificate-of-incorporation/`

- `certificate-of-incorporation.pdf` — certified copy from Registrar General's Department
- Company name on certificate must match registration application exactly

---

## Copy to pen drives

After adding files here, they will be copied to both drives by:

```bash
./software-registration/scripts/prepare-pen-drive.sh 1
./software-registration/scripts/prepare-pen-drive.sh 2
```

Or manually copy this folder to:
- `pen-drive-1/05-company-documents/`
- `pen-drive-2/05-company-documents/`

---

## Privacy note

These documents contain personal and company information. Keep local copies secure. Only place on pen drives intended for the registration authority submission.
