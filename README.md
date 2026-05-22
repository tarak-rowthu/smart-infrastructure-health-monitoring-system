# IoT Infrastructure Health Monitoring System

This is a full-stack application for monitoring the health of IoT infrastructure across campus buildings and rooms.

## Project Structure
- `frontend/`: Static HTML/CSS/JS files for the dashboard.
- `backend/`: Node.js/Express server.
- `database/`: Database schema and migration scripts.

## Prerequisites
1. **Node.js** installed on your machine.
2. **MySQL** installed and running locally.
3. The database `Infrastructure_IoT_DB` along with required tables must exist.

## Setup & Deployment
1. **Environment Variables**:
   - Copy `backend/.env.example` to `backend/.env`.
   - Update `DB_USER` and `DB_PASSWORD` in `backend/.env` to match your local MySQL credentials.
2. **Install Dependencies**:
   - Navigate to the `backend/` directory: `cd backend`
   - Run `npm install`.
3. **Start the Server**:
   - Run `npm start`.
   - The backend will run on port 3000 by default.
4. **Access the Frontend**:
   - Open `frontend/index.html` in your web browser.
   - Alternatively, use a tool like "Live Server" to serve the frontend files.

## Features
- **Dashboard**: Real-time sensor stats and alerts.
- **Buildings & Rooms**: Manage campus infrastructure.
- **Sensors**: Monitor real-time telemetry.
- **Alerts**: Automated alerting for critical infrastructure metrics.
