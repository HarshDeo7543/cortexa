# Upstash Redis Setup Guide

Step-by-step guide to set up free Upstash Redis for caching.

## Step 1: Create Upstash Account

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign up with GitHub/Google (free)

## Step 2: Create Redis Database

1. Click **Create Database**
2. Name: `cortexa-cache`
3. Region: Choose closest to your users (e.g., `ap-south-1` for India)
4. Type: **Regional** (free tier)
5. Click **Create**

## Step 3: Get Credentials

1. Click on your database
2. Scroll to **REST API** section
3. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## Step 4: Update .env.local

```env
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

## What Gets Cached

| Data | TTL | Purpose |
|------|-----|---------|
| User Roles | 5 min | Skip Supabase query on each request |
| Applications List | 2 min | Faster dashboard loading |

## Free Tier Limits

- **10,000 commands/day**
- **256 MB storage**
- Sufficient for development and small-scale production

## Graceful Fallback

If Redis is unavailable:
- ✅ App continues to work normally
- ✅ Data fetched directly from database
- ✅ No crashes or errors shown to users
- ⚠️ Just slightly slower (no caching)
