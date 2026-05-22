const AlertModel = require('../models/alertModel');

// GET /api/alerts
exports.getAllAlerts = async (req, res) => {
    try {
        const alerts = await AlertModel.getAllAlerts();
        res.status(200).json({ success: true, data: alerts });
    } catch (error) {
        console.error('Error fetching all alerts:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/alerts/active
exports.getActiveAlerts = async (req, res) => {
    try {
        const alerts = await AlertModel.getActiveAlerts();
        res.status(200).json({ success: true, data: alerts });
    } catch (error) {
        console.error('Error fetching active alerts:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /api/alerts/:id/resolve
exports.resolveAlert = async (req, res) => {
    try {
        const alertId = req.params.id;
        const { actionTaken } = req.body;
        
        if (!actionTaken) {
            return res.status(400).json({ success: false, message: 'Action taken is required for resolution' });
        }

        // Add maintenance record first
        await AlertModel.addMaintenance(alertId, actionTaken);
        
        // Then resolve the alert
        await AlertModel.resolveAlert(alertId);

        res.status(200).json({ success: true, message: 'Alert resolved successfully' });
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
