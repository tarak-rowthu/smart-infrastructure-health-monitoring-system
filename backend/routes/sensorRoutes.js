const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

// Define API routes
router.get('/sensors', sensorController.getSensors);
router.get('/sensor-data/history', sensorController.getTelemetryHistory);
router.get('/sensor-data/abnormal', sensorController.getAbnormalReadings); // Must be before /:id
router.get('/sensor-data', sensorController.getSensorData);
router.post('/sensor-data', sensorController.addSensorData);
router.put('/sensor-data/:id', sensorController.updateSensorData);
router.delete('/sensor-data/:id', sensorController.deleteSensorData);
router.get('/sensors/:id/data', sensorController.getSensorData);

// NEW: Add Sensor routes
router.get('/sensor-types', sensorController.getAllSensorTypes);
router.get('/rooms', sensorController.getAllRooms);
router.post('/sensors', sensorController.addSensor);

module.exports = router;
