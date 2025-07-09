const express = require('express');
const router = express.Router();
const dbTestController = require('../controllers/dbTestController');

router.get('/', dbTestController.testDb);

module.exports = router; 