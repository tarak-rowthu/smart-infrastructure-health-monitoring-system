const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/buildingController');

// GET /api/buildings
router.get('/', buildingController.getBuildings);

// POST /api/buildings (Add building)
router.post('/', buildingController.addBuilding);

// DELETE /api/buildings/:id (Remove building)
router.delete('/:id', buildingController.removeBuilding);

// GET /api/buildings/:id/rooms
router.get('/:id/rooms', buildingController.getBuildingRooms);

module.exports = router;
