#!/usr/bin/env node

/**
 * Migration Runner Script - Automatic Execution
 *
 * This script automatically executes SQL migrations using the 'postgres' library.
 * It prioritizes SUPABASE_DATABASE_URL from .env if available.
 *
 * Usage:
 *   node run-migrations.js [folderName]
 */

const fs = require("fs");
const path = require("path");
const postgres = require("postgres");
require("dotenv").config({
  path: path.resolve(__dirname, "../../../../../.env"),
});

// Get folder name from command line args or use default
const folderName = process.argv[2] || "subapase";

// Get environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
let DATABASE_URL =
  process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

// Handle variable substitution in DATABASE_URL
if (DATABASE_URL && SUPABASE_DB_PASSWORD) {
  DATABASE_URL = DATABASE_URL.replace(
    "{SUPABASE_DB_PASSWORD}",
    encodeURIComponent(SUPABASE_DB_PASSWORD)
  );
  DATABASE_URL = DATABASE_URL.replace(
    "${SUPABASE_DB_PASSWORD}",
    encodeURIComponent(SUPABASE_DB_PASSWORD)
  );

  if (DATABASE_URL.includes("[YOUR-PASSWORD]")) {
    DATABASE_URL = DATABASE_URL.replace(
      "[YOUR-PASSWORD]",
      encodeURIComponent(SUPABASE_DB_PASSWORD)
    );
  }
}

console.log(`📊 Debug Info:`);
if (SUPABASE_URL) {
  const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
  console.log(`   Project Ref: ${projectRef}`);
}
if (SUPABASE_DB_PASSWORD) {
  console.log(`   Password length: ${SUPABASE_DB_PASSWORD.length} characters`);
}
console.log("");

// Path to migrations folder
const migrationsDir = path.join(__dirname, "../../migrations", folderName);

/**
 * Get the connection string to use
 */
function getConnectionString() {
  if (DATABASE_URL) {
    console.log("   Using connection string from SUPABASE_DATABASE_URL");
    return DATABASE_URL;
  }

  if (!SUPABASE_URL || !SUPABASE_DB_PASSWORD) {
    console.error("❌ Error: Missing required environment variables");
    process.exit(1);
  }

  // Fallback to constructing it if no DATABASE_URL provided
  const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
  const encodedPassword = encodeURIComponent(SUPABASE_DB_PASSWORD);

  // Default to direct connection
  return `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log("🚀 Starting migration process...");
  console.log(`📁 Migrations folder: ${folderName}`);
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
  console.log("");

  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Error: Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  const connectionString = getConnectionString();

  // Mask password for logging
  const maskedString = connectionString.replace(/:([^@]+)@/, ":****@");
  console.log(`   Connection: ${maskedString}`);
  console.log("🔌 Connecting to database...");

  // Create SQL connection
  const sql = postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
    max: 1,
    onnotice: () => {}, // Silence notices
  });

  try {
    // Test connection
    await sql`SELECT 1`;
    console.log("   ✅ Connected successfully!");
    console.log("");

    // Ensure migrations table exists in public schema
    const [tableExists] = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'schema_migrations'
            )
        `;

    if (!tableExists.exists) {
      console.log("▶️  Creating migrations table...");
      const migrationsTablePath = path.join(
        migrationsDir,
        "000_migrations_table.sql"
      );
      if (fs.existsSync(migrationsTablePath)) {
        const fileContent = fs.readFileSync(migrationsTablePath, "utf8");
        await sql.unsafe(fileContent);
        console.log("   ✅ Migrations table created successfully!\n");
      } else {
        // Create table directly if migration file doesn't exist
        await sql`
                    CREATE TABLE IF NOT EXISTS public.schema_migrations (
                        id SERIAL PRIMARY KEY,
                        migration_name TEXT NOT NULL UNIQUE,
                        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                    CREATE INDEX IF NOT EXISTS idx_schema_migrations_name ON public.schema_migrations(migration_name);
                `;
        console.log("   ✅ Migrations table created successfully!\n");
      }
    }

    // Read all SQL files from migrations directory
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql") && !file.startsWith("_"))
      .sort();

    if (files.length === 0) {
      console.log("✅ No migration files found");
      await sql.end();
      return;
    }

    console.log(`📝 Found ${files.length} migration file(s)\n`);

    let executedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      const migrationName = file;
      const filePath = path.join(migrationsDir, file);

      try {
        // Handle migrations table creation
        if (file === "000_migrations_table.sql") {
          // Check if table already exists
          const [stillExists] = await sql`
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_schema = 'public' 
                            AND table_name = 'schema_migrations'
                        )
                    `;
          if (stillExists.exists) {
            console.log(
              `⏭️  Skipping ${migrationName} (migrations table already exists)`
            );
            skippedCount++;
            continue;
          } else {
            console.log(`▶️  Creating migrations table...`);
            const fileContent = fs.readFileSync(filePath, "utf8");
            await sql.unsafe(fileContent);
            console.log(`   ✅ Migrations table created successfully!\n`);
            executedCount++;
            continue;
          }
        }

        // Check if migration has already been executed (using schema-qualified table name)
        let executed = null;
        try {
          const [result] = await sql`
                        SELECT migration_name FROM public.schema_migrations WHERE migration_name = ${migrationName}
                    `;
          executed = result;
        } catch (checkError) {
          // If table doesn't exist, create it
          if (checkError.message.includes("does not exist")) {
            console.log("⚠️  Migrations table not found, creating it...");
            const migrationsTablePath = path.join(
              migrationsDir,
              "000_migrations_table.sql"
            );
            if (fs.existsSync(migrationsTablePath)) {
              const fileContent = fs.readFileSync(migrationsTablePath, "utf8");
              await sql.unsafe(fileContent);
            }
            // Retry the check
            const [result] = await sql`
                            SELECT migration_name FROM public.schema_migrations WHERE migration_name = ${migrationName}
                        `;
            executed = result;
          } else {
            throw checkError;
          }
        }

        if (executed) {
          console.log(`⏭️  Skipping ${migrationName} (already executed)`);
          skippedCount++;
          continue;
        }

        console.log(`▶️  Executing ${migrationName}...`);

        // Read and execute the migration
        const fileContent = fs.readFileSync(filePath, "utf8");

        // Use a transaction for safety
        await sql.begin(async (sql) => {
          await sql.unsafe(fileContent);
          await sql`
                        INSERT INTO public.schema_migrations (migration_name) 
                        VALUES (${migrationName}) 
                        ON CONFLICT (migration_name) DO NOTHING
                    `;
        });

        executedCount++;
        console.log(`   ✅ Executed successfully!\n`);
      } catch (error) {
        console.error(`❌ Error executing ${migrationName}:`);
        console.error(`   ${error.message}`);
        process.exit(1);
      }
    }

    console.log("");
    console.log("✅ Migration process completed!");
    console.log(`   Executed: ${executedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log("");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);

    if (error.message.includes("ENOTFOUND")) {
      console.error("");
      console.error(
        "   ⚠️  DNS Error: The database hostname could not be resolved."
      );
      console.error("   Please check your SUPABASE_DATABASE_URL in .env");
    }

    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run migrations
runMigrations().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
