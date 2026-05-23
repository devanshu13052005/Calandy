const express = require('express');
const eventTypesController = require('../controllers/eventTypesController');

const router = express.Router();

router.use(eventTypesController.ensureSchedules);

router.get('/', eventTypesController.list);
router.post('/', eventTypesController.create);
router.put('/:id', eventTypesController.update);
router.patch('/:id/toggle', eventTypesController.toggle);
router.delete('/:id', eventTypesController.remove);
router.get('/:id/questions', eventTypesController.listQuestions);
router.post('/:id/questions', eventTypesController.createQuestion);
router.delete('/:id/questions/:qid', eventTypesController.removeQuestion);

module.exports = router;
