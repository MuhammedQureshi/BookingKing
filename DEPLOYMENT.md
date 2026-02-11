# Appointly - Embeddable Booking Widget Deployment Guide

## Overview
This guide explains how to deploy the booking widget system for production use.

---

## Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your Client   │     │    Frontend     │     │    Backend      │
│   Websites      │────▶│  (React/Vercel) │────▶│  (FastAPI)      │
│                 │     │                 │     │                 │
│ <script src=    │     │ - Landing Page  │     │ - API Endpoints │
│  "embed.js"/>   │     │ - Admin Panel   │     │ - MongoDB       │
└─────────────────┘     │ - Embed Script  │     │ - Email (Resend)│
                        └─────────────────┘     └─────────────────┘
```

---

## Option 1: Deploy on Vercel + Railway (Recommended)

### Step 1: Prepare the Code

```bash
# Clone or download your code
git clone <your-repo>
cd your-project
```

### Step 2: Deploy Backend on Railway

1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Add MongoDB plugin (or use MongoDB Atlas)
4. Set environment variables:

```env
MONGO_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/appointly
DB_NAME=appointly
JWT_SECRET=your-super-secret-key-change-this
RESEND_API_KEY=re_xxxxxxxxxxxxx
SENDER_EMAIL=bookings@yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

5. Railway will auto-detect FastAPI and deploy

### Step 3: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set root directory to `frontend`
4. Set environment variables:

```env
REACT_APP_BACKEND_URL=https://your-backend.railway.app
```

5. Deploy

### Step 4: Update Embed Script URL

After deployment, update the API_BASE in `/frontend/public/booking-embed.js`:

```javascript
var API_BASE = 'https://your-backend.railway.app/api';
```

---

## Option 2: Deploy on Single VPS (DigitalOcean/AWS/etc)

### Step 1: Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Install dependencies
apt update && apt upgrade -y
apt install -y python3 python3-pip nodejs npm nginx certbot python3-certbot-nginx

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update && apt install -y mongodb-org
systemctl start mongod && systemctl enable mongod
```

### Step 2: Clone and Setup

```bash
# Clone your code
cd /var/www
git clone <your-repo> appointly
cd appointly

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=appointly
JWT_SECRET=$(openssl rand -hex 32)
RESEND_API_KEY=re_xxxxxxxxxxxxx
SENDER_EMAIL=bookings@yourdomain.com
CORS_ORIGINS=https://yourdomain.com
EOF

# Frontend setup
cd ../frontend
npm install
npm run build
```

### Step 3: Setup Systemd Service for Backend

```bash
cat > /etc/systemd/system/appointly.service << EOF
[Unit]
Description=Appointly Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/appointly/backend
Environment="PATH=/var/www/appointly/backend/venv/bin"
ExecStart=/var/www/appointly/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start appointly
systemctl enable appointly
```

### Step 4: Configure Nginx

```bash
cat > /etc/nginx/sites-available/appointly << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React build)
    location / {
        root /var/www/appointly/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
    }

    # Embed script (ensure proper caching)
    location /booking-embed.js {
        root /var/www/appointly/frontend/build;
        add_header Cache-Control "public, max-age=3600";
        add_header Access-Control-Allow-Origin "*";
    }
}
EOF

ln -s /etc/nginx/sites-available/appointly /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

### Step 5: SSL Certificate

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Option 3: Docker Deployment

### docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    restart: always

  backend:
    build: ./backend
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=appointly
      - JWT_SECRET=${JWT_SECRET}
      - RESEND_API_KEY=${RESEND_API_KEY}
      - SENDER_EMAIL=${SENDER_EMAIL}
      - CORS_ORIGINS=${CORS_ORIGINS}
    depends_on:
      - mongodb
    restart: always

  frontend:
    build: ./frontend
    environment:
      - REACT_APP_BACKEND_URL=${BACKEND_URL}
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always

volumes:
  mongo_data:
```

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## Post-Deployment Checklist

### 1. Update Embed Script
Edit `frontend/public/booking-embed.js` and change:
```javascript
var API_BASE = 'https://YOUR-ACTUAL-DOMAIN.com/api';
```

### 2. Setup Email (Resend)
1. Go to [resend.com](https://resend.com)
2. Create account and get API key
3. Verify your domain for custom sender email
4. Add key to backend `.env`

### 3. Test Everything
```bash
# Test API
curl https://yourdomain.com/api/

# Test registration
curl -X POST https://yourdomain.com/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{"business_name":"Test","email":"test@test.com","password":"test123"}'
```

### 4. Create First Business
1. Visit `https://yourdomain.com/admin/login`
2. Click "Create Account"
3. Add services and set availability
4. Get embed code from "Embed" tab

---

## How Clients Use It

### For Your Clients:

1. **Give them the admin URL**: `https://yourdomain.com/admin/login`
2. **They create an account** with their business name and email
3. **They configure**:
   - Add services (name, duration, price)
   - Set weekly availability
   - Block holiday dates
4. **They get embed code** from the Embed tab
5. **They paste it on their website**

### Embed Code Example:
```html
<div id="booking-widget"></div>
<script 
  src="https://yourdomain.com/booking-embed.js" 
  data-business-id="their-business-id"
  data-primary-color="#your-brand-color">
</script>
```

---

## Pricing Model Ideas

Since you're hosting this for multiple clients:

1. **Free Tier**: 50 bookings/month
2. **Pro**: $19/month - Unlimited bookings, custom branding
3. **Business**: $49/month - Multiple locations, priority support

You'd need to add booking limits to the backend code for this.

---

## Monitoring & Maintenance

### Health Check Endpoint
The API has a root endpoint that returns status:
```bash
curl https://yourdomain.com/api/
# Returns: {"message":"Embeddable Booking System API"}
```

### Logs
```bash
# Backend logs (systemd)
journalctl -u appointly -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Backups
```bash
# MongoDB backup
mongodump --db appointly --out /backups/$(date +%Y%m%d)

# Restore
mongorestore --db appointly /backups/20260211/appointly
```

---

## Security Recommendations

1. **Change JWT_SECRET** to a strong random string
2. **Use HTTPS** everywhere (Vercel/Railway do this automatically)
3. **Set CORS_ORIGINS** to only your domains in production
4. **Enable MongoDB authentication** in production
5. **Rate limiting** - Consider adding to prevent abuse

---

## Support

If you run into issues:
1. Check backend logs for errors
2. Verify environment variables are set correctly
3. Test API endpoints directly with curl
4. Check browser console for frontend errors

Good luck with your deployment! 🚀
