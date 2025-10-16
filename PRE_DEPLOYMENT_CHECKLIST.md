# ✅ Pre-Deployment Checklist

Complete this checklist before pushing to GitHub and deploying to Vercel.

---

## 🔒 Security (CRITICAL)

- [ ] **Remove hardcoded credentials** - ✅ DONE (supabase.js updated)
- [ ] **Create .env.local** with your actual Supabase credentials
- [ ] **Verify .env.local is in .gitignore** - ✅ DONE
- [ ] **Test app locally** with environment variables from .env.local
- [ ] **Never commit .env.local or .env files** to Git

---

## 📦 Code Quality

- [ ] Run `npm run build` locally to ensure no build errors
- [ ] Test all major features:
  - [ ] Google OAuth login
  - [ ] Image generation
  - [ ] Image download
  - [ ] Admin presets (if admin)
  - [ ] User profile
  - [ ] User preferences
- [ ] Check browser console for errors
- [ ] Remove any `console.log` statements (optional)

---

## 🗄️ Database Setup

- [ ] **Supabase tables created:**
  - [ ] `presets`
  - [ ] `admin_users`
  - [ ] `user_preferences`
  - [ ] `user_stats`
  - [ ] `admin_settings`
- [ ] **Row Level Security (RLS) policies enabled** on all tables
- [ ] **Storage bucket `user-images` created** and configured
- [ ] **At least one admin user** added to `admin_users` table
- [ ] **Google OAuth configured** in Supabase Authentication

---

## 📝 Git & GitHub

- [ ] Git initialized: `git init`
- [ ] All files staged: `git add .`
- [ ] Initial commit: `git commit -m "Initial commit"`
- [ ] GitHub repository created
- [ ] Remote added: `git remote add origin <your-repo-url>`
- [ ] Pushed to GitHub: `git push -u origin main`

---

## 🌐 Vercel Setup

- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] **Environment variables added in Vercel:**
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Deployment successful
- [ ] Live URL accessible

---

## 🔐 Post-Deployment Configuration

- [ ] **Supabase OAuth redirect URLs updated** with Vercel domain
- [ ] **Google OAuth authorized redirect URIs updated** with Supabase callback
- [ ] Test production login flow
- [ ] Test image generation on production
- [ ] Test image download on production
- [ ] Verify admin features work (if admin)

---

## 🧪 Production Testing

- [ ] Open production URL in browser
- [ ] Check browser console for errors
- [ ] Test on mobile device
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Verify all images load correctly
- [ ] Test user authentication flow end-to-end

---

## 📊 Monitoring

- [ ] Bookmark Vercel dashboard for your project
- [ ] Bookmark Supabase dashboard
- [ ] Set up error monitoring (optional)
- [ ] Enable Vercel Analytics (optional)

---

## 🚨 Emergency Rollback Plan

If something goes wrong:

1. **Vercel:** Go to Deployments → Previous deployment → Promote to Production
2. **Supabase:** Revert database changes using SQL editor
3. **GitHub:** Revert commit: `git revert <commit-hash>` and push

---

## 📋 Quick Commands Reference

```bash
# Test build locally
npm run build

# Test production build locally
npm run preview

# Check Git status
git status

# Push to GitHub
git add .
git commit -m "Your commit message"
git push origin main

# View environment variables (local)
cat .env.local
```

---

## ✅ Final Verification

Before going live, confirm:

1. ✅ No sensitive data in Git repository
2. ✅ App works locally with .env.local
3. ✅ Build completes without errors
4. ✅ All environment variables set in Vercel
5. ✅ OAuth redirect URLs configured
6. ✅ Database and storage accessible
7. ✅ Production URL loads successfully
8. ✅ User can log in and use core features

---

## 🎉 Ready to Deploy!

If all items are checked, you're ready to deploy!

Follow the detailed steps in **DEPLOYMENT.md** for the complete deployment process.

---

**Last Updated:** Check this list before every major deployment.
