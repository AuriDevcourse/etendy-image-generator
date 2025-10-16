# 🚀 Quick Start: Deploy in 10 Minutes

Fast-track guide to get your app from local to production.

---

## ⚡ Step 1: Setup Environment (2 min)

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# Get them from: https://app.supabase.com/project/_/settings/api
```

**Your .env.local should look like:**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚡ Step 2: Test Locally (2 min)

```bash
# Install dependencies (if not done)
npm install

# Run development server
npm run dev

# Test in browser: http://localhost:5173
# Try logging in with Google OAuth
```

---

## ⚡ Step 3: Push to GitHub (2 min)

```bash
# Stage all files
git add .

# Commit
git commit -m "Initial commit: Ready for deployment"

# Create GitHub repo at: https://github.com/new
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/etendy.git
git push -u origin main
```

---

## ⚡ Step 4: Deploy to Vercel (3 min)

1. **Go to:** [vercel.com/new](https://vercel.com/new)
2. **Import** your GitHub repository
3. **Add Environment Variables:**
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
4. **Click Deploy** 🚀

---

## ⚡ Step 5: Configure OAuth (1 min)

**In Supabase Dashboard:**
1. Go to **Authentication → URL Configuration**
2. Add your Vercel URL to **Redirect URLs**:
   ```
   https://your-app.vercel.app
   https://your-app.vercel.app/**
   ```

---

## ✅ Done!

Your app is now live! 🎉

**Next Steps:**
- Test login on production
- Share your app URL
- Monitor in Vercel dashboard

---

## 🆘 Troubleshooting

**App won't start locally?**
- Check `.env.local` exists and has correct values
- Run `npm install` again

**Build fails on Vercel?**
- Check environment variables are set
- View build logs in Vercel dashboard

**OAuth not working?**
- Verify redirect URLs in Supabase
- Check Google OAuth is configured

---

**Need detailed instructions?** See **DEPLOYMENT.md**

**Need checklist?** See **PRE_DEPLOYMENT_CHECKLIST.md**
