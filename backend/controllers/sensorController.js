const SensorModel = require('../models/sensorModel');

// GET /sensors
exports.getSensors = async (req, res) => {
    try {
        const sensors = await SensorModel.getAllSensors();
        res.status(200).json({ success: true, data: sensors });
    } catch (error) {
        console.error('Error fetching sensors:', error);
        res.status(500).json({ success: false, message: 'Server error fetching sensors' });
    }
};

// GET /sensor-data
exports.getSensorData = async (req, res) => {
    try {
        const data = await SensorModel.getAllSensorData();
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        console.error('Error fetching sensor data:', error);
        res.status(500).json({ success: false, message: 'Server error fetching sensor data' });
    }
};

// GET /sensor-data/abnormal (Bonus)
exports.getAbnormalReadings = async (req, res) => {
    try {
        const data = await SensorModel.getAbnormalReadings();
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        console.error('Error fetching abnormal readings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /sensor-data
exports.addSensorData = async (req, res) => {
    try {
        const { Sensor_ID, Reading_Time, Reading_Value } = req.body;
        if (!Sensor_ID || !Reading_Time || Reading_Value === undefined) {
            return res.status(400).json({ success: false, message: 'Please provide Sensor_ID, Reading_Time, and Reading_Value' });
        }
        
        // 1. Insert sensor data
        const result = await SensorModel.addSensorData(Sensor_ID, Reading_Time, Reading_Value);
        const dataId = result.insertId;
        
        // 2. Fetch sensor type to check thresholds
        const typeName = await SensorModel.getSensorType(Sensor_ID);
        
        // 3. Evaluate thresholds and create alert if abnormal
        let isAbnormal = false;
        let alertMessage = '';
        const val = parseFloat(Reading_Value);

        if (typeName === 'Temperature' && val > 45) {
            isAbnormal = true;
            alertMessage = `High Temperature Detected (${val}°C)`;
        } else if (typeName === 'Humidity' && val > 70) {
            isAbnormal = true;
            alertMessage = `High Humidity Detected (${val}%)`;
        } else if (typeName !== 'Temperature' && typeName !== 'Humidity' && val > 80) {
            isAbnormal = true;
            alertMessage = `Critical Value Detected (${val})`;
        }

        if (isAbnormal) {
            const AlertModel = require('../models/alertModel');
            await AlertModel.createAlert(dataId, alertMessage);
        }

        res.status(201).json({ 
            success: true, 
            message: 'Sensor data added successfully',
            alertGenerated: isAbnormal 
        });
    } catch (error) {
        console.error('Error adding sensor data:', error);
        res.status(500).json({ success: false, message: 'Server error adding sensor data' });
    }
};

// PUT /sensor-data/:id
// Using :id as Sensor_ID. Reading_Time must be in body to identify the exact record.
exports.updateSensorData = async (req, res) => {
    try {
        const sensorId = req.params.id;
        const { Reading_Time, Reading_Value } = req.body;
        
        if (!Reading_Time || Reading_Value === undefined) {
            return res.status(400).json({ success: false, message: 'Please provide Reading_Time and Reading_Value in body' });
        }

        const result = await SensorModel.updateSensorData(sensorId, Reading_Time, Reading_Value);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Sensor data not found' });
        }
        res.status(200).json({ success: true, message: 'Sensor data updated successfully' });
    } catch (error) {
        console.error('Error updating sensor data:', error);
        res.status(500).json({ success: false, message: 'Server error updating sensor data' });
    }
};

// DELETE /sensor-data/:id
// Using :id as Sensor_ID. Optionally provide Reading_Time in body to delete specific record.
exports.deleteSensorData = async (req, res) => {
    try {
        const sensorId = req.params.id;
        const { Reading_Time } = req.body; // Optional

        const result = await SensorModel.deleteSensorData(sensorId, Reading_Time);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Sensor data not found' });
        }
        res.status(200).json({ success: true, message: 'Sensor data deleted successfully' });
    } catch (error) {
        console.error('Error deleting sensor data:', error);
        res.status(500).json({ success: false, message: 'Server error deleting sensor data' });
    }
};

// Get telemetry history for charts (e.g. last 30 readings of temp/humidity)
exports.getTelemetryHistory = async (req, res) => {
    try {
        const history = await SensorModel.getHistoricalData(30); // 30 points
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        console.error('Error fetching telemetry history:', error);
        res.status(500).json({ success: false, message: 'Server error fetching history' });
    }
};

// NEW: Handlers for adding sensors
exports.getAllSensorTypes = async (req, res) => {
    try {
        const types = await SensorModel.getSensorTypes();
        res.status(200).json({ success: true, data: types });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await SensorModel.getRooms();
        res.status(200).json({ success: true, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addSensor = async (req, res) => {
    try {
        const { sensor_ID, sensortype_ID, Room_ID, Install_Date } = req.body;

        if (!sensor_ID || !sensortype_ID || !Room_ID || !Install_Date) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const exists = await SensorModel.checkSensorExists(sensor_ID);
        if (exists) {
            return res.status(400).json({ success: false, message: 'Sensor ID already exists' });
        }

        await SensorModel.createSensor(sensor_ID, sensortype_ID, Room_ID, Install_Date);
        res.status(201).json({ success: true, message: 'Sensor added successfully' });
    } catch (error) {
        console.error('Error adding sensor:', error);
        res.status(500).json({ success: false, message: 'Server error adding sensor' });
    }
};
