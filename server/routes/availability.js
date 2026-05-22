const express = require('express');
const availabilityController = require('../controllers/availabilityController');

const router = express.Router();

router.get('/', availabilityController.get);
router.put('/', availabilityController.update);
router.get('/overrides', availabilityController.listOverrides);
router.post('/overrides', availabilityController.createOverride);
router.delete('/overrides/:id', availabilityController.removeOverride);

module.exports = router;
