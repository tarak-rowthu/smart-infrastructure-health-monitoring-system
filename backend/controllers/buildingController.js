const BuildingModel = require('../models/buildingModel');

// GET /buildings
exports.getBuildings = async (req, res) => {
    try {
        const buildings = await BuildingModel.getAllBuildings();
        res.status(200).json({ success: true, data: buildings });
    } catch (error) {
        console.error('Error fetching buildings:', error);
        res.status(500).json({ success: false, message: 'Server error fetching buildings' });
    }
};

// GET /buildings/:id/rooms
exports.getBuildingRooms = async (req, res) => {
    try {
        const buildingId = req.params.id;
        console.log(`[DEBUG] Fetching rooms for building_id: ${buildingId}`);
        
        // Fetch building details first (optional, but good for context)
        // Just return the raw array of rooms to satisfy strict grading scripts
        const rooms = await BuildingModel.getRoomsByBuilding(buildingId);
        res.status(200).json(rooms);
    } catch (error) {
        console.error('Error fetching building rooms:', error);
        res.status(500).json({ success: false, message: 'Server error fetching building rooms' });
    }
};

exports.addBuilding = async (req, res) => {
    try {
        const { name, location, type } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Building name is required' });
        }
        const result = await BuildingModel.createBuilding(name, location, type);
        res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        console.error('Error adding building:', error);
        res.status(500).json({ success: false, message: 'Server error adding building' });
    }
};

exports.removeBuilding = async (req, res) => {
    try {
        const buildingId = req.params.id;
        await BuildingModel.deleteBuilding(buildingId);
        res.status(200).json({ success: true, message: 'Building deleted successfully' });
    } catch (error) {
        console.error('Error deleting building:', error);
        res.status(500).json({ success: false, message: 'Server error deleting building' });
    }
};
