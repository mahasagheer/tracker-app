const express = require('express');
const router = express.Router();

// Example: Hello route (modular)
router.use('/hello', require('./hello'));

// DB test route (modular)
router.use('/db-test', require('./dbTest'));

// Admin route
router.use('/admin', require('./admin'));

// Employees route
router.use('/employees', require('./employees'));

// Projects route
router.use('/projects', require('./projects'));

// Unified auth route
router.use('/auth', require('./auth'));

// Sync route
router.use('/sync', require('./sync'));

// Future: router.use('/users', require('./users'));
// Future: router.use('/employees', require('./employees'));

module.exports = router; 