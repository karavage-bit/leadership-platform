# Leadership 2.0 Platform

A revolutionary leadership development platform for high school students featuring AI-powered Socratic conversations, 3D world building, and real-world challenge tracking.

## 🚀 Quick Deploy to Vercel (Free Tier)

### Prerequisites
1. [Supabase](https://supabase.com) account (free tier)
2. [Anthropic](https://console.anthropic.com) API key
3. [Vercel](https://vercel.com) account (free tier)

### Step 1: Set Up Supabase Database

1. Create a new Supabase project
2. Go to **SQL Editor** and run these files **in order**:
   ```
   1. supabase/schema.sql
   2. supabase/schema_additions.sql
   3. supabase/schema_functions.sql  ← CRITICAL: Don't skip this!
   4. supabase/seed.sql
   ```

3. Get your credentials from **Settings → API**:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon/Public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Service Role key (`SUPABASE_SERVICE_ROLE_KEY`) - optional but recommended

### Step 2: Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Set a spending limit (recommended: $10-20/month for classroom use)

### Step 3: Deploy to Vercel

#### Option A: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_REPO)

#### Option B: Manual Deploy
1. Push this code to a GitHub repository
2. Import to Vercel: [vercel.com/new](https://vercel.com/new)
3. Add environment variables:

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Recommended |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | ✅ Yes |

4. Deploy!

### Step 4: Create Your Teacher Account

1. Visit your deployed URL
2. Click "Teacher" tab
3. Register with your email
4. Three classes are auto-created with codes like `ABC1ST`, `DEF2A`, `GHI2B`
5. Share class codes with students

---

## 💰 Cost Estimates (Classroom of 25 students)

| Service | Free Tier | Expected Cost |
|---------|-----------|---------------|
| Vercel | 100GB bandwidth | $0 |
| Supabase | 500MB database, 2GB bandwidth | $0 |
| Anthropic | None | ~$5-15/month |

**Total: ~$5-15/month** depending on AI usage

### Controlling AI Costs
- Each Socratic conversation uses ~5-8 API calls
- Each call costs ~$0.003-0.01
- A full class period might cost $0.50-1.00
- Set spending limits in Anthropic dashboard

---

## 🏗️ Architecture

```
/src
├── /app
│   ├── /student          # Student dashboard (5 tabs)
│   │   ├── /tabs         # HomeTab, WorldTab, CommonsTab, etc.
│   │   └── /hooks        # useStudentData.ts
│   ├── /teacher          # Teacher dashboard
│   └── /api
│       ├── /ai           # Socratic & Brainstorm AI
│       ├── /challenges   # Teacher challenges
│       ├── /discoveries  # Student discoveries
│       ├── /gateway      # Gateway challenge
│       └── /journal      # Growth journal
├── /components           # Shared components
└── /lib
    ├── auth.ts           # API authentication
    └── /supabase         # Database client
```

---

## 🔒 Security Notes

- Student PINs are for classroom convenience, not high security
- All API routes validate user exists in database
- Supabase Row Level Security (RLS) is enabled
- AI responses are monitored for crisis indicators
- Crisis alerts are logged for teacher review

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run database migrations (in Supabase SQL Editor)
# 1. schema.sql
# 2. schema_additions.sql
# 3. schema_functions.sql
# 4. seed.sql

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📋 Database Schema Files

Run these in Supabase SQL Editor **in order**:

1. **schema.sql** - Core tables (users, classes, lessons, etc.)
2. **schema_additions.sql** - Extended features (discoveries, ripples, etc.)
3. **schema_functions.sql** - Required PostgreSQL functions ⚠️ **Critical**
4. **seed.sql** - Initial data (phases, lessons curriculum)

---

## 🆘 Troubleshooting

### "AI service not configured"
- Check `ANTHROPIC_API_KEY` is set in Vercel environment variables
- Redeploy after adding variables

### "Database not configured"
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ensure you ran all SQL files including `schema_functions.sql`

### "Function does not exist" errors
- You forgot to run `schema_functions.sql` - run it now

### Students can't log in
- Verify class code is correct (case-insensitive)
- Check student registered with exact same name

---

## 📄 License

MIT License - Use freely for educational purposes.
