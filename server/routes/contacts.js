const express = require('express');
const contactsController = require('../controllers/contactsController');

const router = express.Router();

router.get('/', contactsController.list);

module.exports = router;
