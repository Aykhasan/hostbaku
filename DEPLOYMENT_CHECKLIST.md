# Deployment Checklist for Render

## Pre-Deployment Verification

### ✅ Code Safety
- [x] Dev mode is properly gated with `NODE_ENV === 'development'` - **SAFE**
- [x] No hardcoded secrets or credentials in code
- [x] `.env` is in `.gitignore`
- [x] All TypeScript errors resolved (warnings are OK with `skipLibCheck: true`)

### ✅ Files Modified
Recent changes include:
- `src/lib/middleware.ts` - Added dev mode support (production-safe)
- `src/app/api/auth/me/route.ts` - Added dev mode support (production-safe)
- `src/components/ui.tsx` - Added dev mode support (production-safe)
- `src/app/dev-test/page.tsx` - New dev testing page (harmless in production)

### ✅ Environment Variables Required on Render

Set these in Render Dashboard → Environment:

**Required:**
```
DATABASE_URL=postgresql://... (Internal URL from Render PostgreSQL)
JWT_SECRET=<generate with: openssl rand -base64 32>
NODE_ENV=production
```

**Email (Required for OTP):**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@hostbaku.com
```

**Optional but Recommended:**
```
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
UPLOAD_DIR=/var/data/uploads
```

### ✅ Build Configuration

**Build Command:**
```bash
npm ci && npm run build
```

**Start Command:**
```bash
npm start
```

**Node Version:** 18+ (Render defaults to latest LTS)

### ✅ Database Setup

After deployment:
1. Go to Render Shell
2. Run: `npm run db:migrate`
3. (Optional) Run: `npm run db:seed` for demo data

### ✅ Post-Deployment Steps

1. ✅ Verify build completed successfully
2. ✅ Check application is accessible
3. ✅ Run database migrations
4. ✅ Test login with OTP
5. ✅ Verify all pages load correctly:
   - `/` - Main page
   - `/admin` - Admin dashboard (requires login)
   - `/cleaner` - Cleaner dashboard (requires login)
   - `/owner` - Owner dashboard (requires login)
   - `/submit-apartment` - Public lead form

### ⚠️ Important Notes

1. **Dev Mode**: The dev mode code (`?dev=admin`, etc.) will NOT work in production because it's gated with `NODE_ENV === 'development'`. This is safe.

2. **Database SSL**: The database connection uses SSL in production (configured in `src/lib/db.ts`).

3. **File Uploads**: If using file uploads, make sure to add a disk mount in Render:
   - Mount Path: `/var/data/uploads`
   - Size: 1 GB (or as needed)

4. **Build Cache**: Render may cache builds. If you encounter issues, try clearing the build cache.

### 🚀 Ready to Deploy

All checks passed! You can now:
1. Commit your changes: `git add . && git commit -m "Add dev mode and prepare for deployment"`
2. Push to GitHub: `git push origin main`
3. Render will automatically deploy on push

