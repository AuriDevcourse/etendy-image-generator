# 🚀 Deployment Guide: GitHub → Vercel

This guide walks you through deploying the Etendy Image Generator to production using GitHub and Vercel.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ A GitHub account
- ✅ A Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ A Supabase project with:
  - Database tables created (presets, admin_users, user_preferences, user_stats, admin_settings)
  - Storage bucket `user-images` configured
  - Google OAuth configured
  - Row Level Security (RLS) policies enabled

---

## 🔧 Step 1: Prepare Your Repository

### 1.1 Remove Hardcoded Credentials

**⚠️ CRITICAL SECURITY STEP**

Your `src/lib/supabase.js` file currently contains hardcoded Supabase credentials. These must be removed before pushing to GitHub.

**Edit `src/lib/supabase.js`:**

```javascript
// BEFORE (lines 4-5):
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://frneypfjfscmlahksjyc.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// AFTER:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}
```

### 1.2 Create Local Environment File

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

### 1.3 Verify .gitignore

Ensure these files are in `.gitignore`:

```
.env
.env.local
*.local
```

✅ Your `.gitignore` already includes these patterns.

---

## 📦 Step 2: Push to GitHub

### 2.1 Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit: Etendy Image Generator"
```

### 2.2 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository (e.g., `etendy-image-generator`)
3. **Do NOT** initialize with README, .gitignore, or license (you already have these)

### 2.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/etendy-image-generator.git
git branch -M main
git push -u origin main
```

---

## 🌐 Step 3: Deploy to Vercel

### 3.1 Import Project to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repository
4. Vercel will auto-detect it as a **Vite** project

### 3.2 Configure Environment Variables

In the Vercel deployment settings, add these environment variables:

| Variable Name | Value | Where to Find |
|--------------|-------|---------------|
| `VITE_SUPABASE_URL` | Your Supabase URL | [Supabase Dashboard](https://app.supabase.com) → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Same location as above |

**Steps:**
1. In Vercel deployment screen, expand **"Environment Variables"**
2. Add each variable with its value
3. Select **"Production"**, **"Preview"**, and **"Development"** for all variables

### 3.3 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Vercel will provide a live URL (e.g., `https://etendy-image-generator.vercel.app`)

---

## 🔐 Step 4: Configure Supabase for Production

### 4.1 Update OAuth Redirect URLs

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication → URL Configuration**
3. Add your Vercel URL to **Redirect URLs**:
   ```
   https://your-app.vercel.app
   https://your-app.vercel.app/**
   ```

### 4.2 Update Google OAuth Authorized Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services → Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   ```
   https://your-supabase-project.supabase.co/auth/v1/callback
   ```

### 4.3 Configure CORS (if needed)

If you encounter CORS issues, add your Vercel domain to Supabase allowed origins:

1. Supabase Dashboard → **Settings → API**
2. Add your Vercel URL to **CORS allowed origins**

---

## 🔄 Step 5: Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will:
- ✅ Automatically detect the push
- ✅ Build your project
- ✅ Deploy to production
- ✅ Provide a unique preview URL for each commit

---

## 🧪 Step 6: Testing Production

### 6.1 Test Core Features

- [ ] Google OAuth login works
- [ ] User profile loads correctly
- [ ] Image generation works
- [ ] Image download functions properly
- [ ] Admin presets load (if admin user)
- [ ] User preferences save correctly
- [ ] Statistics update properly

### 6.2 Check Browser Console

Open DevTools and verify:
- ✅ No CORS errors
- ✅ Supabase connection successful
- ✅ No 404 errors on assets

---

## 🐛 Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution:** Verify environment variables are set in Vercel:
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present
3. Redeploy: Deployments → Latest → ⋯ → Redeploy

### Issue: OAuth redirect fails

**Solution:** Check redirect URLs:
1. Supabase: Authentication → URL Configuration
2. Add your Vercel domain
3. Verify Google OAuth redirect URIs include Supabase callback URL

### Issue: Images not loading

**Solution:** Check Supabase Storage:
1. Supabase Dashboard → Storage → user-images
2. Verify bucket is **public**
3. Check RLS policies allow public read access

### Issue: Build fails on Vercel

**Solution:** Check build logs:
1. Common causes:
   - Missing dependencies in `package.json`
   - TypeScript errors
   - Import path issues
2. Test locally: `npm run build`
3. Fix errors and push again

---

## 📊 Monitoring & Analytics

### Vercel Analytics (Optional)

Enable Vercel Analytics for insights:
1. Vercel Dashboard → Your Project → Analytics
2. Click **"Enable Analytics"**
3. Install package: `npm install @vercel/analytics`
4. Add to `src/main.jsx`:
   ```javascript
   import { inject } from '@vercel/analytics'
   inject()
   ```

### Supabase Monitoring

Monitor database usage:
1. Supabase Dashboard → Database → Usage
2. Check API requests, storage, and bandwidth

---

## 🔒 Security Checklist

Before going live, verify:

- [ ] No hardcoded credentials in source code
- [ ] `.env.local` is in `.gitignore`
- [ ] Environment variables set in Vercel
- [ ] Supabase RLS policies are enabled
- [ ] OAuth redirect URLs are configured
- [ ] Admin users are properly configured in `admin_users` table
- [ ] Storage bucket has appropriate access policies

---

## 🎉 You're Live!

Your Etendy Image Generator is now deployed and accessible worldwide!

**Next Steps:**
- Share your app URL
- Monitor usage in Vercel and Supabase dashboards
- Set up custom domain (optional): Vercel → Settings → Domains
- Enable Vercel Analytics for user insights

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Actions for CI/CD](https://docs.github.com/en/actions)

---

## 🆘 Need Help?

- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Supabase Support: [supabase.com/support](https://supabase.com/support)
- GitHub Issues: Create an issue in your repository

---

**Happy Deploying! 🚀**
