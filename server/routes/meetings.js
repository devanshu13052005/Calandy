const express = require('express');
const meetingsController = require('../controllers/meetingsController');

const router = express.Router();

router.get('/', meetingsController.list);
router.patch('/:id/cancel', meetingsController.cancel);
router.patch('/:id/reschedule', meetingsController.reschedule);

module.exports = router;
