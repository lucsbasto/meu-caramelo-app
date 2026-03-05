const { execSync, spawnSync } = require("child_process");
const { readdirSync, readFileSync, existsSync } = require("fs");
const { join } = require("path");

const container = process.env.DB_CONTAINER || "meu_caramelo_db";
const dbUser = process.env.DB_USER || "caramelo";
const dbName = process.env.DB_NAME || "meu_caramelo";
const migrationsDir = process.env.MIGRATIONS_DIR || "supabase/migrations";

if (!existsSync(migrationsDir)) {
  console.error(`Migrations path not found: ${migrationsDir}`);
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (!files.length) {
  console.error(`No SQL files found in ${migrationsDir}`);
  process.exit(1);
}

try {
  execSync(`docker inspect ${container} >NUL 2>NUL`, { stdio: "ignore", shell: true });
} catch {
  console.error(`Container not found: ${container}. Run 'npm run db:up' first.`);
  process.exit(1);
}

console.log(`Applying ${files.length} migration(s) to ${container}/${dbName} ...`);

for (const file of files) {
  const full = join(migrationsDir, file);
  const sql = readFileSync(full, "utf8");
  console.log(`-> ${file}`);

  const result = spawnSync(
    "docker",
    ["exec", "-i", container, "psql", "-v", "ON_ERROR_STOP=1", "-U", dbUser, "-d", dbName],
    { input: sql, stdio: ["pipe", "inherit", "inherit"] },
  );

  if (result.status !== 0) {
    console.error(`Migration failed: ${file}`);
    process.exit(result.status || 1);
  }
}

console.log("Migrations applied successfully.");
