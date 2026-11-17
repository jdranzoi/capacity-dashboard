// Regenerates lib/supabase/database.types.ts from the Supabase project named by
// NEXT_PUBLIC_SUPABASE_URL in an env file (default .env.local).
// Usage: pnpm db:types [env-file]   e.g. pnpm db:types .env.staging.local
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

const envFile = process.argv[2] ?? ".env.local";
if (!existsSync(envFile)) {
  console.error(`Env file not found: ${envFile}`);
  process.exit(1);
}
process.loadEnvFile(envFile);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url) {
  console.error(`NEXT_PUBLIC_SUPABASE_URL is not set in ${envFile}`);
  process.exit(1);
}

// Hosted project URLs are https://<project-ref>.supabase.co
const projectRef = new URL(url).hostname.split(".")[0];
console.error(`Generating types from project ${projectRef} (${envFile})`);

const types = execFileSync(
  "supabase",
  ["gen", "types", "typescript", "--project-id", projectRef, "--schema", "public"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], maxBuffer: 64 * 1024 * 1024 },
);
writeFileSync("lib/supabase/database.types.ts", types);
