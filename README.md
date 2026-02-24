# ResQ Kenya - Emergency Response & Reporting Platform

A complete full-stack web application for reporting emergency incidents with real-time location mapping, admin response tracking, and community engagement features.

## 🚑 Features

### User Features
- **Real-time Emergency Reporting** - Submit incident reports with title, description, photos, and severity level
- **Mandatory Geolocation** - Auto-detect user location (1-5 photos required per report)
- **Anonymous Reporting** - Optional anonymous submission for sensitive cases
- **Nearby Incidents Map** - Interactive map showing incidents within 1km of user's location
- **Social Engagement** - Comment and support/like reports from community members
- **Emergency Contacts** - Quick access to Kenya emergency services

### Admin Features
- **Report Dashboard** - View all submitted reports with filtering
- **Status Updates** - Update report status and add admin notes (submitted → in-review → responding → resolved)
- **User Management** - manage registered users

### Design & UX
- **Kenya Flag Color Theme** - Navy header/footer, vibrant red accents, clean white background
- **Microsoft-style Whitespace** - Generous padding and modern typography
- **Landing Page Animation** - Animated ambulance on landing with smooth transitions
- **Responsive Design** - Mobile-friendly layout for all screens

## 📁 Project Structure

```
PR_L/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database and environment config
│   │   ├── middleware/     # Auth, upload handlers
│   │   ├── routes/         # API endpoints
│   │   ├── utils/          # Database store and auth helpers
│   │   └── server.js       # Express app entrypoint
│   ├── package.json
│   └── uploads/            # User uploaded images
│
└── frontend/                # React + Vite SPA
    ├── src/
    │   ├── api/            # API client
    │   ├── components/     # Reusable UI components
    │   ├── context/        # Auth context
    │   ├── pages/          # Route pages
    │   ├── styles/         # Global CSS
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── dist/               # Built frontend
```

## 🗄️ Database Schema

### MySQL Tables
- **users** - User accounts with roles (user/admin)
- **reports** - Emergency incident reports with location
- **report_images** - Images attached to reports (1-5 per report)
- **comments** - Social comments on reports
- **likes** - User support/likes on reports
- **admin_updates** - Status updates and notes from admins
- **emergency_contacts** - Kenya emergency service contact list

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MySQL 5.7+
- Browser with geolocation support

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure MySQL in .env
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=root
# DB_NAME=resq_ke

# Start development server (creates tables + seeds data)
npm run dev
# Backend runs on http://localhost:5000
```

**Default Admin Credentials:**
- Email: `admin@resq.ke`
- Password: `Admin@123`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Reports
- `GET /api/reports` - Get all reports with optional location filter (nearLat, nearLng, radiusKm)
- `GET /api/reports/mine` - Get user's own reports (auth required)
- `GET /api/reports/:id` - Get report details
- `POST /api/reports` - Submit new report (1-5 images required, geolocation required)
- `POST /api/reports/:id/comments` - Add comment (auth required)

### Social
- `POST /api/social/reports/:id/like` - Like/support report (auth required)

### Admin
- `GET /api/admin/reports` - Get all reports for review (admin only)
- `PATCH /api/admin/reports/:id/status` - Update report status (admin only)
- `GET /api/admin/users` - Get all users (admin only)

### Emergency Contacts
- `GET /api/contacts` - Get Kenya emergency contact list

## 🎨 Colors & Design

### Kenya Flag-Inspired Palette
- **Primary Navy** `#001f3f` - Header/Footer
- **Accent Red** `#ce1126` - Buttons, borders, accents
- **Kenya Green** `#007a5e` - Potential highlights
- **Clean White** `#ffffff` - Main background
- **Light Gray** `#f5f5f5` - Content areas

### Typography
- Font: System default (-apple-system, Segoe UI, Arial)
- Generous line-spacing and padding
- Clear hierarchy with h1-h6 tags

## 📱 Pages & Routes

| Route | Purpose | Auth Required |
|-------|---------|---|
| `/` | Landing page with features overview | No |
| `/login` | User login | No |
| `/register` | User account creation | No |
| `/reports` | View nearby incidents (1km radius map) | No |
| `/social` | Community comments and engagement | No |
| `/contacts` | Emergency service contact list | No |
| `/dashboard` | Submit emergency report | Yes |
| `/admin` | Admin report review & updates | Admin only |

## 🔒 Security

- JWT token-based authentication (7-day expiry)
- Password hashing with bcryptjs (10 rounds)
- Role-based access control (user/admin)
- CORS enabled for frontend origin
- Helmet.js security headers
- File upload validation (5MB limit, image types only)
- Geolocation mandatory for reports

## 📊 Image Upload

- **Maximum files:** 5 per report
- **Minimum files:** 1 required
- **Max file size:** 5MB
- **Accepted types:** JPG, PNG, GIF, WebP
- **Storage location:** `/backend/uploads/`
- **Served via:** `http://localhost:5000/uploads/[filename]`

## 🗺️ Map Features

- **User Location:** Auto-detected with blue marker
- **1km Radius Circle:** Visual boundary showing coverage area
- **Incident Markers:** Red emergency icons with title/status
- **OpenStreetMap:** Free, open-source tiles
- **Zoom Level:** 14 for neighborhood view

## 📞 Kenya Emergency Contacts

Pre-seeded contacts:
- Police Emergency: **999**
- National Ambulance: **1199**
- Kenya Red Cross: **1199**
- Fire and Rescue: **112**
- GBV Hotline: **1195**

Add more contacts via admin update to `emergency_contacts` table.

## 🐛 Troubleshooting

### Location not detecting
- Enable geolocation in browser settings
- Check browser console for permission prompts
- Ensure HTTPS (or localhost for development)

### MySQL connection error
- Verify MySQL is running: `sudo service mysql status`
- Check credentials in `.env` file
- Ensure database name matches: `resq_ke`

### Images not uploading
- Check `/backend/uploads/` folder exists and has write permissions
- Verify file size is under 5MB
- Ensure file is valid image format

### Frontend not loading API
- Check backend is running on port 5000
- Verify CORS is enabled (default enabled)
- Check browser console for network errors

## 📈 Performance

- Frontend: ~390KB JS + 20KB CSS (gzipped)
- Map tiles lazy-loaded
- Images optimized with object-fit
- Database queries indexed on common fields

## 🚀 Deployment

### Frontend
```bash
# Build production bundle
npm run build

# Deploy dist/ folder to:
# - Vercel, Netlify, GitHub Pages
# - AWS S3 + CloudFront
# - Your own web server
```

### Backend
```bash
# Install production dependencies only
npm install --production

# Run with Node
NODE_ENV=production port=5000 npm start

# Or deploy to:
# - Heroku, Railway, Render
# - AWS EC2, DigitalOcean, Linode
# - Docker container
```

## 📝 License

MIT

## 📧 Support

For issues or feature requests, contact the development team.

---

**Made for Kenya. By Kenyans.**
