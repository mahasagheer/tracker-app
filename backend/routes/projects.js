const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// Create project
router.post('/', projectController.createProject);
// Get all projects for company
router.get('/', projectController.getProjects);
// Update project
router.put('/:id', projectController.updateProject);
// Delete project
router.delete('/:id', projectController.deleteProject);

// Assign members to a project
router.post('/:id/members', projectController.assignMembers);
// Get all members for a project
router.get('/:id/members', projectController.getMembers);
// Remove a member from a project
router.delete('/:id/members/:employee_id', projectController.removeMember);

module.exports = router; 