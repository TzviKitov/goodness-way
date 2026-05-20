/**
 * Loads .env.local (then .env) for CLI tools that don't use Next.js env loading:
 * drizzle-kit, tsx scripts (seed, bulk-import), etc.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

const root = process.cwd();

const localPath = resolve(root, ".env.local");
const envPath = resolve(root, ".env");

if (existsSync(localPath)) {
  config({ path: localPath });
} else if (existsSync(envPath)) {
  config({ path: envPath });
}
