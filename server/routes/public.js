const express = require('express');
const publicController = require('../controllers/publicController');

const router = express.Router();

router.get('/cancel/:token', publicController.getCancelBooking);
router.patch('/cancel/:token', publicController.cancelBooking);
router.get('/reschedule/:token', publicController.getRescheduleBooking);
router.post('/reschedule/:token', publicController.rescheduleBooking);
router.get('/:slug', publicController.getEventType);
router.get('/:slug/slots', publicController.getSlots);
router.post('/:slug/book', publicController.book);

module.exports = router;
