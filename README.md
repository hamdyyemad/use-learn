# Use-Learn: Interactive Code Learning Platform

A Scrimba-like interactive code-learning platform that synchronizes video playback with live code editing in an integrated IDE. Built with Next.js, Supabase, and Monaco Editor.

## Features

### For Students (Playground)
- 🎥 **Synchronized Video & Code**: Code updates automatically as the video plays
- 💻 **Integrated IDE**: Monaco Editor with syntax highlighting
- ⌨️ **Smooth Typing Animation**: Letter-by-letter typing with diff-based updates
- 🔄 **Real-time Updates**: Supabase Realtime for live code synchronization

### For Instructors (Recording Studio)
- 🎬 **Record Lessons**: Record video while typing code
- 📝 **Auto Code Tracking**: Automatically captures code changes with timestamps
- 👀 **Review Before Submit**: Preview recording with synced code playback
- 📤 **Easy Upload**: Submit to database with one click

### Technical
- 🏗️ **Repository Pattern**: Easy to switch database or real-time providers
- 📦 **MVP Ready**: Includes seeding script for quick testing

## Architecture

### Repository Pattern

The codebase uses a repository pattern to abstract database and real-time operations:

- `lib/repositories/video.repository.ts` - Video and code snapshot database operations
- `lib/repositories/realtime.repository.ts` - Real-time subscription management

This allows you to easily switch between different providers (Supabase, Firebase, custom backend) without changing your application code.

### Database Schema

The MVP uses two main tables:

1. **videos** - Stores video metadata
   - `id` (uuid, primary key)
   - `title` (text)
   - `video_url` (text)
   - `duration` (number, in seconds)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

2. **code_snapshots** - Stores code at specific video timestamps
   - `id` (uuid, primary key)
   - `video_id` (uuid, foreign key to videos)
   - `timestamp` (number, in seconds - when in the video this code appears)
   - `code` (text, the actual code content)
   - `language` (text, e.g., 'javascript', 'typescript', 'python')
   - `created_at` (timestamp)

## Quick Start

For a detailed step-by-step setup guide, see [SETUP.md](./SETUP.md).

## Setup Instructions

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Step 4: Create Database Tables

Run the migration SQL file in your Supabase SQL Editor (Dashboard → SQL Editor):

**Option 1: Use the migration file (recommended)**
- Copy the contents of `supabase/migrations/001_initial_schema.sql`
- Paste into Supabase SQL Editor and run

**Option 2: Manual SQL**
Run these SQL commands:

```sql
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

-- Create index for faster queries
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
CREATE POLICY "Allow service role full access on videos" ON videos
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access on code_snapshots" ON code_snapshots
  FOR ALL USING (auth.role() = 'service_role');
```

### Step 5: Enable Realtime

The migration SQL already includes real-time setup, but if you need to enable it manually:

Run this SQL in the **SQL Editor**:

```sql
-- Enable Realtime for code_snapshots table (for WebSocket updates)
ALTER PUBLICATION supabase_realtime ADD TABLE code_snapshots;

-- Optionally enable for videos table too
ALTER PUBLICATION supabase_realtime ADD TABLE videos;
```

**Important:** The `Database → Replication` section in the dashboard is for read replicas, NOT for real-time WebSockets. Real-time is enabled via SQL using PostgreSQL publications (shown above).

### Step 6: Seed the Database (MVP Testing)

Run the seed endpoint to create a fake video with code snapshots:

```bash
curl -X POST http://localhost:3000/api/seed
```

Or visit `http://localhost:3000/api/seed` in your browser (though POST requests work better with curl/Postman).

### Step 7: Run the Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000/playground` to see the interactive IDE with video synchronization.

### For Instructors: Record a Lesson

1. Visit `http://localhost:3000/instructor`
2. Allow camera and microphone access
3. Click **Start Recording**
4. Type code and explain your lesson
5. Click **Stop Recording** when done
6. Review your recording
7. Enter a title and click **Submit to Database**

See [INSTRUCTOR_GUIDE.md](./INSTRUCTOR_GUIDE.md) for detailed instructions.

## How It Works

### Video-Code Synchronization

1. **Video Playback**: The video player tracks the current playback time
2. **Timestamp Matching**: As the video plays, the system finds the most recent code snapshot at or before the current timestamp
3. **Code Update**: The IDE automatically updates to show the code that corresponds to that moment in the video
4. **Real-time Updates**: If new code snapshots are added while watching, they appear automatically via Supabase Realtime

### Real-time Architecture

The platform uses **Supabase Realtime** (built on PostgreSQL logical replication) which provides:

- ✅ **No-cost WebSockets**: Free tier includes real-time capabilities
- ✅ **Low Latency**: Direct connection to your database
- ✅ **Automatic Reconnection**: Handles connection drops gracefully
- ✅ **PostgreSQL Native**: Uses database triggers for change detection

**How it works:**
1. Client subscribes to changes on `code_snapshots` table filtered by `video_id`
2. When a new snapshot is inserted/updated, PostgreSQL triggers a change event
3. Supabase Realtime broadcasts the change to all subscribed clients via WebSocket
4. The frontend receives the update and refreshes the code if needed

### Code Snapshot Strategy

Code snapshots are stored at specific timestamps (in seconds). The system uses a **"most recent before or at"** strategy:

- If video is at 12 seconds, it shows the code from the snapshot at timestamp ≤ 12
- If no snapshot exists before current time, it shows empty code
- Snapshots should be created at key moments when code changes

**Recommended approach:**
- Create snapshots at intervals (every 5-10 seconds) or when significant code changes occur
- More snapshots = smoother transitions, but more database storage
- For MVP, 5-10 snapshots per minute of video is reasonable

## Project Structure

```
use-learn/
├── app/
│   ├── api/
│   │   ├── videos/
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts          # GET video with snapshots
│   │   │   │   └── snapshots/
│   │   │   │       └── route.ts      # POST new code snapshot
│   │   │   └── route.ts              # GET all videos, POST new video
│   │   └── seed/
│   │       └── route.ts              # Seed database (MVP)
│   ├── playground/
│   │   └── page.tsx                  # Main interactive IDE page
│   └── ...
├── lib/
│   ├── repositories/
│   │   ├── video.repository.ts       # Video DB operations
│   │   └── realtime.repository.ts    # Real-time subscriptions
│   ├── supabase/
│   │   ├── client.ts                 # Client-side Supabase
│   │   └── server.ts                 # Server-side Supabase
│   └── types/
│       └── database.ts               # TypeScript types
└── ...
```

## API Endpoints

### `GET /api/videos`
Get all videos.

**Response:**
```json
{
  "videos": [
    {
      "id": "uuid",
      "title": "Video Title",
      "video_url": "https://...",
      "duration": 60,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### `GET /api/videos/[id]`
Get a video with all its code snapshots.

**Response:**
```json
{
  "video": {
    "id": "uuid",
    "title": "Video Title",
    "video_url": "https://...",
    "duration": 60,
    "code_snapshots": [
      {
        "id": "uuid",
        "video_id": "uuid",
        "timestamp": 0,
        "code": "// code here",
        "language": "javascript"
      }
    ]
  }
}
```

### `POST /api/videos`
Create a new video.

**Body:**
```json
{
  "title": "Video Title",
  "video_url": "https://...",
  "duration": 60
}
```

### `POST /api/videos/[id]/snapshots`
Add a code snapshot to a video.

**Body:**
```json
{
  "timestamp": 10,
  "code": "const x = 1;",
  "language": "javascript"
}
```

### `POST /api/videos/upload`
Upload a video file to Supabase Storage.

**Body:** `FormData` with `video` field containing the file.

**Response:**
```json
{
  "url": "https://...",
  "path": "videos/1234567890-recording.webm"
}
```

### `POST /api/seed`
Seed the database with a fake video and snapshots (MVP only).

## Switching Database Providers

To switch from Supabase to another provider:

1. **Update Repository Implementation**: Modify `lib/repositories/video.repository.ts` to use your new database client
2. **Update Real-time**: Modify `lib/repositories/realtime.repository.ts` to use your new real-time solution
3. **Update Types**: Adjust `lib/types/database.ts` if needed
4. **Update API Routes**: The API routes in `app/api/` should work as-is since they use the repository pattern

The repository pattern ensures your application code remains unchanged.

## Pages

- `/playground` - Student view: Watch videos with synced code
- `/instructor` - Instructor view: Record new lessons
- `/instructor/review` - Review recorded lessons before submission

## Future Enhancements

- [ ] User authentication and course management
- [ ] Screen sharing option for instructors
- [ ] Code execution in the browser
- [ ] Multiple file support (not just single code editor)
- [ ] Playback speed controls
- [ ] Code diff visualization
- [ ] Student progress tracking
- [ ] Comments and annotations
- [ ] Edit code snapshots after recording
- [ ] Video trimming before submission

## Troubleshooting

### Real-time not working?
- Check that Realtime is enabled for `code_snapshots` table in Supabase dashboard
- Verify your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Check browser console for WebSocket connection errors

### Code not syncing with video?
- Ensure code snapshots are created with correct timestamps
- Check that snapshots are ordered by timestamp
- Verify video duration matches your snapshot timestamps

### Database connection issues?
- Verify all environment variables are set correctly
- Check Supabase project is active and not paused
- Ensure RLS policies allow the operations you're trying to perform

## License

MIT
