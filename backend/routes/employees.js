const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// POST /api/employees - Add new employee
router.post('/', employeeController.addEmployee);

// GET /api/employees/:company_id - Get all employees for a company
router.get('/:company_id', employeeController.getEmployees);

// PUT /api/employees/:employee_id/status - Update employee status
router.put('/:employee_id/status', employeeController.updateEmployeeStatus);

// GET /api/employees/admin/:admin_id - Get all employees for a given admin
router.get('/admin/:admin_id', employeeController.getEmployeesByAdmin);

module.exports = router; 