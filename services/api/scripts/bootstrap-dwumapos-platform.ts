/**
 * Bootstrap DwumaPOS as a MYXCROW partner platform + initial API key.
 *
 * Usage (from services/api):
 *   pnpm exec tsx scripts/bootstrap-dwumapos-platform.ts
 *
 * Prints the live secret once — store it in DwumaPOS env / tenant settings.
 */
import { PrismaClient, PlatformEnvironment, PartnerReleasePolicy } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const slug = process.env.DWUMAPOS_PLATFORM_SLUG || 'dwumapos';
  const name = process.env.DWUMAPOS_PLATFORM_NAME || 'DwumaPOS';
  const allowlist = (process.env.DWUMAPOS_SUCCESS_URL_PREFIXES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const platform = await prisma.platformAccount.upsert({
    where: { slug },
    create: {
      name,
      slug,
      releasePolicy: PartnerReleasePolicy.PLATFORM_RELEASE,
      successUrlAllowlist: allowlist,
      cancelUrlAllowlist: allowlist,
      defaultEnvironment: PlatformEnvironment.LIVE,
    },
    update: {
      name,
      releasePolicy: PartnerReleasePolicy.PLATFORM_RELEASE,
      ...(allowlist.length
        ? { successUrlAllowlist: allowlist, cancelUrlAllowlist: allowlist }
        : {}),
    },
  });

  const random = randomBytes(24).toString('base64url');
  const keyId = `mx_live_sk_${random.slice(0, 12)}`;
  const secretBody = randomBytes(32).toString('base64url');
  const plaintext = `${keyId}.${secretBody}`;
  const secretHash = await bcrypt.hash(plaintext, 12);

  await prisma.platformApiKey.create({
    data: {
      platformId: platform.id,
      environment: PlatformEnvironment.LIVE,
      name: 'DwumaPOS bootstrap',
      keyId,
      secretHash,
      lastFour: plaintext.slice(-4),
      keyType: 'secret',
      scopes: [
        'checkout:write',
        'escrows:read',
        'escrows:write',
        'releases:write',
        'refunds:write',
        'merchants:read',
        'merchants:write',
        'webhooks:manage',
        'disputes:read',
        'wallet:read',
      ],
    },
  });

  console.log(JSON.stringify({
    platformId: platform.id,
    slug: platform.slug,
    apiKey: plaintext,
    note: 'Store this secret in DwumaPOS — it will not be shown again.',
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
