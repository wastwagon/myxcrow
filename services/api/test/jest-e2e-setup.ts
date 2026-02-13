/**
 * E2E test setup: load .env so DATABASE_URL and other vars are available.
 * Run from services/api: pnpm test:e2e
 */
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.join(__dirname, '../.env') });
config({ path: path.join(__dirname, '../.env.test') });
