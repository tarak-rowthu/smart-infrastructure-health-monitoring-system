const db = require('../config/db');

const SensorModel = {
    // Get all sensors with room and type details using JOIN
    getAllSensors: async () => {
        const query = `
            SELECT 
                s.sensor_ID AS Sensor_ID, 
                st.type_name AS Type_Name, 
                r.Room_Number AS Room_Number, 
                'N/A' AS Technician, 
                st.unit AS Unit, 
                b.NAME AS Building
            FROM sensor s
            JOIN room r ON s.Room_ID = r.Room_ID
            JOIN sensor_type st ON s.sensortype_ID = st.sensortype_ID
            JOIN floor f ON r.Floor_ID = f.Floor_ID
            JOIN building b ON f.Building_ID = b.Building_ID
        `;
        const [rows] = await db.execute(query);
        return rows;
    },

    // Get all sensor data with sensor details
    getAllSensorData: async () => {
        const query = `
            SELECT 
                sd.sensor_ID AS Sensor_ID, 
                sd.reading_time AS Reading_Time, 
                sd.reading_Value AS Reading_Value,
                st.type_name AS Type_Name, 
                st.unit AS Unit, 
                r.Room_Number AS Room_Number, 
                b.NAME AS Building
            FROM sensor_data sd
            JOIN sensor s ON sd.sensor_ID = s.sensor_ID
            JOIN sensor_type st ON s.sensortype_ID = st.sensortype_ID
            JOIN room r ON s.Room_ID = r.Room_ID
            JOIN floor f ON r.Floor_ID = f.Floor_ID
            JOIN building b ON f.Building_ID = b.Building_ID
            ORDER BY sd.reading_time DESC
        `;
        const [rows] = await db.execute(query);
        return rows;
    },

    // Get abnormal sensor readings (> 50)
    getAbnormalReadings: async () => {
        const query = `
            SELECT 
                sd.sensor_ID AS Sensor_ID, 
                sd.reading_time AS Reading_Time, 
                sd.reading_Value AS Reading_Value,
                st.type_name AS Type_Name, 
                st.unit AS Unit, 
                r.Room_Number AS Room_Number, 
                b.NAME AS Building
            FROM sensor_data sd
            JOIN sensor s ON sd.sensor_ID = s.sensor_ID
            JOIN sensor_type st ON s.sensortype_ID = st.sensortype_ID
            JOIN room r ON s.Room_ID = r.Room_ID
            JOIN floor f ON r.Floor_ID = f.Floor_ID
            JOIN building b ON f.Building_ID = b.Building_ID
            WHERE sd.reading_Value > 50
            ORDER BY sd.reading_time DESC
        `;
        const [rows] = await db.execute(query);
        return rows;
    },

    // Add new sensor data
    addSensorData: async (sensorId, readingTime, readingValue) => {
        // Find max data_ID
        const [[{ maxId }]] = await db.execute('SELECT MAX(data_ID) AS maxId FROM sensor_data');
        const nextId = (maxId || 0) + 1;

        const query = 'INSERT INTO sensor_data (data_ID, sensor_ID, reading_time, reading_Value) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(query, [nextId, sensorId, readingTime, readingValue]);
        result.insertId = nextId; // Pass it back
        return result;
    },

    // Update sensor data based on Sensor_ID and Reading_Time
    updateSensorData: async (sensorId, readingTime, readingValue) => {
        const query = 'UPDATE sensor_data SET reading_Value = ? WHERE sensor_ID = ? AND reading_time = ?';
        const [result] = await db.execute(query, [readingValue, sensorId, readingTime]);
        return result;
    },

    deleteSensorData: async (sensorId, readingTime) => {
        let query;
        let params;
        if (readingTime) {
            query = 'DELETE FROM sensor_data WHERE sensor_ID = ? AND reading_time = ?';
            params = [sensorId, readingTime];
        } else {
            query = 'DELETE FROM sensor_data WHERE sensor_ID = ?';
            params = [sensorId];
        }
        const [result] = await db.execute(query, params);
        return result;
    },

    // Get sensor type for threshold checking
    getSensorType: async (sensorId) => {
        const query = `
            SELECT st.type_name 
            FROM sensor s
            JOIN sensor_type st ON s.sensortype_ID = st.sensortype_ID
            WHERE s.sensor_ID = ?
        `;
        const [rows] = await db.execute(query, [sensorId]);
        return rows.length ? rows[0].type_name : null;
    },

    // Get historical data for charts
    getHistoricalData: async (limit) => {
        const query = `
            SELECT sd.sensor_ID, sd.reading_Value, sd.reading_time, st.type_name
            FROM sensor_data sd
            JOIN sensor s ON sd.sensor_ID = s.sensor_ID
            JOIN sensor_type st ON s.sensortype_ID = st.sensortype_ID
            WHERE st.type_name IN ('Temperature', 'Humidity')
            ORDER BY sd.reading_time DESC
            LIMIT ${parseInt(limit)}
        `;
        // Since we order by DESC to get the latest, we reverse the results so the chart plots left-to-right
        const [rows] = await db.execute(query);
        return rows.reverse();
    },

    // NEW: Methods for adding sensors
    getSensorTypes: async () => {
        const [rows] = await db.execute('SELECT sensortype_ID, type_name FROM sensor_type');
        return rows;
    },

    getRooms: async () => {
        const [rows] = await db.execute('SELECT Room_ID, Room_Number FROM room');
        return rows;
    },

    checkSensorExists: async (sensorId) => {
        const [rows] = await db.execute('SELECT sensor_ID FROM sensor WHERE sensor_ID = ?', [sensorId]);
        return rows.length > 0;
    },

    createSensor: async (sensorId, typeId, roomId, installDate) => {
        const query = 'INSERT INTO sensor (sensor_ID, sensortype_ID, Room_ID, Install_Date) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(query, [sensorId, typeId, roomId, installDate]);
        return result;
    }
};

module.exports = SensorModel;
