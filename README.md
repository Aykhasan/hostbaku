# HostBaku - Airbnb Property Management System

A complete property management solution for Airbnb hosts in Baku, Azerbaijan. Built with Next.js 14, PostgreSQL, and TypeScript.

## Features

### For Admins
- **Dashboard**: Overview of properties, reservations, tasks, and revenue
- **Property Management**: Add properties and units with owner assignments
- **Reservation Tracking**: Calendar view of all bookings
- **Task Management**: Create and assign cleaning/maintenance tasks
- **Cleaner Management**: Track cleaner performance and assignments
- **Expense Tracking**: Record and categorize expenses
- **Owner Statements**: Generate monthly revenue reports with PDF export
- **Lead Management**: Track new property inquiries
- **Maintenance Tickets**: Handle repair requests with priority levels

### For Cleaners
- **Mobile-Friendly Dashboard**: View assigned tasks for today/upcoming
- **Task Details**: Interactive checklists with type-specific items
- **Photo Uploads**: Capture 8-12 photos per task for QC
- **Schedule View**: Weekly calendar of all assignments

### For Property Owners
- **Dashboard**: YTD revenue, occupancy stats, property overview
- **Reservation Calendar**: View all bookings across properties
- **Monthly Statements**: Download PDF reports of earnings
- **Maintenance Requests**: Submit and track repair tickets

### Public
- **Submit Apartment**: Lead capture form for new property inquiries

---

## Quick Start (Development)

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 1. Clone and Install
```bash
cd hostbaku
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/hostbaku
JWT_SECRET=generate-a-random-32-character-string
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Setup Database
```bash
# Create database
createdb hostbaku

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

### Demo Accounts
| Role    | Email                   | OTP (dev mode) |
|---------|-------------------------|----------------|
| Admin   | admin@hostbaku.com      | Any 6 digits   |
| Cleaner | cleaner@hostbaku.com    | Any 6 digits   |
| Owner   | owner@hostbaku.com      | Any 6 digits   |

> In development mode, any 6-digit code works for OTP login.

---

## Deployment to Render

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Configure:
   - Name: `hostbaku-db`
   - Database: `hostbaku`
   - User: `hostbaku`
   - Region: Choose closest to Baku (Frankfurt recommended)
   - Plan: Free or paid based on needs
4. Click **Create Database**
5. Copy the **Internal Database URL** (starts with `postgresql://`)

### Step 2: Deploy Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub/GitLab repository
3. Configure:
   - Name: `hostbaku`
   - Region: Same as database
   - Branch: `main`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: Free or paid

4. Add Environment Variables:
   ```
   DATABASE_URL = [paste Internal Database URL from Step 1]
   JWT_SECRET = [generate with: openssl rand -base64 32]
   SMTP_HOST = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_USER = your-email@gmail.com
   SMTP_PASS = your-app-password
   EMAIL_FROM = noreply@hostbaku.com
   NEXT_PUBLIC_APP_URL = https://hostbaku.onrender.com
   NODE_ENV = production
   UPLOAD_DIR = /var/data/uploads
   ```

5. Add Disk (for file uploads):
   - Mount Path: `/var/data/uploads`
   - Size: 1 GB (adjust as needed)

6. Click **Create Web Service**

### Step 3: Run Database Migrations

After deployment, use Render Shell or connect via `psql`:

```bash
# In Render Shell
npm run db:migrate
npm run db:seed  # Optional: for demo data
```

Or run migrations via the Render dashboard:
1. Go to your Web Service
2. Click **Shell**
3. Run: `npm run db:migrate`

### Step 4: Configure Custom Domain (Optional)

1. Go to your Web Service → **Settings** → **Custom Domains**
2. Add your domain (e.g., `app.hostbaku.com`)
3. Update DNS with CNAME record pointing to `hostbaku.onrender.com`
4. Update `NEXT_PUBLIC_APP_URL` environment variable

---

## Alternative: Deploy to VPS (DigitalOcean/Hetzner)

### Using Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/hostbaku
      - JWT_SECRET=your-secret
    depends_on:
      - db
    volumes:
      - uploads:/app/uploads

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: hostbaku
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
  uploads:
```

```bash
docker-compose up -d
docker-compose exec app npm run db:migrate
```

### Using PM2 (Without Docker)

```bash
# Install dependencies
npm install
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "hostbaku" -- start

# Save PM2 process list
pm2 save

# Setup PM2 startup script
pm2 startup
```

---

## Email Configuration

### Gmail Setup (Recommended for testing)

1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an App Password for "Mail"
4. Use that password in `SMTP_PASS`

### Production Email (Recommended)

For production, use a transactional email service:
- **SendGrid**: Free tier available
- **Mailgun**: Pay-as-you-go
- **Amazon SES**: Very cheap for high volume

Update SMTP settings accordingly.

---

## File Storage

### Local Storage (Default)
Files are stored in `./uploads` directory. Make sure it's writable.

### Cloud Storage (Recommended for Production)

For Cloudflare R2 or AWS S3, update `/src/lib/uploads.ts`:

```typescript
// Example S3 configuration
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});
```

---

## Project Structure

```
hostbaku/
├── scripts/
│   ├── migrate.js      # Database schema
│   └── seed.js         # Demo data
├── src/
│   ├── app/
│   │   ├── admin/      # Admin pages
│   │   ├── cleaner/    # Cleaner pages
│   │   ├── owner/      # Owner pages
│   │   ├── api/        # API routes
│   │   └── submit-apartment/  # Public lead form
│   ├── components/
│   │   └── ui.tsx      # Shared UI components
│   └── lib/
│       ├── db.ts       # Database connection
│       ├── auth.ts     # Authentication
│       ├── email.ts    # Email sending
│       ├── pdf.ts      # PDF generation
│       └── types.ts    # TypeScript types
├── .env.example
├── package.json
└── README.md
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP and login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET/POST | `/api/admin/properties` | List/create properties |
| GET/POST | `/api/admin/tasks` | List/create tasks |
| GET/POST | `/api/admin/statements` | List/create statements |
| GET/POST | `/api/admin/leads` | List/create leads |
| GET/POST | `/api/admin/maintenance` | List/create tickets |

### Cleaner
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cleaner/tasks` | List assigned tasks |
| GET/PATCH | `/api/cleaner/tasks/[id]` | Get/update task |
| POST | `/api/cleaner/tasks/[id]/photos` | Upload photos |

### Owner
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/owner/stats` | Dashboard statistics |
| GET | `/api/owner/properties` | List properties |
| GET | `/api/owner/reservations` | List reservations |
| GET | `/api/owner/statements` | List statements |
| GET | `/api/owner/statements/[id]/pdf` | Download PDF |
| GET/POST | `/api/owner/maintenance` | List/create tickets |

---

## Security Features

- ✅ OTP-based passwordless authentication
- ✅ HTTP-only cookies for JWT tokens
- ✅ Role-based access control
- ✅ SQL injection prevention (parameterized queries)
- ✅ File upload validation (type and size limits)
- ✅ Audit logging for all changes
- ✅ OTP expiry (10 minutes)
- ✅ One-time use OTP codes

---

## Maintenance

### Database Backup
```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20241226.sql
```

### Logs
```bash
# PM2 logs
pm2 logs hostbaku

# Docker logs
docker-compose logs -f app
```

---

## Support

For issues or questions:
1. Check existing issues in the repository
2. Create a new issue with detailed description
3. Contact: support@hostbaku.com

---

## License

MIT License - feel free to use for your own projects.
#   h o s t b a k u  
 