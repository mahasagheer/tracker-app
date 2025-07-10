const express = require('express');
const router = express.Router();

// Example: Hello route (modular)
router.use('/hello', require('./hello'));

// DB test route (modular)
router.use('/db-test', require('./dbTest'));

// Admin route
router.use('/admin', require('./admin'));

// Future: router.use('/users', require('./users'));
// Future: router.use('/employees', require('./employees'));

module.exports = router; 