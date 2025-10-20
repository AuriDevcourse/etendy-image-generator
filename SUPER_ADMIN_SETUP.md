# 🔐 Super Admin System - Complete Setup Guide

## Overview

This system implements a **three-tier role hierarchy**:

1. **Super Admin** (You) - Can promote/demote admins, full system access
2. **Admin** - Can create presets, lock features, manage content
3. **Regular User** - Can only access via shared preset links (requires login)

---

## 📋 Setup Steps

### Step 1: Run the Database Migration

1. Open Supabase SQL Editor
2. Run the SQL script: `database/user_roles.sql`
3. This creates:
   - `user_roles` table
   - RLS policies
   - Helper functions (`is_super_admin`, `is_admin`, `get_user_role`)
   - Auto-trigger for new user signups

### Step 2: Make Yourself Super Admin

1. **Sign in to your app** to create your user account
2. Go to Supabase Dashboard → Authentication → Users
3. **Copy your User ID** (UUID format)
4. Go to SQL Editor and run:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'super_admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'super_admin';
```

5. Verify it worked:

```sql
SELECT * FROM public.user_roles WHERE role = 'super_admin';
```

---

## 🎯 How It Works

### Role Assignment

**New Users:**
- Automatically get `user` role on signup (via trigger)
- Cannot access app directly
- Can only access via shared preset links

**Admins:**
- Promoted by Super Admin
- Can create and manage presets
- Can lock features for their presets
- Have access to Admin Panel

**Super Admin:**
- Manually set in database (you)
- Can promote/demote admins
- Full access to all features
- Can manage all users

### Access Control

**Without Login:**
- ❌ Cannot access `/` (main app)
- ✅ Can access `/p/:presetId` (shared preset links)

**With Login (Regular User):**
- ❌ Cannot access main app
- ✅ Can access shared preset links
- ❌ Cannot create presets
- ❌ No admin panel access

**With Login (Admin):**
- ✅ Can access main app
- ✅ Can create presets
- ✅ Can lock features
- ✅ Has admin panel
- ❌ Cannot promote other users

**With Login (Super Admin):**
- ✅ Full access to everything
- ✅ Can promote/demote admins
- ✅ Can manage all users
- ✅ Can create/edit all presets

---

## 🔧 Implementation Checklist

### ✅ Completed:
- [x] Database schema (`user_roles` table)
- [x] RLS policies
- [x] Helper functions
- [x] Role service in `supabase.js`

### 📝 Next Steps (To Implement):

1. **Update ImageGenerator.jsx:**
   - Add role checking on page load
   - Redirect non-admins to login if not accessing via preset link
   - Load user role from `roleService`

2. **Create User Management UI (Super Admin Only):**
   - List all users with their roles
   - Promote/Demote buttons
   - Search and filter users

3. **Update Routing:**
   - Allow `/p/:presetId` for everyone (public preset access)
   - Require admin role for `/` (main app)
   - Redirect to login if not authorized

4. **Update Admin Panel:**
   - Show "User Management" section for super admins only
   - Hide certain controls from regular admins

---

## 📊 Database Schema

```sql
user_roles
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key → auth.users)
├── role (TEXT: 'super_admin' | 'admin' | 'user')
├── granted_by (UUID, Foreign Key → auth.users)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## 🔍 Verification Queries

### Check all users and their roles:
```sql
SELECT 
  ur.user_id,
  ur.role,
  ur.granted_by,
  ur.created_at
FROM public.user_roles ur
ORDER BY ur.created_at DESC;
```

### Check if specific user is super admin:
```sql
SELECT public.is_super_admin('user-id-here');
```

### Check if specific user is admin:
```sql
SELECT public.is_admin('user-id-here');
```

### Get user's role:
```sql
SELECT public.get_user_role('user-id-here');
```

---

## 🚀 Usage Examples

### In Your Code:

```javascript
import { roleService } from '../lib/supabase';

// Check if user is super admin
const isSuperAdmin = await roleService.isSuperAdmin(userId);

// Check if user is admin (includes super admin)
const isAdmin = await roleService.isAdmin(userId);

// Get user's role
const { role } = await roleService.getUserRole(userId);

// Promote user to admin (super admin only)
await roleService.promoteToAdmin(targetUserId, superAdminId);

// Demote user to regular user (super admin only)
await roleService.demoteToUser(targetUserId);

// Get all users with roles (super admin only)
const users = await roleService.getAllUsersWithRoles();
```

---

## 🔒 Security Features

1. **RLS Policies:**
   - Users can only see their own role
   - Super admins can see all roles
   - Super admins cannot demote themselves
   - Regular users cannot modify roles

2. **Auto-Assignment:**
   - New signups automatically get `user` role
   - Prevents unauthorized access

3. **Database Functions:**
   - Role checks happen server-side
   - Cannot be bypassed from client

---

## 📱 User Experience Flow

### For Regular Users:
1. Receive shared preset link from admin
2. Click link → redirected to login (if not logged in)
3. After login → access preset
4. Cannot access main app or create content

### For Admins:
1. Promoted by super admin
2. Can access main app
3. Can create and share presets
4. Can lock features for their presets

### For Super Admin:
1. Full access to everything
2. Can manage all users
3. Can promote/demote admins
4. Can override any settings

---

## 🎨 Next UI Components to Build

1. **UserManagementPanel.jsx** (Super Admin Only)
   - List of all users
   - Role badges
   - Promote/Demote buttons
   - Search functionality

2. **LoginRequiredPage.jsx**
   - Shown to non-admins trying to access main app
   - "Login to Continue" message
   - Link to shared presets

3. **RoleGuard.jsx**
   - Wrapper component for route protection
   - Checks user role before rendering

---

## 🔄 Migration Path

If you have existing users:

```sql
-- Set all existing users to 'user' role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Then manually promote specific users to admin
UPDATE public.user_roles
SET role = 'admin', granted_by = 'YOUR_SUPER_ADMIN_ID'
WHERE user_id IN ('admin-user-id-1', 'admin-user-id-2');
```

---

## ✅ Testing Checklist

- [ ] Super admin can see all users
- [ ] Super admin can promote users to admin
- [ ] Super admin can demote admins to users
- [ ] Super admin cannot demote themselves
- [ ] Admins can access main app
- [ ] Regular users cannot access main app
- [ ] Everyone can access shared preset links
- [ ] New signups get 'user' role automatically
- [ ] RLS policies prevent unauthorized access

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs for RLS policy errors
2. Verify user_id matches between auth.users and user_roles
3. Ensure RLS is enabled on user_roles table
4. Check that helper functions are created correctly

---

**Status:** Database setup complete ✅  
**Next:** Implement UI components and access control logic
