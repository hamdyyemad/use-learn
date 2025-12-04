-- Enable Realtime for tables (if not already in 001_initial_schema.sql)
-- Run this if you need to enable real-time separately
-- This migration is idempotent and will skip tables already in the publication

DO $$
BEGIN
  -- Enable Realtime for code_snapshots table if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'code_snapshots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE code_snapshots;
    RAISE NOTICE 'Added code_snapshots to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'code_snapshots is already in supabase_realtime publication';
  END IF;

  -- Enable Realtime for videos table if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'videos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE videos;
    RAISE NOTICE 'Added videos to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'videos is already in supabase_realtime publication';
  END IF;
END $$;

-- To verify real-time is enabled, you can check:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

