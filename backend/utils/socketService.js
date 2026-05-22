const db = require('../config/db');

let ioInstance = null;
let simulationInterval = null;

// Initialize socket service
const init = (io) => {
    ioInstance = io;

    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    // Start simulation loop for real-time telemetry (every 5 seconds)
    // startSimulation(); // DISABLED TO PREVENT ETIMEDOUT
};

// Broadcast a new telemetry reading
const emitNewTelemetry = (reading) => {
    if (ioInstance) {
        ioInstance.emit('new_telemetry', reading);
    }
};

// Simulation Loop: Insert mock sensor data and emit
const startSimulation = () => {
    // if (simulationInterval) clearInterval(simulationInterval);
    
    // simulationInterval = setInterval(async () => {
    //     try {
    //         // Simulation logic disabled to prevent ETIMEDOUT
    //     } catch (error) {
    //         console.error('[Socket Simulation] Error generating telemetry:', error.message);
    //     }
    // }, 5000); // 5 seconds
};

module.exports = {
    init,
    emitNewTelemetry
};
