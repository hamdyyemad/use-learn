-- Enable Realtime for tables (if not already in 001_initial_schema.sql)
-- Run this if you need to enable real-time separately

-- Enable Realtime for code_snapshots table
-- This allows WebSocket subscriptions to receive real-time updates when snapshots are added/updated
ALTER PUBLICATION supabase_realtime ADD TABLE code_snapshots;

-- Optionally enable realtime for videos table too
ALTER PUBLICATION supabase_realtime ADD TABLE videos;

-- To verify real-time is enabled, you can check:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

