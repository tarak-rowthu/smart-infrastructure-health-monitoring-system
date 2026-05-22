require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// ============================
// Route Imports
// ============================

const sensorRoutes = require('./routes/sensorRoutes');
const authRoutes = require('./routes/authRoutes');
const buildingRoutes = require('./routes/buildingRoutes');
const alertRoutes = require('./routes/alertRoutes');

// ============================
// App Initialization
// ============================

const app = express();
const server = http.createServer(app);

// ============================
// Middleware
// ============================

app.use(cors({
    origin: '*'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Removed redundant MySQL Database Connection as it's handled by config/db.js

// ============================
// Socket.io Configuration
// ============================

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// ============================
// Socket Service Initialization
// ============================

const socketService = require('./utils/socketService');
socketService.init(io);

// ============================
// API Routes
// ============================

app.use('/api', sensorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/alerts', alertRoutes);

// ============================
// Root Route
// ============================

app.get('/', (req, res) => {
    res.send('Backend Running Successfully');
});

// ============================
// Health Check Route
// ============================

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy'
    });
});

// ============================
// 404 Handler
// ============================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route Not Found'
    });
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