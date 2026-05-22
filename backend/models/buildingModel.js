const db = require('../config/db');

const BuildingModel = {
    // Get all buildings
    getAllBuildings: async () => {
        const query = `
            SELECT 
                Building_ID, 
                NAME AS Building_Name, 
                Location, 
                Type 
            FROM building
        `;
        const [rows] = await db.execute(query);
        return rows;
    },

    // Get a specific building by ID
    getBuildingById: async (id) => {
        const query = `
            SELECT 
                Building_ID, 
                NAME AS Building_Name, 
                Location, 
                Type 
            FROM building
            WHERE Building_ID = ?
        `;
        const [rows] = await db.execute(query, [id]);
        return rows[0];
    },

    // Get all rooms belonging to a building using JOINs
    getRoomsByBuilding: async (buildingId) => {
        const query = `
            SELECT r.Room_Number, f.Floor_Name, f.Floor_Number
            FROM room r
            JOIN floor f ON r.Floor_ID = f.Floor_ID
            WHERE f.Building_ID = ?
        `;
        const [rows] = await db.execute(query, [buildingId]);
        return rows;
    },

    // Create a new building
    createBuilding: async (name, location, type) => {
        // Get the next ID safely
        const [[{ maxId }]] = await db.execute('SELECT MAX(Building_ID) AS maxId FROM building');
        const nextId = (maxId || 0) + 1;

        const query = 'INSERT INTO building (Building_ID, NAME, Location, Type) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(query, [nextId, name, location, type]);
        result.insertId = nextId;
        return result;
    },

    // Delete a building
    deleteBuilding: async (id) => {
        // Because of foreign keys (floor -> room -> sensor), deleting a building requires CASCADE or manual deletion.
        // For this demo, let's just delete the building. If it fails due to FK constraint, we'll catch it.
        // Alternatively, we could delete floors and rooms first.
        
        // Let's do a safe multi-step delete since MySQL might not have CASCADE on by default in this schema.
        
        // 1. Get all floors
        const [floors] = await db.execute('SELECT Floor_ID FROM floor WHERE Building_ID = ?', [id]);
        for (let floor of floors) {
            // 2. Get all rooms on this floor
            const [rooms] = await db.execute('SELECT Room_ID FROM room WHERE Floor_ID = ?', [floor.Floor_ID]);
            for (let room of rooms) {
                // 3. Get all sensors in this room
                const [sensors] = await db.execute('SELECT sensor_ID FROM sensor WHERE Room_ID = ?', [room.Room_ID]);
                for (let sensor of sensors) {
                    // 4. Delete sensor data first (FK constraint)
                    await db.execute('DELETE FROM sensor_data WHERE sensor_ID = ?', [sensor.sensor_ID]);
                }
                // 5. Delete sensors in this room
                await db.execute('DELETE FROM sensor WHERE Room_ID = ?', [room.Room_ID]);
            }
            // 6. Delete rooms on this floor
            await db.execute('DELETE FROM room WHERE Floor_ID = ?', [floor.Floor_ID]);
        }
        // 7. Delete floors
        await db.execute('DELETE FROM floor WHERE Building_ID = ?', [id]);
        
        // 8. Delete building
        const query = 'DELETE FROM building WHERE Building_ID = ?';
        const [result] = await db.execute(query, [id]);
        return result;
    }
};

module.exports = BuildingModel;
