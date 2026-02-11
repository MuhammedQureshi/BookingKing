# Embeddable Booking System Widget - PRD

## Original Problem Statement
Build a production-ready embeddable booking system widget that can be plugged into any website (React, Next.js). The widget should be lightweight, customizable, and work independently from the main site styling.

## Architecture

### Backend (FastAPI + MongoDB)
- **Server**: `/app/backend/server.py`
- **Database**: MongoDB with collections for `businesses` and `bookings`
- **Email**: Resend integration (configurable via RESEND_API_KEY)
- **Auth**: JWT-based authentication for admin panel

### Frontend (React + Tailwind)
- **Widget Component**: `/app/frontend/src/components/BookingWidget.jsx`
- **Standalone Embed**: `/app/frontend/public/booking-embed.js`
- **Admin Panel**: Full dashboard at `/admin/*`

## Database Schema

### Business Collection
```json
{
  "id": "uuid",
  "business_name": "string",
  "description": "string",
  "email": "string",
  "password_hash": "string",
  "services": [{"id", "name", "duration", "description", "price"}],
  "availability": [{"day", "start_time", "end_time", "enabled"}],
  "blocked_dates": ["YYYY-MM-DD"],
  "created_at": "ISO datetime"
}
```

### Booking Collection
```json
{
  "id": "uuid",
  "business_id": "string",
  "service_id": "string",
  "service_name": "string",
  "date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM",
  "customer_name": "string",
  "customer_email": "string",
  "customer_phone": "string",
  "status": "confirmed|cancelled",
  "created_at": "ISO datetime"
}
```

## User Personas

1. **Business Owner**: Registers, manages services, availability, views bookings
2. **Customer**: Books appointments through embedded widget
3. **Developer**: Embeds widget into client websites

## Core Requirements (Static)
- [x] Embeddable via script tag OR React component
- [x] Multi-client support with business_id
- [x] Service selection with duration
- [x] Calendar date picker
- [x] Time slot selection
- [x] Customer details form
- [x] Booking confirmation
- [x] Double booking prevention
- [x] Admin panel (password protected)
- [x] Service management (CRUD)
- [x] Weekly availability editor
- [x] Date blocking functionality
- [x] Email notifications (Resend - requires API key)

## What's Been Implemented (January 2026)

### Backend API Endpoints
- `POST /api/admin/register` - Register new business
- `POST /api/admin/login` - Admin login
- `GET /api/businesses/{id}` - Get business info
- `GET /api/businesses/{id}/slots` - Get available time slots
- `POST /api/bookings` - Create booking
- `GET /api/admin/bookings` - View bookings (protected)
- `POST /api/admin/services` - Add service
- `DELETE /api/admin/services/{id}` - Delete service
- `PUT /api/admin/availability` - Update availability
- `POST /api/admin/blocked-dates` - Block date
- `DELETE /api/admin/blocked-dates/{date}` - Unblock date

### Frontend Pages
- Demo page with live widget preview
- Admin login/register
- Admin dashboard with bookings list
- Services management page
- Availability editor page
- Blocked dates management page

### Widget Features
- 4-step booking flow
- Progress indicator
- Mobile-responsive design
- Customizable primary color
- Standalone embed script

## Prioritized Backlog

### P0 (Critical) - DONE
- ✅ Core booking flow
- ✅ Admin authentication
- ✅ Service management
- ✅ Availability management

### P1 (High Priority)
- [ ] Email notifications (requires Resend API key)
- [ ] Booking edit/reschedule by admin
- [ ] Time zone support
- [ ] Widget theming options (dark mode)

### P2 (Medium Priority)
- [ ] SMS notifications (Twilio)
- [ ] Google Calendar sync
- [ ] Booking reminders
- [ ] Multiple staff support

### P3 (Low Priority)
- [ ] Payment integration
- [ ] Analytics dashboard
- [ ] Customer portal
- [ ] Multi-language support

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
JWT_SECRET=your-secret-key
RESEND_API_KEY=re_xxx (optional)
SENDER_EMAIL=onboarding@resend.dev
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://your-domain.com
```

## Embedding Instructions

### React Component
```jsx
import { BookingWidget } from './components/BookingWidget';

<BookingWidget 
  businessId="your-business-id"
  primaryColor="#18181b"
/>
```

### Script Tag
```html
<div id="booking-widget"></div>
<script 
  src="https://your-domain.com/booking-embed.js" 
  data-business-id="your-business-id"
  data-primary-color="#18181b">
</script>
```
