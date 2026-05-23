const express = require('express');
const schedulesController = require('../controllers/schedulesController');
const { ensureSchedules } = require('../controllers/eventTypesController');

const router = express.Router();

router.use(ensureSchedules);

router.get('/', schedulesController.list);
router.post('/', schedulesController.create);
router.put('/:id', schedulesController.update);
router.delete('/:id', schedulesController.remove);
router.post('/:id/duplicate', schedulesController.duplicate);

module.exports = router;
