-- Initial schema for Use-Learn MVP
-- Run this in your Supabase SQL Editor

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create code_snapshots table
CREATE TABLE IF NOT EXISTS code_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  timestamp INTEGER NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_code_snapshots_video_id ON code_snapshots(video_id);
CREATE INDEX IF NOT EXISTS idx_code_snapshots_timestamp ON code_snapshots(video_id, timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access (for MVP)
CREATE POLICY "Allow public read access on videos" ON videos
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on code_snapshots" ON code_snapshots
  FOR SELECT USING (true);

-- Allow service role to insert/update (for API routes)
-- Note: Service role bypasses RLS, so these policies are for reference
CREATE POLICY "Allow service role full access on videos" ON videos
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access on code_snapshots" ON code_snapshots
  FOR ALL USING (auth.role() = 'service_role');

-- Enable Realtime for code_snapshots table
-- This allows WebSocket subscriptions to receive real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE code_snapshots;

-- Optionally enable realtime for videos table too
ALTER PUBLICATION supabase_realtime ADD TABLE videos;

