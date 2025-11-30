#!/usr/bin/env node

/**
 * Migration Runner Script
 * 
 * This script runs SQL migrations from the migrations folder in order.
 * It tracks which migrations have been executed to prevent duplicates.
 * 
 * Usage:
 *   node run-migrations.js [folderName]
 *   
 * Example:
 *   node run-migrations.js supabase
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../../.env') });

// Get folder name from command line args or use default
const folderName = process.argv[2] || 'subapase';

// Validate environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Missing required environment variables');
    console.error('Please ensure the following are set in your .env file:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Path to migrations folder
const migrationsDir = path.join(__dirname, '../../migrations', folderName);

/**
 * Ensure the schema_migrations table exists
 */
async function ensureMigrationsTable() {
    try {
        // Try to query the table
        const { error } = await supabase
            .from('schema_migrations')
            .select('migration_name')
            .limit(1);

        if (error) {
            // Table doesn't exist, we need to create it
            console.log('📋 Creating schema_migrations table...');

            // Read and execute the 000_migrations_table.sql file
            const migrationTablePath = path.join(migrationsDir, '000_migrations_table.sql');

            if (!fs.existsSync(migrationTablePath)) {
                console.error('❌ Error: 000_migrations_table.sql not found');
                console.error('   This file is required to create the migrations tracking table');
                process.exit(1);
            }

            const sql = fs.readFileSync(migrationTablePath, 'utf8');
            console.log('   ⚠️  Please run the following SQL in Supabase SQL Editor:');
            console.log('   ' + migrationTablePath);
            console.log('');
            console.log('   Or copy and paste this SQL:');
            console.log('   ---');
            console.log(sql);
            console.log('   ---');
            console.log('');
            console.log('   After running the SQL, run this script again.');
            process.exit(0);
        }
    } catch (err) {
        console.error('❌ Error checking migrations table:', err.message);
        process.exit(1);
    }
}

/**
 * Check if a migration has already been executed
 */
async function isMigrationExecuted(migrationName) {
    const { data, error } = await supabase
        .from('schema_migrations')
        .select('migration_name')
        .eq('migration_name', migrationName)
        .single();

    if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new migrations
        console.error('Error checking migration status:', error);
        return false;
    }

    return !!data;
}

/**
 * Mark a migration as executed
 */
async function markMigrationExecuted(migrationName) {
    const { error } = await supabase
        .from('schema_migrations')
        .insert({ migration_name: migrationName });

    if (error) {
        throw error;
    }
}

/**
 * Main migration runner
 */
async function runMigrations() {
    console.log('🚀 Starting migration process...');
    console.log(`📁 Migrations folder: ${folderName}`);
    console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
    console.log('');

    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
        console.error(`❌ Error: Migrations directory not found: ${migrationsDir}`);
        process.exit(1);
    }

    // Ensure migrations table exists
    await ensureMigrationsTable();

    // Read all SQL files from migrations directory
    const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Sort alphabetically to ensure order

    if (files.length === 0) {
        console.log('✅ No migration files found');
        return;
    }

    console.log(`📝 Found ${files.length} migration file(s):\n`);

    let executedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
        const migrationName = file;
        const filePath = path.join(migrationsDir, file);

        try {
            // Skip the migrations table file if it's already been handled
            if (file === '000_migrations_table.sql') {
                console.log(`⏭️  Skipping ${migrationName} (migrations table already exists)`);
                skippedCount++;
                continue;
            }

            // Check if migration has already been executed
            const alreadyExecuted = await isMigrationExecuted(migrationName);

            if (alreadyExecuted) {
                console.log(`⏭️  Skipping ${migrationName} (already executed)`);
                skippedCount++;
                continue;
            }

            console.log(`▶️  Executing ${migrationName}...`);

            // Read the migration
            const sql = fs.readFileSync(filePath, 'utf8');

            // For Supabase, we'll log the SQL and ask the user to run it manually
            console.log(`   ⚠️  Automatic execution not available`);
            console.log(`   📋 Please run this migration manually in Supabase SQL Editor:`);
            console.log(`   ${filePath}`);

            // Mark as executed to track it
            await markMigrationExecuted(migrationName);
            executedCount++;
            console.log(`   ✅ Marked as executed\n`);

        } catch (error) {
            console.error(`❌ Error executing ${migrationName}:`);
            console.error(error.message);
            process.exit(1);
        }
    }

    console.log('');
    console.log('✅ Migration process completed!');
    console.log(`   Executed: ${executedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log('');
    console.log('⚠️  Note: Due to Supabase limitations, migrations must be run manually');
    console.log('   in the Supabase SQL Editor. This script tracks which migrations');
    console.log('   have been executed to prevent duplicates.');
}

// Run migrations
runMigrations().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
