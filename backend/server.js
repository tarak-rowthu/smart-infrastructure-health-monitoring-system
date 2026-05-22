require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const mysql = require('mysql2');
const { Server } = require('socket.io');

// Route Imports
const sensorRoutes = require('./routes/sensorRoutes');
const authRoutes = require('./routes/authRoutes');
const buildingRoutes = require('./routes/buildingRoutes');
const alertRoutes = require('./routes/alertRoutes');

// App Initialization
const app = express();
const server = http.createServer(app);

// ============================
// MySQL Database Connection
// ============================

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectTimeout: 60000
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('MySQL Connected Successfully');
    }
});

// ============================
// Socket.io Configuration
// ============================

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Socket Service Initialization
const socketService = require('./utils/socketService');
socketService.init(io);

// ============================
// Middleware
// ============================

app.use(cors({
    origin: '*'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================
// Static Frontend Files
// ============================

app.use(express.static(path.join(__dirname, '../frontend/build')));

// ============================
// API Routes
// ============================

app.use('/api', sensorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/alerts', alertRoutes);

// ============================
// Root Endpoint
// ============================

app.get('/', (req, res) => {
    res.send('Smart Infrastructure Health Monitoring System Backend Running');
});

// ============================
// React Catch-All Route
// ============================

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// ============================
// Global Error Handler
// ============================

app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    });
});

// ============================
// Server Start
// ============================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});