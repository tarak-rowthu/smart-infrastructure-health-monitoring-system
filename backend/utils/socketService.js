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
    startSimulation();
};

// Broadcast a new telemetry reading
const emitNewTelemetry = (reading) => {
    if (ioInstance) {
        ioInstance.emit('new_telemetry', reading);
    }
};

// Simulation Loop: Insert mock sensor data and emit
const startSimulation = () => {
    if (simulationInterval) clearInterval(simulationInterval);
    
    simulationInterval = setInterval(async () => {
        try {
            // Get all active sensors (e.g. sensor_ID between 1 and 4)
            const [sensors] = await db.query('SELECT sensor_ID, sensortype_ID FROM sensor LIMIT 4');
            
            for (let sensor of sensors) {
                // Generate a slight random variation based on sensor type
                let value = 0;
                if (sensor.sensortype_ID === 1) { // Temperature (usually ~22C, let's fluctuate 20-30)
                    value = (Math.random() * 10) + 20;
                } else if (sensor.sensortype_ID === 2) { // Humidity (usually ~45%, fluctuate 40-60)
                    value = (Math.random() * 20) + 40;
                } else { // Generic
                    value = (Math.random() * 50) + 10;
                }
                
                // Keep 1 decimal place
                value = Math.round(value * 10) / 10;
                
                const now = new Date();
                
                // Find max data_ID
                const [[{ maxId }]] = await db.execute('SELECT MAX(data_ID) AS maxId FROM sensor_data');
                const nextId = (maxId || 0) + 1;
                
                // Insert into db to create historical record (for charts)
                const query = 'INSERT INTO sensor_data (data_ID, sensor_ID, reading_Value, reading_time) VALUES (?, ?, ?, ?)';
                await db.execute(query, [nextId, sensor.sensor_ID, value, now]);
                
                // Get the type name and unit for the frontend payload
                const [types] = await db.query('SELECT type_name, unit FROM sensor_type WHERE sensortype_ID = ?', [sensor.sensortype_ID]);
                const typeData = types[0] || { type_name: 'Unknown', unit: '' };
                
                // Construct payload to broadcast
                const payload = {
                    sensor_ID: sensor.sensor_ID,
                    type_name: typeData.type_name,
                    unit: typeData.unit,
                    reading_Value: value,
                    reading_time: now.toISOString()
                };
                
                emitNewTelemetry(payload);
            }
            
            // Note: In a real system, we'd also check if value crosses threshold and insert into `alert` table
            // For now, the frontend can evaluate the threshold for visual feedback.
            
        } catch (error) {
            console.error('[Socket Simulation] Error generating telemetry:', error.message);
        }
    }, 5000); // 5 seconds
};

module.exports = {
    init,
    emitNewTelemetry
};
