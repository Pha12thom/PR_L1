# 🚑 ResQ Kenya - Quick Start Guide

## What's New ✨

Your emergency response platform now includes:

✅ **MySQL Database** - Reliable data persistence with optimized schema
✅ **Vibrant Kenya Flag Colors** - Navy/Red/Green theme with modern whitespace
✅ **Landing Page Animation** - Ambulance 🚑 sliding animation on entry
✅ **Mandatory Geolocation** - Auto-detect user location (no manual entry)
✅ **1km Radius Maps** - Focus on incidents near users with 1km circle boundary
✅ **Separate Social Page** - Dedicated community engagement independent from maps
✅ **File Validation** - Require 1-5 images per report (visual feedback)
✅ **Enhanced Admin Dashboard** - Better status tracking and update history

---

## Installation (5 minutes)

### 1. Install MySQL
**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mysql-server
sudo service mysql start
```

**Windows:**
- Download from [mysql.com](https://dev.mysql.com/downloads/mysql/)
- Run installer and Start MySQL Service

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Backend .env already includes default MySQL credentials
# If you changed MySQL password, update in .env

# Start database and API
npm run dev
```

Expected output:
```
Backend running on http://localhost:5000
Seed admin email: admin@resq.ke
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies  
npm install

# Start development server
npm run dev
```

Visit: **http://localhost:5173**

---

## First Steps 🎯

### 1. Login as Admin
- **Email:** admin@resq.ke
- **Password:** Admin@123

### 2. Create a User Account
- Go to "Sign Up"
- Fill in details and register

### 3. Test Location Permission
- Navigate to "Report"
- Click "Re-check Location" to enable geolocation
- You'll see latitude/longitude auto-filled

### 4. Submit a Report
- Write title and description
- Select category and severity
- Attach 1-5 images (required)
- Option to submit anonymously
- Click "Submit Report"

### 5. View on Map
- Go to "Nearby Incidents"
- See your report on interactive map (1km radius)
- Red 🔴 markers show incidents

### 6. Engage Socially
- Go to "Community"
- Comment on reports
- Support (like) incidents from your area
- See community engagement in real-time

### 7. Admin Response
- Login as admin
- Visit Admin Dashboard (⚙️ icon)
- Update report status: Submitted → In Review → Responding → Resolved
- Add notes visible to reporter

---

## Database

### Auto-Created on First Run
MySQL database `resq_ke` with tables:
- users
- reports
- report_images
- comments
- likes
- admin_updates
- emergency_contacts

### Backup/Restore
```bash
# Backup
mysqldump -u root -p resq_ke > backup.sql

# Restore
mysql -u root -p resq_ke < backup.sql
```

---

## File Organization

```
📁 /backend
  └─ src/
    ├─ config/database.js    ← MySQL pool + initialization
    ├─ middleware/auth.js    ← JWT + geolocation
    ├─ routes/reports.routes.js  ← 1-5 file validation
    ├─ utils/dbStore.js      ← All database queries
    └─ server.js
  📁 uploads/  ← User images stored here

📁 /frontend
  └─ src/
    ├─ pages/
    │   ├─ LandingPage.jsx   ← Ambulance animation
    │   ├─ DashboardPage.jsx ← Mandatory location
    │   ├─ ReportsPage.jsx   ← 1km map view
    │   ├─ SocialPage.jsx    ← Community engagement
    │   ├─ AdminPage.jsx     ← Status updates
    │   └─ ContactsPage.jsx  ← Emergency numbers
    ├─ styles/app.css        ← Kenya flag colors
    └─ App.jsx
```

---

## Color Scheme 🎨

Open **frontend/src/styles/app.css** to see:
- `--navy: #001f3f` - Header/Footer
- `--kenya-red: #ce1126` - Buttons, accents
- `--white: #ffffff` - Background
- `--light-gray: #f5f5f5` - Cards

No changes needed - it's production-ready!

---

## API Examples

### Submit a Report (Frontend does this automatically)
```bash
curl -X POST http://localhost:5000/api/reports \
  -F "title=Fire in building" \
  -F "description=Warehouse fire" \
  -F "images=@photo.jpg" \
  -F "latitude=-1.2863" \
  -F "longitude=36.8172" \
  -H "Authorization: Bearer [token]"
```

### Get Nearby Reports (1km)
```bash
curl "http://localhost:5000/api/reports?nearLat=-1.2863&nearLng=36.8172&radiusKm=1"
```

### Admin Update Report Status
```bash
curl -X PATCH http://localhost:5000/api/admin/reports/[reportId]/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [adminToken]" \
  -d '{"status":"responding","message":"Ambulance en route"}'
```

---

## Troubleshooting

### "Location permission denied"
- Check browser geolocation popup (top-left)
- Allow location access
- If blocked, clear site data and reload

### "Database connection refused"
```bash
# Reset MySQL
sudo service mysql stop
sudo service mysql start

# Check MySQL is running
sudo service mysql status
```

### "Port 5000 already in use"
```bash
# Find process using port 5000
lsof -i :5000

# Kill it
kill -9 [PID]

# Or change port in backend/.env
Port=5001
```

### "Images not uploading"
- Max 5 files per report
- Files must be images (jpg, png, gif, webp)
- Each file max 5MB
- Check `/backend/uploads/` folder exists

---

## Performance Tips

1. **Close unused browser tabs** - Maps use memory
2. **Clear cache** - Frontend has assets
3. **Check MySQL** - Monitor running reports/queries
4. **Compress images** - Reduce upload size before submitting

---

## Next Steps

- [ ] Deploy backend to AWS/Railway/Heroku
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Add more emergency contacts to Kenya database
- [ ] Customize admin approval workflow
- [ ] Enable email notifications
- [ ] Add SMS integration for alerts

---

## Support

Check `/home/milugo/PR_L/README.md` for full documentation.

**Happy reporting! 🚑**
