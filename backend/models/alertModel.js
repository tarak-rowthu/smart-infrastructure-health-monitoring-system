const db = require('../config/db');

const AlertModel = {
    // Get all alerts with related sensor data
    getAllAlerts: async () => {
        const query = `
            SELECT 
                a.Alert_ID,
                a.Alert_Message,
                a.Alert_Time,
                a.Status,
                sd.reading_Value,
                st.Type_Name,
                st.Unit,
                r.Room_Number,
                m.Action_taken,
                m.maintenance_data
            FROM alert a
            JOIN sensor_data sd ON a.Data_ID = sd.data_ID
            JOIN sensor s ON sd.sensor_ID = s.Sensor_ID
            JOIN sensor_type st ON s.sensortype_ID = st.sensortype_ID
            JOIN room r ON s.Room_ID = r.Room_ID
            LEFT JOIN maintenance m ON a.Alert_ID = m.alert_ID
            ORDER BY a.Alert_Time DESC
        `;
        const [rows] = await db.execute(query);
        return rows;
    },

    // Get only active alerts
    getActiveAlerts: async () => {
        const query = `
            SELECT 
                a.Alert_ID,
                a.Alert_Message,
                a.Alert_Time,
                a.Status,
                sd.reading_Value,
                st.Type_Name,
                r.Room_Number
            FROM alert a
            JOIN sensor_data sd ON a.Data_ID = sd.data_ID
            JOIN sensor s ON sd.sensor_ID = s.Sensor_ID
            JOIN sensor_type st ON s.sensortype_ID = st.sensortype_ID
            JOIN room r ON s.Room_ID = r.Room_ID
            WHERE a.Status = 'Active'
            ORDER BY a.Alert_Time DESC
        `;
        const [rows] = await db.execute(query);
        return rows;
    },

    // Create a new alert
    createAlert: async (dataId, message) => {
        const [[{ maxId }]] = await db.execute('SELECT MAX(Alert_ID) AS maxId FROM alert');
        const nextId = (maxId || 0) + 1;

        const query = `
            INSERT INTO alert (Alert_ID, Data_ID, Alert_Message, Alert_Time, Status)
            VALUES (?, ?, ?, NOW(), 'Active')
        `;
        const [result] = await db.execute(query, [nextId, dataId, message]);
        return nextId;
    },

    // Resolve an alert
    resolveAlert: async (alertId) => {
        const query = `UPDATE alert SET Status = 'Resolved' WHERE Alert_ID = ?`;
        await db.execute(query, [alertId]);
    },

    // Add maintenance record
    addMaintenance: async (alertId, actionTaken) => {
        const [[{ maxId }]] = await db.execute('SELECT MAX(maintenance_ID) AS maxId FROM maintenance');
        const nextId = (maxId || 0) + 1;

        const query = `
            INSERT INTO maintenance (maintenance_ID, alert_ID, Action_taken, maintenance_data)
            VALUES (?, ?, ?, NOW())
        `;
        await db.execute(query, [nextId, alertId, actionTaken]);
    }
};

module.exports = AlertModel;
