# ResQ Kenya Backend API

This backend exposes REST APIs for emergency reporting, authority dispatching, messaging, profile management, and admin operations.

## Base URL

- Local: `http://localhost:5000/api`

## Interactive API Docs (Swagger)

- Swagger UI: `http://localhost:5000/api/docs`
- OpenAPI JSON: `http://localhost:5000/api/openapi.json`

## Authentication

Use JWT bearer tokens for protected routes:

`Authorization: Bearer <token>`

---

## System

- `GET /health` — API health check

## Auth

- `POST /auth/register` — Register account
- `POST /auth/login` — Login
- `GET /auth/me` — Current user profile (protected)
- `PUT /auth/profile` — Update profile details (protected)
- `PUT /auth/change-password` — Change password (protected)

## Reports

- `GET /reports` — List reports (supports nearby filters: `nearLat`, `nearLng`, `radiusKm`)
- `GET /reports/mine` — Current user reports (protected)
- `GET /reports/:id` — Report detail
- `POST /reports` — Create report with image uploads
- `POST /reports/:id/comments` — Add comment (protected)

## Social

- `POST /social/reports/:id/like` — Toggle support/like (protected)

## Contacts

- `GET /contacts` — Emergency contacts list

## Admin (admin role required)

### Reports
- `GET /admin/reports` — All reports
- `PATCH /admin/reports/:id/status` — Update report status + admin message
- `DELETE /admin/reports/:id` — Delete report
- `POST /admin/reports/:id/dispatch` — Dispatch report to one org or all orgs

### Users
- `GET /admin/users` — All users
- `POST /admin/users/:id/promote` — Promote to admin
- `POST /admin/users/:id/demote` — Demote to regular user
- `DELETE /admin/users/:id` — Revoke account

### Organizations / Integrations
- `GET /admin/organizations` — List authority organizations
- `POST /admin/organizations` — Create org account + invite credentials + invite link
- `GET /admin/dispatches` — List all dispatches

### Site Administration
- `POST /admin/reset-all` — Reset all data except current admin (password required)
- `GET /admin/logs` — Site activity logs

## Private Messaging / Case Communication

- `GET /messages/invite/:token` — Resolve invite token to authority login details
- `GET /messages/inbox` — Get dispatch inbox for current user (admin/org member)
- `GET /messages/dispatches/:id/messages` — Get dispatch conversation
- `POST /messages/dispatches/:id/messages` — Send private case message
- `PATCH /messages/dispatches/:id/status` — Update case progress + report status

---

## Notes

- Uploads are served from: `http://localhost:5000/uploads/...`
- Invite links for authority onboarding use `FRONTEND_URL` from backend `.env`
- For production, update secrets and database credentials in `.env`
