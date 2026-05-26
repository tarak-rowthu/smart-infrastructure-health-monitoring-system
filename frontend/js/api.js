const BACKEND_URL = 'https://smart-infrastructure-health-monitoring.onrender.com';
const API_BASE_URL = `${BACKEND_URL}/api`;

const api = {
    // Fetch all sensors
    getSensors: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/sensors`);
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching sensors:', error);
            return [];
        }
    },

    // Fetch all sensor data
    getSensorData: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/sensor-data`);
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching sensor data:', error);
            return [];
        }
    },

    // Fetch abnormal readings
    getAbnormalReadings: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/sensor-data/abnormal`);
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching abnormal readings:', error);
            return [];
        }
    },

    // Fetch all buildings
    getBuildings: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/buildings`);
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching buildings:', error);
            return [];
        }
    },

    // Fetch rooms for a specific building
    getBuildingRooms: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/buildings/${id}/rooms`);
            const result = await response.json();
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Error fetching building rooms:', error);
            return null;
        }
    },

    // Alerts
    getAllAlerts: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/alerts`);
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching alerts:', error);
            return [];
        }
    },

    getActiveAlerts: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/alerts/active`);
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching active alerts:', error);
            return [];
        }
    },

    resolveAlert: async (id, actionTaken) => {
        try {
            const response = await fetch(`${API_BASE_URL}/alerts/${id}/resolve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actionTaken })
            });
            return await response.json();
        } catch (error) {
            console.error('Error resolving alert:', error);
            return { success: false, message: 'Network error' };
        }
    },

    getTelemetryHistory: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/sensor-data/history`);
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching telemetry history:', error);
            return [];
        }
    },

    addBuilding: async (name, location, type) => {
        try {
            const response = await fetch(`${API_BASE_URL}/buildings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, location, type })
            });
            return await response.json();
        } catch (error) {
            console.error('Error adding building:', error);
            return { success: false, message: 'Network error' };
        }
    },

    deleteBuilding: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/buildings/${id}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting building:', error);
            return { success: false, message: 'Network error' };
        }
    }
};
