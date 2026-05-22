const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// GET /api/alerts
router.get('/', alertController.getAllAlerts);

// GET /api/alerts/active
router.get('/active', alertController.getActiveAlerts);

// PUT /api/alerts/:id/resolve
router.put('/:id/resolve', alertController.resolveAlert);

module.exports = router;
